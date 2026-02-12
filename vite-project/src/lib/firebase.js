
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYy9FONBnwilc2f3WdTCGFQ2-W3jQvE3E",
    authDomain: "parth-trading.firebaseapp.com",
    projectId: "parth-trading",
    storageBucket: "parth-trading.firebasestorage.app",
    messagingSenderId: "629101446151",
    appId: "1:629101446151:web:d91110064a8889497916a2",
    measurementId: "G-7JQ523ETHN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
