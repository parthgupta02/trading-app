
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from '../../../shared/lib/firebase';

export interface SubscriptionData {
    plan: string;
    status: string;
    startedAt?: string;
    expiresAt?: any;
    currentPeriodEnd?: number; // Unix timestamp in seconds
    razorpaySubscriptionId?: string;
    razorpayPaymentId?: string;
    restoredAt?: string;
    note?: string;
    freeTrialUsed?: boolean;
}

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    hasActiveSubscription: boolean;
    subscriptionData: SubscriptionData | null;
    login: (mobile: string, password: string) => Promise<UserCredential>;
    register: (fullName: string, mobile: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    convertMobileToEmail: (mobile: string) => string;
    extractMobileFromEmail: (email: string | null) => string;
    activateFreeTrial: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
    deleteAccount: (password: string) => Promise<void>;
    freeTrialUsed: boolean;
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
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
    const [freeTrialUsed, setFreeTrialUsed] = useState(false);

    // Constants for mobile -> email conversion
    const FAKE_DOMAIN = "@trade-tracker.app";
    const PHONE_PREFIX = "phone-";
    const APP_ID = 'default-app-id'; // Keeping this consistent with original

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                // Check subscription status from Firestore
                await checkSubscription(user.uid);
            } else {
                setHasActiveSubscription(false);
                setSubscriptionData(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const checkSubscription = async (uid: string) => {
        try {
            const docPath = `artifacts/${APP_ID}/subscriptions/${uid}`;
            console.log('[Subscription] Checking subscription at path:', docPath);
            const subDoc = await getDoc(doc(db, 'artifacts', APP_ID, 'subscriptions', uid));
            console.log('[Subscription] Document exists:', subDoc.exists());
            if (subDoc.exists()) {
                const data = subDoc.data();
                console.log('[Subscription] Document data:', JSON.stringify(data, null, 2));
                const now = new Date();

                // Track if free trial was ever used (even if expired)
                if (data.plan === 'free') {
                    setFreeTrialUsed(true);
                }

                // Resolve expiry: prefer currentPeriodEnd (seconds) -> Date, else expiresAt
                let resolvedExpiresAt: Date | null = null;

                if (data.currentPeriodEnd) {
                    resolvedExpiresAt = new Date(data.currentPeriodEnd * 1000);
                } else if (data.expiresAt) {
                    resolvedExpiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
                }

                // Store subscription data for display
                setSubscriptionData({
                    plan: data.plan || 'unknown',
                    status: data.status || 'inactive',
                    startedAt: data.startedAt,
                    expiresAt: resolvedExpiresAt, // normalized to Date object
                    currentPeriodEnd: data.currentPeriodEnd,
                    razorpaySubscriptionId: data.razorpaySubscriptionId,
                    razorpayPaymentId: data.razorpayPaymentId,
                    restoredAt: data.restoredAt,
                    note: data.note,
                    freeTrialUsed: data.plan === 'free',
                });

                // Check if subscription is still active
                if (data.status === 'active' && resolvedExpiresAt) {
                    const isActive = resolvedExpiresAt > now;
                    console.log('[Subscription] Expiry check:', isActive, 'Expires:', resolvedExpiresAt, 'Now:', now);
                    setHasActiveSubscription(isActive);
                } else if (data.status === 'active') {
                    console.log('[Subscription] Active subscription without expiry — setting active');
                    setHasActiveSubscription(true);
                } else {
                    console.log('[Subscription] Status is not active:', data.status);
                    setHasActiveSubscription(false);
                }
            } else {
                console.log('[Subscription] No subscription document found for uid:', uid);
                setHasActiveSubscription(false);
                setSubscriptionData(null);
                setFreeTrialUsed(false);
            }
        } catch (error) {
            console.error('[Subscription] Error checking subscription:', error);
            setHasActiveSubscription(false);
        }
    };

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

    const activateFreeTrial = async () => {
        if (!currentUser) return;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks

        await setDoc(doc(db, 'artifacts', APP_ID, 'subscriptions', currentUser.uid), {
            plan: 'free',
            status: 'active',
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        });

        setHasActiveSubscription(true);
    };

    const refreshSubscription = async () => {
        if (currentUser) {
            await checkSubscription(currentUser.uid);
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    const deleteAccount = async (password: string) => {
        if (!currentUser || !currentUser.email) return;

        const uid = currentUser.uid;

        try {
            // 0. Re-authenticate the user (required by Firebase before account deletion)
            const credential = EmailAuthProvider.credential(currentUser.email, password);
            await reauthenticateWithCredential(currentUser, credential);

            // 1. Delete User Profile
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'user_profiles', uid));

            // 2. Delete Subscription Data
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'subscriptions', uid));

            // 3. Delete Commodity Trades (Subcollection)
            const tradesRef = collection(db, `artifacts/${APP_ID}/users/${uid}/commodity_trades`);
            const snapshot = await getDocs(tradesRef);
            const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, `artifacts/${APP_ID}/users/${uid}/commodity_trades`, docSnap.id)));
            await Promise.all(deletePromises);

            // 4. Delete User Data Document
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', uid));

            // 5. Delete User from Firebase Auth
            await currentUser.delete();

        } catch (error: any) {
            console.error("Error deleting account:", error);
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('Incorrect password. Please try again.');
            }
            throw error;
        }
    };

    const value: AuthContextType = {
        currentUser,
        login,
        register,
        logout,
        convertMobileToEmail,
        extractMobileFromEmail,
        loading,
        hasActiveSubscription,
        subscriptionData,
        activateFreeTrial,
        refreshSubscription,
        deleteAccount,
        freeTrialUsed,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
