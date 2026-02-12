
import { describe, it, expect } from 'vitest';
import { calculateFifoPL } from './calculations';
import { getMondayOfWeek, toStorageDate } from './dateUtils';

describe('calculateFifoPL', () => {
    it('should calculate simple Buy then Sell profit for Gold', () => {
        const trades = [
            { buyAmount: 50000, sellAmount: 0, timestamp: new Date('2023-01-01') },
            { buyAmount: 0, sellAmount: 52000, timestamp: new Date('2023-01-02') }
        ];
        // Profit = (52000 - 50000) * 10 = 20000
        // Net = 20000 - 300 = 19700
        const result = calculateFifoPL(trades, 'gold');
        expect(result.totalPL).toBe(19700);
        expect(result.pairCount).toBe(1);
    });

    it('should calculate simple Short then Cover profit for Silver', () => {
        const trades = [
            { buyAmount: 0, sellAmount: 70000, timestamp: new Date('2023-01-01') },
            { buyAmount: 68000, sellAmount: 0, timestamp: new Date('2023-01-02') }
        ];
        // Profit = (70000 - 68000) * 5 = 2000 * 5 = 10000
        // Net = 10000 - 300 = 9700
        const result = calculateFifoPL(trades, 'silver');
        expect(result.totalPL).toBe(9700);
        expect(result.pairCount).toBe(1);
    });

    it('should handle multiple incomplete pairs (FIFO)', () => {
        const trades = [
            { buyAmount: 100, sellAmount: 0, timestamp: new Date('2023-01-01') }, // Buy 1
            { buyAmount: 110, sellAmount: 0, timestamp: new Date('2023-01-02') }, // Buy 2
            { buyAmount: 0, sellAmount: 120, timestamp: new Date('2023-01-03') }  // Sell 1 (Matches Buy 1)
        ];
        // Match Buy 1 (100) with Sell 1 (120). Profit = (120-100)*10 = 200. Net = 200 - 300 = -100
        const result = calculateFifoPL(trades, 'gold');
        expect(result.totalPL).toBe(-100);
        expect(result.pairCount).toBe(1);
        // Buy 2 remains open
    });

    it('should return zero for no trades', () => {
        const result = calculateFifoPL([], 'gold');
        expect(result.totalPL).toBe(0);
        expect(result.pairCount).toBe(0);
    });
});

describe('Date Utils', () => {
    it('toStorageDate should format correctly', () => {
        const date = new Date('2023-12-25');
        expect(toStorageDate(date)).toBe('2023-12-25');
    });

    it('getMondayOfWeek should return correct Monday', () => {
        const wednesday = new Date('2023-11-15'); // Nov 15 2023 is a Wednesday
        const monday = getMondayOfWeek(wednesday);
        expect(monday).toBe('2023-11-13'); // Nov 13 2023 is Monday
    });

    it('getMondayOfWeek should handle Sunday correctly (previous Monday)', () => {
        const sunday = new Date('2023-11-12'); // Nov 12 2023 is Sunday
        const monday = getMondayOfWeek(sunday);
        expect(monday).toBe('2023-11-06'); // Nov 6 2023 is previous Monday
    });
});
