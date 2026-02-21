const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });
require("dotenv").config();

admin.initializeApp();

const db = admin.firestore();
const APP_ID = "default-app-id";

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
});

/**
 * Creates a Razorpay Subscription
 * Expects: { planId: string, userId: string, total_count?: number }
 *
 * Embeds firebase_uid in notes so the webhook can map events to users.
 */
exports.createSubscription = onRequest({ cors: true }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method Not Allowed' });
        }

        const { planId, userId, total_count = 12 } = req.body;

        if (!planId || !userId) {
            return res.status(400).send({ error: 'Missing planId or userId' });
        }

        let customer;
        try {
            const subDoc = await db.doc(`artifacts/${APP_ID}/subscriptions/${userId}`).get();
            if (subDoc.exists && subDoc.data().razorpayCustomerId) {
                customer = await razorpay.customers.fetch(subDoc.data().razorpayCustomerId);
            }
        } catch (err) {
            console.warn("Existing customer fetch failed:", err.message);
        }

        if (!customer) {
            let userRecord;
            try {
                userRecord = await admin.auth().getUser(userId);
            } catch (err) {
                console.warn("Failed to fetch user from Firebase Auth:", err.message);
            }

            customer = await razorpay.customers.create({
                name: userRecord?.displayName || "User",
                email: userRecord?.email || undefined,
                notes: {
                    firebase_uid: userId
                }
            });
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            total_count: total_count,
            quantity: 1,
            customer_notify: 1,
            customer_id: customer.id
        });

        return res.status(200).json({
            subscription_id: subscription.id,
            short_url: subscription.short_url,
            status: subscription.status
        });

    } catch (error) {
        console.error("Error creating subscription:", error);
        return res.status(500).send({ error: error.message });
    }
});

/**
 * Verifies Razorpay Payment Signature for Subscription (signature-only).
 * Does NOT activate subscription — that happens via webhook.
 *
 * Expects: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 */
exports.verifyPayment = onRequest({ cors: true }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method Not Allowed' });
        }

        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return res.status(400).send({ error: 'Missing required payment details' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET";

        // Verification: hmac_sha256(payment_id + "|" + subscription_id, secret)
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_payment_id + "|" + razorpay_subscription_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {
            // Signature valid — subscription activation will happen via webhook
            return res.status(200).json({
                status: "success",
                message: "Payment verified. Subscription will be activated via webhook."
            });
        } else {
            return res.status(400).send({ error: "Invalid signature" });
        }

    } catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).send({ error: error.message });
    }
});

/**
 * Cancels a Subscription
 * Expects: { subscriptionId: string }
 */
exports.cancelSubscription = onRequest({ cors: true }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method Not Allowed' });
        }

        const { subscriptionId } = req.body;

        if (!subscriptionId) {
            return res.status(400).send({ error: 'Missing subscriptionId' });
        }

        const response = await razorpay.subscriptions.cancel(subscriptionId);

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error canceling subscription:", error);
        return res.status(500).send({ error: error.message });
    }
});

/* ═══════════════════════════════════════════════════════════════════════════
 * RAZORPAY WEBHOOK
 *
 * Receives events from Razorpay and updates Firestore accordingly.
 * This is the ONLY place where subscription status is written.
 *
 * Webhook URL (after deploy checks):
 *   https://razorpaywebhook-[project-id]-[region].a.run.app (Gen 2 URL format)
 *
 * Required env var: RAZORPAY_WEBHOOK_SECRET
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Resolve the Firebase UID from a Razorpay subscription entity.
 * Reads notes.firebase_uid — the UID we embedded during createSubscription.
 * Falls back to fetching the subscription from Razorpay API if notes are missing.
 */
async function resolveFirebaseUid(subscriptionEntity) {
    // 1. Try notes on the entity directly
    if (subscriptionEntity?.notes?.firebase_uid) {
        return subscriptionEntity.notes.firebase_uid;
    }

    // 2. Fetch subscription from Razorpay API to get notes
    if (subscriptionEntity?.id) {
        try {
            const fetched = await razorpay.subscriptions.fetch(subscriptionEntity.id);
            if (fetched?.notes?.firebase_uid) {
                return fetched.notes.firebase_uid;
            }
        } catch (err) {
            console.error("Failed to fetch subscription from Razorpay:", err);
        }
    }

    return null;
}

exports.razorpayWebhook = onRequest({ secrets: ["RAZORPAY_WEBHOOK_SECRET"] }, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send({ error: 'Method Not Allowed' });
        }

        // ── 1. Verify webhook signature ──────────────────────────────────────
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
            return res.status(500).send({ error: "Webhook secret not configured" });
        }

        const receivedSignature = req.headers["x-razorpay-signature"];
        if (!receivedSignature) {
            console.warn("Webhook request missing x-razorpay-signature header");
            return res.status(400).send({ error: "Missing signature" });
        }

        // Firebase Cloud Functions parses JSON body automatically.
        // We need the raw body for signature verification.
        const rawBody = req.rawBody;
        if (!rawBody) {
            console.error("Raw body not available for signature verification");
            return res.status(400).send({ error: "Cannot verify signature" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== receivedSignature) {
            console.warn("Invalid webhook signature");
            return res.status(400).send({ error: "Invalid signature" });
        }

        // ── 2. Idempotency Check ─────────────────────────────────────────────
        const eventId = req.headers["x-razorpay-event-id"];
        if (eventId) {
            const eventDoc = await db.collection("webhookEvents").doc(eventId).get();
            if (eventDoc.exists) {
                console.log(`[Webhook] Duplicate event ${eventId} already processed. Skipping.`);
                return res.status(200).json({ status: "ok", message: "Already processed" });
            }
        }

        // ── 3. Parse event ───────────────────────────────────────────────────
        const event = req.body;
        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Webhook] Received event: ${eventType} (ID: ${eventId})`);

        // ── 4. Route event to handler ────────────────────────────────────────
        let processed = false;
        switch (eventType) {
            case "subscription.activated":
                await handleSubscriptionActivated(payload);
                processed = true;
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(payload);
                processed = true;
                break;

            case "subscription.halted":
            case "subscription.cancelled":
                await handleSubscriptionInactive(payload, eventType);
                processed = true;
                break;

            case "payment.failed":
                await handlePaymentFailed(payload);
                processed = true;
                break;

            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }

        // ── 5. Record Processed Event ────────────────────────────────────────
        if (eventId && processed) {
            await db.collection("webhookEvents").doc(eventId).set({
                type: eventType,
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // Always return 200 to acknowledge receipt (Razorpay retries on non-2xx)
        return res.status(200).json({ status: "ok" });

    } catch (error) {
        console.error("[Webhook] Error processing webhook:", error);
        // Return 200 anyway to prevent Razorpay from retrying on application errors
        return res.status(200).json({ status: "error", message: "Processed with errors" });
    }
});

/* ─── Event Handlers ────────────────────────────────────────────────────── */

/**
 * subscription.activated
 * First-time activation — write the full subscription document.
 */
async function handleSubscriptionActivated(payload) {
    const subscription = payload.subscription?.entity;
    if (!subscription) {
        console.warn("[Webhook] subscription.activated: missing subscription entity");
        return;
    }

    const uid = await resolveFirebaseUid(subscription);
    if (!uid) {
        console.error("[Webhook] subscription.activated: cannot resolve firebase_uid for subscription", subscription.id);
        return;
    }

    // Determine plan type from plan interval or amount
    const planType = determinePlanType(subscription);

    const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${uid}`);
    await docRef.set({
        plan: planType,
        status: "active",
        subscriptionId: subscription.id,
        razorpayCustomerId: subscription.customer_id || null,
        razorpaySubscriptionId: subscription.id,
        // STORAGE CHANGE: Store as Unix timestamp (seconds) for efficient numerical comparison
        currentPeriodEnd: subscription.current_end || null,
        startedAt: subscription.created_at
            ? new Date(subscription.created_at * 1000).toISOString()
            : new Date().toISOString(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Webhook] subscription.activated: activated for uid=${uid}, subscriptionId=${subscription.id}`);
}

/**
 * subscription.charged
 * Renewal payment succeeded — update period end and keep active.
 */
async function handleSubscriptionCharged(payload) {
    const subscription = payload.subscription?.entity;
    if (!subscription) {
        console.warn("[Webhook] subscription.charged: missing subscription entity");
        return;
    }

    const uid = await resolveFirebaseUid(subscription);
    if (!uid) {
        console.error("[Webhook] subscription.charged: cannot resolve firebase_uid for subscription", subscription.id);
        return;
    }

    // STORAGE CHANGE: Store as Unix timestamp (seconds)
    const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${uid}`);
    await docRef.set({
        status: "active",
        currentPeriodEnd: subscription.current_end || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Webhook] subscription.charged: renewed for uid=${uid}`);
}

/**
 * subscription.halted / subscription.cancelled
 * Mark subscription inactive.
 */
async function handleSubscriptionInactive(payload, eventType) {
    const subscription = payload.subscription?.entity;
    if (!subscription) {
        console.warn(`[Webhook] ${eventType}: missing subscription entity`);
        return;
    }

    const uid = await resolveFirebaseUid(subscription);
    if (!uid) {
        console.error(`[Webhook] ${eventType}: cannot resolve firebase_uid for subscription`, subscription.id);
        return;
    }

    const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${uid}`);
    await docRef.set({
        status: "inactive",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Webhook] ${eventType}: marked inactive for uid=${uid}`);
}

/**
 * payment.failed
 * Mark subscription inactive on payment failure.
 */
async function handlePaymentFailed(payload) {
    const payment = payload.payment?.entity;
    if (!payment) {
        console.warn("[Webhook] payment.failed: missing payment entity");
        return;
    }

    // payment.failed may not have subscription entity directly.
    // Try to get subscription_id from payment notes or invoice.
    const subscriptionId = payment.subscription_id;
    if (!subscriptionId) {
        console.warn("[Webhook] payment.failed: no subscription_id on payment entity, skipping");
        return;
    }

    // Fetch subscription to get the firebase_uid from notes
    let uid = null;
    try {
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        uid = subscription?.notes?.firebase_uid || null;
    } catch (err) {
        console.error("[Webhook] payment.failed: failed to fetch subscription:", err);
        return;
    }

    if (!uid) {
        console.error("[Webhook] payment.failed: cannot resolve firebase_uid for subscription", subscriptionId);
        return;
    }

    const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${uid}`);
    await docRef.set({
        status: "inactive",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Webhook] payment.failed: marked inactive for uid=${uid}`);
}

/* ─── Validation Helpers ────────────────────────────────────────────────── */

/**
 * Validates if a user has an active subscription.
 * Checks:
 * 1. status === 'active'
 * 2. currentPeriodEnd > start of today (grace period can be added if needed)
 *
 * @param {string} uid - The Firebase User ID
 * @returns {Promise<boolean>} - True if valid, false otherwise.
 */
async function validateSubscription(uid) {
    if (!uid) return false;

    try {
        const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${uid}`);
        const snap = await docRef.get();

        if (!snap.exists) return false;

        const data = snap.data();
        if (data.status !== 'active') return false;

        // Check if expired
        // currentPeriodEnd is stored as Unix timestamp (seconds)
        const nowSeconds = Math.floor(Date.now() / 1000);

        if (data.currentPeriodEnd && data.currentPeriodEnd < nowSeconds) {
            console.log(`[Validation] Subscription expired for ${uid}. Ends: ${data.currentPeriodEnd}, Now: ${nowSeconds}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`[Validation] Error checking subscription for ${uid}:`, error);
        return false;
    }
}

/* ─── Scheduled Tasks ───────────────────────────────────────────────────── */

/**
 * Auto-Expire Subscriptions
 * Runs every 24 hours.
 * Uses Cloud Functions v2 scheduler (defaults to UTC).
 * Checks for subscriptions where:
 * - status == 'active'
 * - currentPeriodEnd < now
 * And marks them as 'inactive'.
 */
exports.checkExpiredSubscriptions = onSchedule("every 24 hours", async (context) => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    console.log(`[Auto-Expire] Running check at ${new Date().toISOString()} (Timestamp: ${nowSeconds})`);

    try {
        const snapshot = await db.collection(`artifacts/${APP_ID}/subscriptions`)
            .where('status', '==', 'active')
            .where('currentPeriodEnd', '<', nowSeconds)
            .get();

        if (snapshot.empty) {
            console.log('[Auto-Expire] No expired subscriptions found.');
            return;
        }

        console.log(`[Auto-Expire] Found ${snapshot.size} expired subscriptions. Processing...`);

        const batch = db.batch();
        let count = 0;

        snapshot.forEach(doc => {
            batch.update(doc.ref, {
                status: 'inactive',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                note: 'Auto-expired by system check'
            });
            count++;
        });

        await batch.commit();
        console.log(`[Auto-Expire] Successfully marked ${count} subscriptions as inactive.`);

    } catch (error) {
        console.error('[Auto-Expire] Error running expiry check:', error);
    }
});

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Determine plan type (monthly/yearly) from subscription plan interval.
 */
function determinePlanType(subscription) {
    // Razorpay subscription entity has plan_id but not interval directly.
    // We map known plan IDs or default to "monthly".
    const planId = subscription.plan_id;

    // Known plan IDs — extend this map as you add plans
    const PLAN_MAP = {
        "plan_SHEbDwd8JZFPZQ": "monthly",
        // "plan_XXXXXXXX": "yearly",  // Add yearly plan ID when ready
    };

    return PLAN_MAP[planId] || "monthly";
}

