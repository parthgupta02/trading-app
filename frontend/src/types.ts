import { Timestamp } from 'firebase/firestore';

export interface Trade {
    id?: string;
    buyAmount?: number | string;
    sellAmount?: number | string;
    timestamp?: Timestamp | { toDate: () => Date } | number | string | Date; // accommodate various formats
    commodity?: string;
    [key: string]: any; // Allow other properties for now until fully typed
}

export interface TradePair {
    buy: number;
    sell: number;
    profit: number;
    commission: number;
    net: number;
}
