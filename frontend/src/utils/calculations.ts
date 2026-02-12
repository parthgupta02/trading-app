import { Trade, TradePair } from '../types';

interface FifoResult {
    totalPL: number;
    pairs: TradePair[];
    pairCount: number;
    totalProfit: number;
    totalCommission: number;
}

/**
 * Calculates P&L for a set of trades using FIFO (First-In, First-Out) logic.
 * 
 * @param {Trade[]} trades - Array of trade objects
 * @param {string} commodity - 'gold' or 'silver'
 * @returns {FifoResult}
 */
export const calculateFifoPL = (trades: Trade[], commodity: string): FifoResult => {
    let realizedPL = 0;
    let pairs: TradePair[] = [];
    let totalProfit = 0;
    let totalCommission = 0;

    let longPositions: { price: number }[] = []; // Queue of buys: { price: number }
    let shortPositions: { price: number }[] = []; // Queue of sells: { price: number }

    // Define constants based on commodity
    const commission = 300;
    const multiplier = (commodity === 'gold') ? 10 : 5; // 10 for Gold (100g/10g), 5 for Silver (5kg/1kg)

    // Sort trades by timestamp to ensure correct order
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? a.timestamp.toDate() : new Date((a.timestamp as any) || 0);
        const dateB = b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? b.timestamp.toDate() : new Date((b.timestamp as any) || 0);
        return dateA.getTime() - dateB.getTime();
    });

    for (const trade of sortedTrades) {
        const buyPrice = Number(trade.buyAmount) || 0;   // This is the rate
        const sellPrice = Number(trade.sellAmount) || 0; // This is the rate

        if (buyPrice > 0) {
            // This is a BUY transaction
            if (shortPositions.length > 0) {
                // Close an existing short position
                const openingShortRate = shortPositions.shift()!.price; // strict null check handled by length check
                const profit = (openingShortRate - buyPrice) * multiplier;
                const netProfit = profit - commission;
                realizedPL += netProfit;

                // Store details
                totalProfit += profit;
                totalCommission += commission;
                pairs.push({ buy: buyPrice, sell: openingShortRate, profit: profit, commission: commission, net: netProfit });
            } else {
                // Open a new long position
                longPositions.push({ price: buyPrice });
            }
        } else if (sellPrice > 0) {
            // This is a SELL transaction
            if (longPositions.length > 0) {
                // Close an existing long position
                const openingLongRate = longPositions.shift()!.price; // strict null check handled by length check
                const profit = (sellPrice - openingLongRate) * multiplier;
                const netProfit = profit - commission;
                realizedPL += netProfit;

                // Store details
                totalProfit += profit;
                totalCommission += commission;
                pairs.push({ buy: openingLongRate, sell: sellPrice, profit: profit, commission: commission, net: netProfit });
            } else {
                // Open a new short position
                shortPositions.push({ price: sellPrice });
            }
        }
    }

    // Return the detailed object
    return {
        totalPL: realizedPL,
        pairs: pairs,
        pairCount: pairs.length,
        totalProfit: totalProfit,
        totalCommission: totalCommission
    };
};
