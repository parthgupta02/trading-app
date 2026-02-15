
import React, { useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';

export const WinLossAnalysis: React.FC = () => {
    const { processedTrades, calculateWinLossAnalysis } = useReportCalculations();

    const stats = useMemo(() => {
        return calculateWinLossAnalysis(processedTrades);
    }, [processedTrades, calculateWinLossAnalysis]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Win / Loss Count" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className="flex justify-between items-center">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-500">{stats.totalWins}</div>
                            <div className="text-xs text-gray-400">Wins</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-500">{stats.totalLosses}</div>
                            <div className="text-xs text-gray-400">Losses</div>
                        </div>
                    </div>
                </Card>

                <Card title="Average P&L" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Avg Win:</span>
                            <span className="text-green-500 font-bold">{formatCurrency(stats.avgWin)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Avg Loss:</span>
                            <span className="text-red-500 font-bold">{formatCurrency(stats.avgLoss)}</span>
                        </div>
                    </div>
                </Card>

                <Card title="Largest Trades" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Max Win:</span>
                            <span className="text-green-500 font-bold">{formatCurrency(stats.largestWin)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Max Loss:</span>
                            <span className="text-red-500 font-bold">{formatCurrency(stats.largestLoss)}</span>
                        </div>
                    </div>
                </Card>

                <Card title="Streaks" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Win Streak:</span>
                            <span className="text-green-500 font-bold">{stats.longestWinStreak}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Loss Streak:</span>
                            <span className="text-red-500 font-bold">{stats.longestLossStreak}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="bg-[#151F32]">
                <div className="flex flex-col md:flex-row justify-between items-center p-4">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <h3 className="text-xl font-bold text-white">Risk / Reward Ratio</h3>
                        <p className="text-gray-400 text-sm">Average Win / Average Loss</p>
                    </div>
                    <div className="text-4xl font-bold text-[#F59E0B]">
                        1 : {stats.riskRewardRatio.toFixed(2)}
                    </div>
                </div>
            </Card>
        </div>
    );
};
