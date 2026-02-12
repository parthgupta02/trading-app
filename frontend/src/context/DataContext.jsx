
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [trades, setTrades] = useState([]);
    const [profile, setProfile] = useState({ fullName: '', email: '' });
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
            const tradeList = [];
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
                setProfile(docSnap.data());
            }
        });

        return () => {
            unsubscribeTrades();
            unsubscribeProfile();
        };
    }, [currentUser]);

    const value = {
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
