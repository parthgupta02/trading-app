
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, onSnapshot, doc, setDoc, writeBatch, Timestamp, getDocs, where } from "firebase/firestore";
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Trade, TradingSettings } from '../types';
import { calculateFifoPL } from '../utils/calculations';
import { toStorageDate, getMondayOfWeek } from '../utils/dateUtils';

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
    settleWeek: (settlementDate: string, goldPrice: number, silverPrice: number) => Promise<void>;
    activeWeekMonday: string;
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

    const settleWeek = async (settlementDate: string, goldPrice: number, silverPrice: number) => {
        if (!currentUser) return;

        try {
            // Idempotency Check: Check if this week is already settled
            const path = `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`;
            const collectionRef = collection(db, path);
            const q = query(
                collectionRef,
                where("isSettlement", "==", true),
                where("date", "==", settlementDate),
                where("settlementType", "==", "close")
            );

            const existing = await getDocs(q);
            if (!existing.empty) {
                throw new Error(`Week ending ${settlementDate} is already settled.`);
            }

            const batch = writeBatch(db);

            // Set timestamps relative to the settlement Friday
            const fridayDate = new Date(settlementDate);
            // Close at end of Friday
            fridayDate.setHours(23, 59, 0, 0);
            const closeTimestamp = Timestamp.fromDate(fridayDate);

            // Reopen 1 second later (technically Saturday start, but logically continuous)
            const openTimestamp = Timestamp.fromDate(new Date(fridayDate.getTime() + 1000));

            // Calculate Next Monday for the "Open" trade date so it appears in next week's history
            const nextMonday = new Date(fridayDate);
            nextMonday.setDate(nextMonday.getDate() + 3); // Friday + 3 days = Monday
            const nextMondayDate = toStorageDate(nextMonday);

            const commodities = ['gold', 'silver'] as const;

            commodities.forEach(commodity => {
                const price = commodity === 'gold' ? goldPrice : silverPrice;
                if (price <= 0) return; // Skip if no valid price provided

                // Get config
                const lotSize = commodity === 'gold' ? settings.gold.lotSize : settings.silver.lotSize;
                const commission = commodity === 'gold' ? settings.gold.commissionPerLot : settings.silver.commissionPerLot;

                // Calculate current open positions
                const comTrades = trades.filter(t => t.commodity === commodity);
                const { openPositions } = calculateFifoPL(comTrades, commodity, commission, lotSize);

                // Sum up quantities
                const totalLong = openPositions.longs.reduce((sum, p) => sum + p.quantity, 0);
                const totalShort = openPositions.shorts.reduce((sum, p) => sum + p.quantity, 0);

                // Handle LONG positions
                if (totalLong > 0) {
                    // 1. Close Longs (SELL)
                    const closeDoc = doc(collectionRef);
                    batch.set(closeDoc, {
                        commodity,
                        buyAmount: 0,
                        sellAmount: price,
                        quantity: totalLong,
                        timestamp: closeTimestamp,
                        date: settlementDate, // Explicitly set to Friday
                        isSettlement: true,
                        settlementType: 'close'
                    });

                    // 2. Re-open Longs (BUY)
                    const openDoc = doc(collectionRef);
                    batch.set(openDoc, {
                        commodity,
                        buyAmount: price,
                        sellAmount: 0,
                        quantity: totalLong,
                        timestamp: openTimestamp,
                        date: nextMondayDate, // Set to Next Monday to appear in next week
                        isSettlement: true,
                        settlementType: 'open'
                    });
                }

                // Handle SHORT positions
                if (totalShort > 0) {
                    // 1. Close Shorts (BUY)
                    const closeDoc = doc(collectionRef);
                    batch.set(closeDoc, {
                        commodity,
                        buyAmount: price,
                        sellAmount: 0,
                        quantity: totalShort,
                        timestamp: closeTimestamp,
                        date: settlementDate,
                        isSettlement: true,
                        settlementType: 'close'
                    });

                    // 2. Re-open Shorts (SELL)
                    const openDoc = doc(collectionRef);
                    batch.set(openDoc, {
                        commodity,
                        buyAmount: 0,
                        sellAmount: price,
                        quantity: totalShort,
                        timestamp: openTimestamp,
                        date: nextMondayDate,
                        isSettlement: true,
                        settlementType: 'open'
                    });
                }
            });

            await batch.commit();
            console.log("Weekly settlement completed successfully.");

        } catch (error) {
            console.error("Error performing weekly settlement:", error);
            throw error; // Propagate error for UI handling
        }
    };

    const [activeWeekMonday, setActiveWeekMonday] = useState(toStorageDate(getMondayOfWeek(new Date())));

    useEffect(() => {
        // Calculate Active Week
        // If we have "Settlement Open" trades with date > current week's Friday, it means we moved to next week.
        const today = new Date();
        const currentMonday = getMondayOfWeek(today);
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(nextMonday.getDate() + 7);
        const nextMondayStr = toStorageDate(nextMonday);

        // Check for any trade that belongs to the "Next Week" (specifically settlement opens)
        const hasNextWeekTrades = trades.some(t => {
            const tradeDate = t.date || (t.timestamp && typeof t.timestamp === 'object' && 'toDate' in t.timestamp ? toStorageDate(t.timestamp.toDate()) : '');
            return tradeDate >= nextMondayStr;
        });

        if (hasNextWeekTrades) {
            setActiveWeekMonday(nextMondayStr);
        } else {
            setActiveWeekMonday(currentMonday);
        }
    }, [trades]);

    const value: DataContextType = {
        trades,
        profile,
        settings,
        loadingData,
        APP_ID,
        updateSettings,
        settleWeek,
        activeWeekMonday
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
