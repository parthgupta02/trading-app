
import React, { useState, useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';
import { toStorageDate } from '../../utils/dateUtils';
import { Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const MonthlyReport: React.FC = () => {
    const { processedTrades, getStatsForPeriod } = useReportCalculations();
    const [selectedMonth, setSelectedMonth] = useState<string>(toStorageDate(new Date()).substring(0, 7)); // YYYY-MM

    const stats = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);

        // Start of month
        const startDate = new Date(year, month - 1, 1);
        // End of month
        const endDate = new Date(year, month, 0);

        const startStr = toStorageDate(startDate);
        const endStr = toStorageDate(endDate);

        const monthTrades = processedTrades.filter(t => {
            return t.date >= startStr && t.date <= endStr;
        });

        return getStatsForPeriod(monthTrades);
    }, [processedTrades, selectedMonth, getStatsForPeriod]);

    const chartData = useMemo(() => {
        // Create full month range for chart, even if no trades
        if (!selectedMonth) return [];
        const [year, month] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const data = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month - 1, i);
            const dateStr = toStorageDate(d);
            const dayStats = stats.dailyBreakdown.find(s => s.date === dateStr);
            data.push({
                date: i, // Just show day number
                fullDate: dateStr,
                pnl: dayStats ? dayStats.netPnl : 0
            });
        }
        return data;
    }, [stats, selectedMonth]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
                <Calendar className="text-gray-400" />
                <label className="text-gray-300 font-medium">Select Month:</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Total Trades" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className="text-3xl font-bold text-white">{stats.totalTrades}</div>
                    <div className="text-sm text-gray-400 mt-1">
                        Win Rate: {stats.winRate.toFixed(1)}%
                    </div>
                </Card>

                <Card title="Net P&L" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <div className={`text-3xl font-bold ${stats.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(stats.netPnl)}
                    </div>
                </Card>

                <Card title="Best Day" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    {stats.bestDay ? (
                        <>
                            <div className="text-xl font-bold text-green-500">{formatCurrency(stats.bestDay.pnl)}</div>
                            <div className="text-xs text-gray-400">{stats.bestDay.date}</div>
                        </>
                    ) : <span className="text-gray-500">N/A</span>}
                </Card>

                <Card title="Worst Day" className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    {stats.worstDay ? (
                        <>
                            <div className="text-xl font-bold text-red-500">{formatCurrency(stats.worstDay.pnl)}</div>
                            <div className="text-xs text-gray-400">{stats.worstDay.date}</div>
                        </>
                    ) : <span className="text-gray-500">N/A</span>}
                </Card>
            </div>

            <Card title="Monthly P&L Trend" className="bg-[#151F32]">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                formatter={(value: any) => formatCurrency(value)}
                                labelFormatter={(label) => `Day ${label}`}
                            />
                            <Line type="monotone" dataKey="pnl" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
