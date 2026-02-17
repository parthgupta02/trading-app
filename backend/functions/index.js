const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });
require("dotenv").config();

admin.initializeApp();

// Initialize Razorpay
// TODO: Replace with actual keys or use Firebase config
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_KEY_SECRET",
});

/**
 * Creates a Razorpay Subscription
 * Expects: { planId: string, total_count: number }
 */
exports.createSubscription = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).send({ error: 'Method Not Allowed' });
            }

            const { planId, total_count = 12 } = req.body; // Default 12 cycles

            if (!planId) {
                return res.status(400).send({ error: 'Missing planId' });
            }

            const subscription = await razorpay.subscriptions.create({
                plan_id: planId,
                total_count: total_count,
                quantity: 1,
                customer_notify: 1,
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
});

/**
 * Verifies Razorpay Payment Signature for Subscription
 * Expects: { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 */
exports.verifyPayment = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
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

            // Verification formula: hmac_sha256(razorpay_payment_id + "|" + subscription_id, secret)
            const generated_signature = crypto
                .createHmac("sha256", secret)
                .update(razorpay_payment_id + "|" + razorpay_subscription_id)
                .digest("hex");

            if (generated_signature === razorpay_signature) {
                // Payment is successful
                // TODO: Update user status in Firestore
                // const userId = req.body.userId;
                // await admin.firestore().collection('users').doc(userId).update({ ... });

                return res.status(200).json({ status: "success", message: "Payment verified successfully" });
            } else {
                return res.status(400).send({ error: "Invalid signature" });
            }

        } catch (error) {
            console.error("Error verifying payment:", error);
            return res.status(500).send({ error: error.message });
        }
    });
});

/**
 * Cancels a Subscription
 * Expects: { subscriptionId: string }
 */
exports.cancelSubscription = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
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
});
