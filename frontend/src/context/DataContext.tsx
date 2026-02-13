
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Trade, TradingSettings } from '../types';

interface UserProfile {
    fullName: string;
    email: string;
    [key: string]: any;
}

interface DataContextType {
    trades: Trade[];
    profile: UserProfile;
    settings: TradingSettings;
    loadingData: boolean;
    APP_ID: string;
    updateSettings: (newSettings: TradingSettings) => Promise<void>;
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

    // Default settings
    const [settings, setSettings] = useState<TradingSettings>({
        gold: { lotSize: 100, commissionPerLot: 300 }, // Defaults per requirement
        silver: { lotSize: 5, commissionPerLot: 300 }
    });

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

        // 2. Fetch Profile & Settings (Consolidated)
        const profileDocRef = doc(db, 'artifacts', APP_ID, 'user_profiles', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProfile(data as UserProfile);

                // Check if settings exist in profile, otherwise keep defaults
                if (data.tradingSettings) {
                    setSettings(data.tradingSettings as TradingSettings);
                }
            } else {
                // Profile doesn't exist? Maybe default settings should remain.
            }
        });

        return () => {
            unsubscribeTrades();
            unsubscribeProfile();
        };
    }, [currentUser]);

    const updateSettings = async (newSettings: TradingSettings) => {
        if (!currentUser) return;
        const profileDocRef = doc(db, 'artifacts', APP_ID, 'user_profiles', currentUser.uid);
        // Merge settings into the profile document
        await setDoc(profileDocRef, { tradingSettings: newSettings }, { merge: true });
    };

    const value: DataContextType = {
        trades,
        profile,
        settings,
        loadingData,
        APP_ID,
        updateSettings
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
