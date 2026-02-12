
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../lib/firebase';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (mobile: string, password: string) => Promise<UserCredential>;
    register: (fullName: string, mobile: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    convertMobileToEmail: (mobile: string) => string;
    extractMobileFromEmail: (email: string | null) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
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

    const convertMobileToEmail = (mobile: string) => {
        return `${PHONE_PREFIX}${mobile}${FAKE_DOMAIN}`;
    };

    const extractMobileFromEmail = (email: string | null) => {
        if (!email) return '';
        return email.replace(PHONE_PREFIX, "").split('@')[0];
    };

    const login = (mobile: string, password: string) => {
        const email = convertMobileToEmail(mobile);
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (fullName: string, mobile: string, password: string) => {
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

    const value: AuthContextType = {
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
