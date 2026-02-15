
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { calculateFifoPL } from '../utils/calculations';
import { TradePair } from '../types';
import { toStorageDate } from '../utils/dateUtils';

export interface ExtendedTradePair extends TradePair {
    id: string; // generated
    instrument: string;
    date: string; // YYYY-MM-DD
    pnl: number; // alias for net
    type: string; // 'Long' or 'Short' - inferred? For now 'Trade' or based on assumption. 
    // Actually, we can't easily infer direction from simple Buy/Sell prices without timestamp of entry vs exit.
    // But we can just say 'Round Trip'
}

export interface DailyStats {
    date: string;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    grossProfit: number;
    grossLoss: number;
    netPnl: number;
    winRate: number;
}

export interface PeriodStats extends DailyStats {
    bestDay: { date: string; pnl: number } | null;
    worstDay: { date: string; pnl: number } | null;
    dailyBreakdown: DailyStats[];
}

export interface WinLossStats {
    totalWins: number;
    totalLosses: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    longestWinStreak: number;
    longestLossStreak: number;
    riskRewardRatio: number;
}

export const useReportCalculations = () => {
    const { trades, settings } = useData();

    const processedTrades = useMemo(() => {
        // Calculate FIFO for Gold
        const goldTrades = trades.filter(t => t.commodity === 'gold');
        const goldResult = calculateFifoPL(goldTrades, 'gold', settings.gold.commissionPerLot, settings.gold.lotSize);
        const goldPairs = goldResult.pairs.map((p, index) => ({
            ...p,
            id: `gold-${index}`,
            instrument: 'Gold Mini',
            date: p.timestamp ? toStorageDate(p.timestamp) : 'N/A',
            pnl: p.net,
            type: 'Trade'
        }));

        // Calculate FIFO for Silver
        const silverTrades = trades.filter(t => t.commodity === 'silver');
        const silverResult = calculateFifoPL(silverTrades, 'silver', settings.silver.commissionPerLot, settings.silver.lotSize);
        const silverPairs = silverResult.pairs.map((p, index) => ({
            ...p,
            id: `silver-${index}`,
            instrument: 'Silver Mini',
            date: p.timestamp ? toStorageDate(p.timestamp) : 'N/A',
            pnl: p.net,
            type: 'Trade'
        }));

        // Combine and sort by date descending
        return [...goldPairs, ...silverPairs].sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

    }, [trades, settings]);

    const calculateDailyStats = (dayTrades: ExtendedTradePair[], date: string): DailyStats => {
        let winningTrades = 0;
        let losingTrades = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        let netPnl = 0;

        dayTrades.forEach(trade => {
            const pnl = trade.net;
            netPnl += pnl;
            if (pnl > 0) {
                winningTrades++;
                grossProfit += pnl;
            } else if (pnl < 0) {
                losingTrades++;
                grossLoss += pnl;
            }
        });

        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        return {
            date,
            totalTrades,
            winningTrades,
            losingTrades,
            grossProfit,
            grossLoss,
            netPnl,
            winRate
        };
    };

    const getStatsForPeriod = (filteredTrades: ExtendedTradePair[]): PeriodStats => {
        // Group by date first
        const tradesByDate: Record<string, ExtendedTradePair[]> = {};

        filteredTrades.forEach(trade => {
            if (!tradesByDate[trade.date]) {
                tradesByDate[trade.date] = [];
            }
            tradesByDate[trade.date].push(trade);
        });

        const dailyBreakdown: DailyStats[] = Object.keys(tradesByDate).map(date =>
            calculateDailyStats(tradesByDate[date], date)
        ).sort((a, b) => a.date.localeCompare(b.date));

        // Aggregate period stats
        const totalTrades = dailyBreakdown.reduce((sum, day) => sum + day.totalTrades, 0);
        const winningTrades = dailyBreakdown.reduce((sum, day) => sum + day.winningTrades, 0);
        const losingTrades = dailyBreakdown.reduce((sum, day) => sum + day.losingTrades, 0);
        const grossProfit = dailyBreakdown.reduce((sum, day) => sum + day.grossProfit, 0);
        const grossLoss = dailyBreakdown.reduce((sum, day) => sum + day.grossLoss, 0);
        const netPnl = dailyBreakdown.reduce((sum, day) => sum + day.netPnl, 0);

        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        // Find Best/Worst Days
        let bestDay = null;
        let worstDay = null;

        if (dailyBreakdown.length > 0) {
            bestDay = dailyBreakdown.reduce((prev, current) => (prev.netPnl > current.netPnl) ? prev : current);
            worstDay = dailyBreakdown.reduce((prev, current) => (prev.netPnl < current.netPnl) ? prev : current);
        }

        return {
            date: 'Period', // Placeholder
            totalTrades,
            winningTrades,
            losingTrades,
            grossProfit,
            grossLoss,
            netPnl,
            winRate,
            bestDay: bestDay ? { date: bestDay.date, pnl: bestDay.netPnl } : null,
            worstDay: worstDay ? { date: worstDay.date, pnl: worstDay.netPnl } : null,
            dailyBreakdown
        };
    };

    const calculateWinLossAnalysis = (filteredTrades: ExtendedTradePair[]): WinLossStats => {
        // Sort by date ascending for streaks
        const sortedTrades = [...filteredTrades].sort((a, b) => {
            return a.date.localeCompare(b.date);
        });

        let wins = sortedTrades.filter(t => t.net > 0).map(t => t.net);
        let losses = sortedTrades.filter(t => t.net < 0).map(t => t.net);

        const totalWins = wins.length;
        const totalLosses = losses.length;
        const avgWin = totalWins > 0 ? wins.reduce((a, b) => a + b, 0) / totalWins : 0;
        const avgLoss = totalLosses > 0 ? losses.reduce((a, b) => a + b, 0) / totalLosses : 0;
        const largestWin = wins.length > 0 ? Math.max(...wins) : 0;
        const largestLoss = losses.length > 0 ? Math.min(...losses) : 0;

        const riskRewardRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

        // Streaks
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentLossStreak = 0;
        let maxLossStreak = 0;

        sortedTrades.forEach(t => {
            const pnl = t.net;
            if (pnl > 0) {
                currentWinStreak++;
                currentLossStreak = 0;
                if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
            } else if (pnl < 0) {
                currentLossStreak++;
                currentWinStreak = 0;
                if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
            }
        });

        return {
            totalWins,
            totalLosses,
            avgWin,
            avgLoss,
            largestWin,
            largestLoss,
            longestWinStreak: maxWinStreak,
            longestLossStreak: maxLossStreak,
            riskRewardRatio
        };
    };

    return {
        processedTrades,
        calculateDailyStats,
        getStatsForPeriod,
        calculateWinLossAnalysis
    };
};
