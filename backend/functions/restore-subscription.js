/**
 * One-time script to restore a missing subscription document in Firestore.
 * 
 * Usage: node restore-subscription.js
 * 
 * This creates the subscription document for the user whose Razorpay payment
 * succeeded but whose Firestore write was blocked by permission rules.
 */
const admin = require("firebase-admin");

admin.initializeApp({
    projectId: "parth-trading",
});

const db = admin.firestore();

const USER_UID = "URFrk3lJsdTFaVTZFhYSVlFcuJ12";
const APP_ID = "default-app-id";

async function restoreSubscription() {
    const docRef = db.doc(`artifacts/${APP_ID}/subscriptions/${USER_UID}`);

    await docRef.set({
        plan: "monthly",
        status: "active",
        startedAt: new Date().toISOString(),
        restoredAt: new Date().toISOString(),
        note: "Restored — original write was blocked by Firestore permissions",
    });

    console.log(`✅ Subscription doc created at: artifacts/${APP_ID}/subscriptions/${USER_UID}`);
}

restoreSubscription()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Failed:", err);
        process.exit(1);
    });
