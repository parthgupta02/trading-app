
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { getMondayOfWeek, getFridayOfWeek } from '../utils/dateUtils';
import { Card } from '../components/ui/Card';
import { calculateFifoPL } from '../utils/calculations';
import { Trade } from '../types';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Layers } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SettlementModal } from '../components/SettlementModal';

// --- Helper Components ---

interface StatCardProps {
    title: string;
    value: string;
    subValue?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, icon, trend, color = "text-gray-100" }) => (
    <Card className="flex flex-col justify-between p-4 h-full border-l-4 border-l-[#F59E0B]">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
            </div>
            <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
                {icon}
            </div>
        </div>
        {subValue && (
            <div className="flex items-center text-xs text-gray-400 mt-2">
                {trend === 'up' && <ArrowUpRight size={14} className="text-green-500 mr-1" />}
                {trend === 'down' && <ArrowDownRight size={14} className="text-red-500 mr-1" />}
                <span>{subValue}</span>
            </div>
        )}
    </Card>
);

interface CommoditySummaryProps {
    commodity: string;
    trades: Trade[];
    currentMonday: string;
    commissionPerLot: number;
    lotSize: number;
}

const CommoditySummary: React.FC<CommoditySummaryProps> = ({ commodity, trades, currentMonday, commissionPerLot, lotSize }) => {
    const isGold = commodity === 'gold';
    const titleColor = isGold ? 'text-[#F59E0B]' : 'text-gray-300';
    const borderColor = isGold ? 'border-[#F59E0B]' : 'border-gray-500';

    // 1. Calculate weighted averages and totals for ALL TIME (or filter if needed, but usually summary is current state)
    // Actually, "Avg Buy" / "Avg Sell" usually implies current open position or overall trading activity.
    // Let's calculated based on trades for the *current week* as per the previous logic, OR 
    // better yet: aggregated stats for the week.

    // Filter for current week
    const weeklyTrades = trades.filter(t => t.commodity === commodity && getMondayOfWeek(t.date || t.timestamp) === currentMonday);

    let totalBuyQty = 0;
    let totalBuyCost = 0;
    let totalSellQty = 0;
    let totalSellCost = 0;

    weeklyTrades.forEach(t => {
        const qty = Number(t.quantity) || 0;
        const buy = Number(t.buyAmount) || 0;
        const sell = Number(t.sellAmount) || 0;

        if (buy > 0) {
            totalBuyQty += qty;
            totalBuyCost += (buy * qty);
        }
        if (sell > 0) {
            totalSellQty += qty;
            totalSellCost += (sell * qty);
        }
    });

    const avgBuy = totalBuyQty > 0 ? (totalBuyCost / totalBuyQty) : 0;
    const avgSell = totalSellQty > 0 ? (totalSellCost / totalSellQty) : 0;
    const netPosition = totalBuyQty - totalSellQty;

    // Calculate Weekly Realized P&L
    const allCommodityTrades = trades.filter(t => t.commodity === commodity);
    const fifoResult = calculateFifoPL(allCommodityTrades, commodity, commissionPerLot, lotSize);

    // Filter pairs that were realized THIS week
    const weeklyPairs = fifoResult.pairs.filter(p => {
        // We need timestamp on pairs. If not available, we can't filter accurately by realization time.
        // Assuming we added timestamp to pairs in calculations.ts
        if (!p.timestamp) return false;

        // Handle Firestore Timestamp or Date object
        const date = p.timestamp && typeof p.timestamp === 'object' && 'toDate' in p.timestamp ? p.timestamp.toDate() : new Date((p.timestamp as any) || 0);
        return getMondayOfWeek(date) === currentMonday;
    });

    const weeklyRealizedPL = weeklyPairs.reduce((acc, p) => acc + p.net, 0);

    return (
        <Card className={`h-full border-t-2 ${borderColor}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold uppercase ${titleColor}`}>{commodity} Mini</h3>
                <span className={`text-xs px-2 py-1 rounded bg-gray-800 ${netPosition > 0 ? 'text-green-500' : (netPosition < 0 ? 'text-red-500' : 'text-gray-400')}`}>
                    Net: {netPosition > 0 ? '+' : ''}{netPosition}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Buy</p>
                    <p className="text-xl font-bold text-green-500">{avgBuy.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Qty: {totalBuyQty}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Avg Sell</p>
                    <p className="text-xl font-bold text-red-500">{avgSell.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">Qty: {totalSellQty}</p>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Weekly P&L</span>
                <span className={`text-lg font-bold ${weeklyRealizedPL > 0 ? 'text-green-500' : (weeklyRealizedPL < 0 ? 'text-red-500' : 'text-gray-400')}`}>
                    {weeklyRealizedPL.toFixed(2)}
                </span>
            </div>
        </Card>
    );
};

import { OpenPositionsCard } from '../components/OpenPositionsCard';

// ... (existing imports)

// ... (StatCard and CommoditySummary components remain unchanged)

export const DashboardPage = () => {
    const { trades, loadingData, settings, activeWeekMonday } = useData();
    const currentMonday = activeWeekMonday;
    const settlementDate = getFridayOfWeek(new Date());
    const [isSettlementOpen, setIsSettlementOpen] = useState(false);

    // Check if settled
    // Check for unsettled positions (Net != 0 up to this Sunday)
    const hasUnsettledPositions = useMemo(() => {
        // Calculate Sunday of the settlement week (Friday + 2 days)
        const friday = new Date(settlementDate);
        const sunday = new Date(friday);
        sunday.setDate(friday.getDate() + 2);
        const sundayStr = sunday.toISOString().split('T')[0];

        // Filter trades up to Sunday
        const relevantTrades = trades.filter(t => (t.date || '') <= sundayStr);

        let hasOpen = false;
        ['gold', 'silver'].forEach(commodity => {
            const comTrades = relevantTrades.filter(t => t.commodity === commodity);
            const lotSize = commodity === 'gold' ? settings.gold.lotSize : settings.silver.lotSize;
            const comm = commodity === 'gold' ? settings.gold.commissionPerLot : settings.silver.commissionPerLot;

            const { openPositions } = calculateFifoPL(comTrades, commodity, comm, lotSize);
            const total = openPositions.longs.reduce((a, b) => a + b.quantity, 0) +
                openPositions.shorts.reduce((a, b) => a + b.quantity, 0);

            if (total > 0) hasOpen = true;
        });
        return hasOpen;
    }, [trades, settlementDate, settings]);

    // --- Global Calculations ---
    const stats = useMemo(() => {
        // 1. Total Trades This Week
        const weeklyTrades = trades.filter(t => getMondayOfWeek(t.date || t.timestamp) === currentMonday);
        const totalTradesCount = weeklyTrades.length;

        let openLongs = 0;
        let openShorts = 0;

        // Gold
        const goldTrades = trades.filter(t => t.commodity === 'gold');
        const goldFifo = calculateFifoPL(goldTrades, 'gold', settings.gold.commissionPerLot, settings.gold.lotSize);
        if (goldFifo.openPositions) {
            openLongs += goldFifo.openPositions.longs.reduce((acc, p) => acc + p.quantity, 0);
            openShorts += goldFifo.openPositions.shorts.reduce((acc, p) => acc + p.quantity, 0);
        }

        // Silver
        const silverTrades = trades.filter(t => t.commodity === 'silver');
        const silverFifo = calculateFifoPL(silverTrades, 'silver', settings.silver.commissionPerLot, settings.silver.lotSize);
        if (silverFifo.openPositions) {
            openLongs += silverFifo.openPositions.longs.reduce((acc, p) => acc + p.quantity, 0);
            openShorts += silverFifo.openPositions.shorts.reduce((acc, p) => acc + p.quantity, 0);
        }

        const netOpenPos = openLongs - openShorts;

        // 3. Realized Profit This Week (Combined)
        const goldWeeklyPL = goldFifo.pairs
            .filter(p => {
                const date = p.timestamp && typeof p.timestamp === 'object' && 'toDate' in p.timestamp ? p.timestamp.toDate() : new Date((p.timestamp as any) || 0);
                return getMondayOfWeek(date) === currentMonday;
            })
            .reduce((acc, p) => acc + p.net, 0);

        const silverWeeklyPL = silverFifo.pairs
            .filter(p => {
                const date = p.timestamp && typeof p.timestamp === 'object' && 'toDate' in p.timestamp ? p.timestamp.toDate() : new Date((p.timestamp as any) || 0);
                return getMondayOfWeek(date) === currentMonday;
            })
            .reduce((acc, p) => acc + p.net, 0);

        const totalRealizedPL = goldWeeklyPL + silverWeeklyPL;

        return {
            totalTradesCount,
            netOpenPos,
            totalRealizedPL,
            goldPositions: goldFifo.openPositions || { longs: [], shorts: [] },
            silverPositions: silverFifo.openPositions || { longs: [], shorts: [] }
        };
    }, [trades, currentMonday, settings]);


    if (loadingData) return <div className="text-center text-gray-500 mt-10">Loading dashboard...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                    Dashboard
                    <span className="text-sm px-3 py-1 bg-gray-800 rounded-full text-[#F59E0B] border border-gray-700">
                        Week {(() => {
                            const uniqueMondays = new Set(trades.map(t => getMondayOfWeek(t.date || t.timestamp)));
                            uniqueMondays.add(activeWeekMonday);
                            const sortedMondays = Array.from(uniqueMondays).sort(); // Lexicographical sort works for YYYY-MM-DD
                            return sortedMondays.indexOf(activeWeekMonday) + 1;
                        })()}
                    </span>
                </h1>
                {hasUnsettledPositions && (
                    <Button
                        variant="warning"
                        onClick={() => setIsSettlementOpen(true)}
                        className="font-bold shadow-lg shadow-orange-900/20"
                    >
                        Settle This Week
                    </Button>
                )}
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Net Open Position"
                    value={stats.netOpenPos > 0 ? `+${stats.netOpenPos}` : `${stats.netOpenPos}`}
                    subValue={stats.netOpenPos !== 0 ? (stats.netOpenPos > 0 ? "Long Bias" : "Short Bias") : "Flat"}
                    icon={<Layers size={20} className="text-[#F59E0B]" />}
                    color={stats.netOpenPos > 0 ? "text-green-500" : (stats.netOpenPos < 0 ? "text-red-500" : "text-gray-100")}
                />
                <StatCard
                    title="Realized P&L (Wk)"
                    value={stats.totalRealizedPL.toFixed(2)}
                    subValue="This Week"
                    trend={stats.totalRealizedPL > 0 ? 'up' : (stats.totalRealizedPL < 0 ? 'down' : 'neutral')}
                    icon={<DollarSign size={20} className="text-green-500" />}
                    color={stats.totalRealizedPL > 0 ? "text-green-500" : (stats.totalRealizedPL < 0 ? "text-red-500" : "text-gray-100")}
                />
                <StatCard
                    title="Total Trades (Wk)"
                    value={stats.totalTradesCount.toString()}
                    subValue="Volume"
                    icon={<Activity size={20} className="text-purple-500" />}
                />
            </div>

            {/* Commodity Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CommoditySummary
                    commodity="gold"
                    trades={trades}
                    currentMonday={currentMonday}
                    commissionPerLot={settings.gold.commissionPerLot}
                    lotSize={settings.gold.lotSize}
                />
                <CommoditySummary
                    commodity="silver"
                    trades={trades}
                    currentMonday={currentMonday}
                    commissionPerLot={settings.silver.commissionPerLot}
                    lotSize={settings.silver.lotSize}
                />
            </div>

            {/* Open Standing Positions */}
            <OpenPositionsCard
                goldPositions={stats.goldPositions}
                silverPositions={stats.silverPositions}
                settings={settings}
            />

            {/* Weekly Performance Placeholder */}
            <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-200 mb-4">Weekly Performance</h3>
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-lg bg-gray-900/50">
                    <span className="text-gray-600 text-sm">Chart / Detailed Breakdown Area</span>
                </div>
            </Card>

            <SettlementModal
                isOpen={isSettlementOpen}
                onClose={() => setIsSettlementOpen(false)}
            />
        </div >
    );
};
