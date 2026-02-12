
import React from 'react';
import { useData } from '../context/DataContext';
import { getMondayOfWeek } from '../utils/dateUtils';
import { Card } from '../components/ui/Card';

const SummaryCard = ({ title, commodity, trades, currentMonday }) => {
    const isGold = commodity === 'gold';
    const titleColor = isGold ? 'text-yellow-400' : 'text-gray-300';

    // Filter for current week
    let totalBuy = 0, totalSell = 0;
    let buyCount = 0, sellCount = 0, totalCount = 0;

    trades.forEach(t => {
        // Check if trade belongs to commodity and current week
        if (t.commodity === commodity && getMondayOfWeek(t.timestamp) === currentMonday) {
            totalCount++;
            const buy = parseFloat(t.buyAmount) || 0;
            const sell = parseFloat(t.sellAmount) || 0;
            if (buy > 0) { totalBuy += buy; buyCount++; }
            if (sell > 0) { totalSell += sell; sellCount++; }
        }
    });

    const avgBuy = buyCount > 0 ? (totalBuy / buyCount) : 0;
    const avgSell = sellCount > 0 ? (totalSell / sellCount) : 0;

    return (
        <Card className="border-gray-700">
            <h2 className={`text-xl font-bold mb-4 ${titleColor}`}>{title}</h2>
            <div className="flex justify-around items-center space-x-4">
                <div className="text-center">
                    <p className="text-sm font-medium text-green-400 uppercase">Avg. Buy</p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-green-400 mt-1">
                        {avgBuy.toFixed(2)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-red-400 uppercase">Avg. Sell</p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-red-400 mt-1">
                        {avgSell.toFixed(2)}
                    </p>
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-4 text-center">
                Based on {totalCount} trades this week.
            </p>
        </Card>
    );
};

export const DashboardPage = () => {
    const { trades, loadingData } = useData();
    const currentMonday = getMondayOfWeek(new Date());

    if (loadingData) return <div className="text-center text-white">Loading data...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SummaryCard
                title="Gold Mini - Current Week"
                commodity="gold"
                trades={trades}
                currentMonday={currentMonday}
            />
            <SummaryCard
                title="Silver Mini - Current Week"
                commodity="silver"
                trades={trades}
                currentMonday={currentMonday}
            />
        </div>
    );
};
