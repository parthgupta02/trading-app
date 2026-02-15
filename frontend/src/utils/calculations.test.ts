import { describe, it, expect } from 'vitest';
import { calculateFifoPL } from './calculations';
import { Trade } from '../types';

describe('calculateFifoPL', () => {
    it('should calculate profit with commission for regular trades', () => {
        const trades: Trade[] = [
            {
                id: '1',
                buyAmount: 100, // Buy at 100
                sellAmount: 0,
                quantity: 1,
                timestamp: new Date('2023-01-01T10:00:00Z'),
                commodity: 'gold'
            },
            {
                id: '2',
                buyAmount: 0,
                sellAmount: 110, // Sell at 110
                quantity: 1,
                timestamp: new Date('2023-01-01T11:00:00Z'),
                commodity: 'gold'
            }
        ];

        // Gold: LotSize 100 -> Multiplier 10 (100/10)
        // Profit = (110 - 100) * 10 * 1 = 100
        // Commission = 300 * 1 = 300
        // Net = 100 - 300 = -200

        const result = calculateFifoPL(trades, 'gold', 300, 100);
        expect(result.totalCommission).toBe(300);
        expect(result.totalPL).toBe(-200);
    });

    it('should NOT charge commission for settlement trades', () => {
        const trades: Trade[] = [
            {
                id: '1',
                buyAmount: 100,
                sellAmount: 0,
                quantity: 1,
                timestamp: new Date('2023-01-01T10:00:00Z'),
                commodity: 'gold'
            },
            {
                id: '2',
                buyAmount: 0,
                sellAmount: 110,
                quantity: 1,
                timestamp: new Date('2023-01-01T11:00:00Z'),
                commodity: 'gold',
                isSettlement: true, // This is a settlement trade
                settlementType: 'close'
            }
        ];

        // Profit = (110 - 100) * 10 * 1 = 100
        // Commission SHOULD be 0
        // Net = 100 - 0 = 100

        const result = calculateFifoPL(trades, 'gold', 300, 100);
        expect(result.totalCommission).toBe(0);
        expect(result.totalPL).toBe(100);
    });
});
