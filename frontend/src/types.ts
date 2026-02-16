import { Timestamp } from 'firebase/firestore';

export interface Trade {
    id?: string;
    buyAmount?: number | string;
    sellAmount?: number | string;
    quantity?: number;
    timestamp?: Timestamp | { toDate: () => Date } | number | string | Date; // accommodate various formats
    commodity?: string;
    date?: string;
    isSettlement?: boolean;
    settlementType?: 'close' | 'open';
    [key: string]: any; // Allow other properties for now until fully typed
}

export interface TradePair {
    buy: number;
    sell: number;
    quantity: number;
    profit: number;
    commission: number;
    net: number;
    timestamp?: any; // To track when the pair was realized (usually closing trade time)
    openTimestamp?: any; // The timestamp of the opening trade (Buy for Long, Sell for Short)
    closeTimestamp?: any; // The timestamp of the closing trade (Sell for Long, Buy for Short)
    isSettlement?: boolean;
    direction?: 'Long' | 'Short';
}

export interface TradingSettings {
    gold: {
        lotSize: number;
        commissionPerLot: number;
    };
    silver: {
        lotSize: number;
        commissionPerLot: number;
    };
}
