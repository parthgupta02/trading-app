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

    // Queues now hold price AND quantity
    let longPositions: { price: number, quantity: number }[] = [];
    let shortPositions: { price: number, quantity: number }[] = [];

    // Define constants based on commodity
    // Commission is per 'lot' (unit of quantity)
    const commissionPerLot = 300;
    const multiplier = (commodity === 'gold') ? 10 : 5; // 10 for Gold (100g/10g), 5 for Silver (5kg/1kg)

    // Sort trades by timestamp to ensure correct order
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? a.timestamp.toDate() : new Date((a.timestamp as any) || 0);
        const dateB = b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? b.timestamp.toDate() : new Date((b.timestamp as any) || 0);
        return dateA.getTime() - dateB.getTime();
    });

    for (const trade of sortedTrades) {
        const buyPrice = Number(trade.buyAmount) || 0;
        const sellPrice = Number(trade.sellAmount) || 0;
        // Default quantity to 1 if missing (legacy data)
        let tradeQty = trade.quantity !== undefined ? Number(trade.quantity) : 1;

        if (tradeQty <= 0) continue; // Skip invalid quantities

        if (buyPrice > 0) {
            // --- BUY TRANSACTION ---
            // Try to close existing SHORT positions
            while (tradeQty > 0 && shortPositions.length > 0) {
                const position = shortPositions[0]; // Peek at the first position
                const matchQty = Math.min(tradeQty, position.quantity);

                // Calculate P&L for this chunk
                // Profit = (Sell Price - Buy Price) * Multiplier * Qty
                // Here, we are buying to cover a short. 
                // Profit = (Short Price - Current Buy Price) * Multiplier * MatchQty
                const rawProfit = (position.price - buyPrice) * multiplier * matchQty;
                const matchCommission = commissionPerLot * matchQty;
                const netProfit = rawProfit - matchCommission;

                realizedPL += netProfit;
                totalProfit += rawProfit;
                totalCommission += matchCommission;

                pairs.push({
                    buy: buyPrice,
                    sell: position.price,
                    quantity: matchQty,
                    profit: rawProfit,
                    commission: matchCommission,
                    net: netProfit
                });

                // Update quantities
                tradeQty -= matchQty;
                position.quantity -= matchQty;

                if (position.quantity <= 0) {
                    shortPositions.shift(); // Remove exhausted position
                }
            }

            // If quantity remains, open a new LONG position
            if (tradeQty > 0) {
                longPositions.push({ price: buyPrice, quantity: tradeQty });
            }

        } else if (sellPrice > 0) {
            // --- SELL TRANSACTION ---
            // Try to close existing LONG positions
            while (tradeQty > 0 && longPositions.length > 0) {
                const position = longPositions[0]; // Peek
                const matchQty = Math.min(tradeQty, position.quantity);

                // Calculate P&L for this chunk
                // Profit = (Sell Price - Buy Price) * Multiplier * MatchQty
                // Here, we are selling to close a long.
                const rawProfit = (sellPrice - position.price) * multiplier * matchQty;
                const matchCommission = commissionPerLot * matchQty;
                const netProfit = rawProfit - matchCommission;

                realizedPL += netProfit;
                totalProfit += rawProfit;
                totalCommission += matchCommission;

                pairs.push({
                    buy: position.price,
                    sell: sellPrice,
                    quantity: matchQty,
                    profit: rawProfit,
                    commission: matchCommission,
                    net: netProfit
                });

                // Update quantities
                tradeQty -= matchQty;
                position.quantity -= matchQty;

                if (position.quantity <= 0) {
                    longPositions.shift(); // Remove exhausted position
                }
            }

            // If quantity remains, open a new SHORT position
            if (tradeQty > 0) {
                shortPositions.push({ price: sellPrice, quantity: tradeQty });
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
