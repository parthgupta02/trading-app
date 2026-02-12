
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Trade } from '../types';

interface UserProfile {
    fullName: string;
    email: string;
    [key: string]: any;
}

interface DataContextType {
    trades: Trade[];
    profile: UserProfile;
    loadingData: boolean;
    APP_ID: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

interface DataProviderProps {
    children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { currentUser } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [profile, setProfile] = useState<UserProfile>({ fullName: '', email: '' });
    const [loadingData, setLoadingData] = useState(false);

    const APP_ID = 'default-app-id'; // Critical for matching existing data path

    useEffect(() => {
        if (!currentUser) {
            setTrades([]);
            setProfile({ fullName: '', email: '' });
            return;
        }

        setLoadingData(true);

        // 1. Listen for Trades
        const tradesPath = `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`;
        const q = query(collection(db, tradesPath));

        const unsubscribeTrades = onSnapshot(q, (querySnapshot) => {
            const tradeList: Trade[] = [];
            querySnapshot.forEach((doc) => {
                tradeList.push({ id: doc.id, ...doc.data() });
            });
            setTrades(tradeList);
            setLoadingData(false);
        }, (error) => {
            console.error("Error listening to trades:", error);
            setLoadingData(false);
        });

        // 2. Fetch Profile (One-time or listener? Listener is better for consistency)
        // Original app used one-time fetch on login, but listener is "React-way"
        const profileDocRef = doc(db, 'artifacts', APP_ID, 'user_profiles', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            }
        });

        return () => {
            unsubscribeTrades();
            unsubscribeProfile();
        };
    }, [currentUser]);

    const value: DataContextType = {
        trades,
        profile,
        loadingData,
        APP_ID // Expose if needed for direct writes
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
