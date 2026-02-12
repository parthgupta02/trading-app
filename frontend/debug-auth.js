
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from "firebase/auth";

// Config
const firebaseConfig = {
    apiKey: "AIzaSyAYy9FONBnwilc2f3WdTCGFQ2-W3jQvE3E",
    authDomain: "parth-trading.firebaseapp.com",
    projectId: "parth-trading",
    storageBucket: "parth-trading.firebasestorage.app",
    messagingSenderId: "629101446151",
    appId: "1:629101446151:web:d91110064a8889497916a2",
    measurementId: "G-7JQ523ETHN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const mobile = "9685889940";
const email = `phone-${mobile}@trade-tracker.app`;
const tempPassword = "TempPassword123!";

console.log(`Checking user: ${email}`);

async function verifyUser() {
    try {
        // Try to create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);

        // If successful, user DID NOT exist.
        const user = userCredential.user;
        console.log("Status: User CREATED (did not exist before)");
        console.log(JSON.stringify({ exists: false, uid: user.uid }, null, 2));

        // Cleanup
        try {
            await deleteUser(user);
            console.log("(Cleaned up/Deleted temporary user)");
        } catch (cleanupErr) {
            console.error("Cleanup failed", cleanupErr);
        }

    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("Status: User EXISTS");
            console.log(JSON.stringify({ exists: true, code: error.code }, null, 2));
        } else {
            console.log(`Status: Error (${error.code})`);
            console.log(JSON.stringify({ error: error.message, code: error.code }, null, 2));
        }
    }
    // Exit process
    process.exit(0);
}

verifyUser();
