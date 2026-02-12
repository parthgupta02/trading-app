
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Constants for mobile -> email conversion
    const FAKE_DOMAIN = "@trade-tracker.app";
    const PHONE_PREFIX = "phone-";
    const APP_ID = 'default-app-id'; // Keeping this consistent with original

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const convertMobileToEmail = (mobile) => {
        return `${PHONE_PREFIX}${mobile}${FAKE_DOMAIN}`;
    };

    const extractMobileFromEmail = (email) => {
        if (!email) return '';
        return email.replace(PHONE_PREFIX, "").split('@')[0];
    };

    const login = (mobile, password) => {
        const email = convertMobileToEmail(mobile);
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (fullName, mobile, password) => {
        const email = convertMobileToEmail(mobile);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Create Profile Document immediately after registration
        if (newUser) {
            await setDoc(doc(db, 'artifacts', APP_ID, 'user_profiles', newUser.uid), {
                fullName: fullName,
                email: email // We store the fake email or could ask for a real one optional
            });
        }
        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        login,
        register,
        logout,
        convertMobileToEmail,
        extractMobileFromEmail,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
