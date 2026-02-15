
import React, { useState, useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';
import { toStorageDate, getMondayOfWeek } from '../../utils/dateUtils';
import { Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const WeeklyReport: React.FC = () => {
    // Helper to get week string from date (YYYY-Www)
    const getWeekString = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7; // Make Sunday 7, not 0
        d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
        const year = d.getUTCFullYear();
        const week1 = new Date(Date.UTC(year, 0, 1));
        const week = Math.ceil((((d.getTime() - week1.getTime()) / 86400000) + 1) / 7);
        return `${year}-W${String(week).padStart(2, '0')}`;
    };

    // Convert "YYYY-Www" to Monday Date
    const getMondayFromWeek = (weekString: string) => {
        if (!weekString) return new Date(); // Fallback to current date if no week string
        const [yearStr, weekStr] = weekString.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);

        // Get the first day of the year
        const d = new Date(year, 0, 1);
        // Adjust to the first Monday of the year (or previous year's last Monday if week 1 starts then)
        const day = d.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
        d.setDate(diff);

        // Add weeks to get to the desired Monday
        d.setDate(d.getDate() + (week - 1) * 7);
        return d;
    };

    const [selectedWeek, setSelectedWeek] = useState<string>(getWeekString(new Date()));

    const { processedTrades, getStatsForPeriod } = useReportCalculations();

    const currentWeekStart = useMemo(() => {
        return toStorageDate(getMondayFromWeek(selectedWeek));
    }, [selectedWeek]);

    const stats = useMemo(() => {
        const monday = getMondayFromWeek(selectedWeek);
        const start = toStorageDate(monday);
        const endDate = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000); // Add 6 days to Monday to get Sunday
        const end = toStorageDate(endDate);

        const weekTrades = processedTrades.filter(t => t.date >= start && t.date <= end);
        return getStatsForPeriod(weekTrades);
    }, [processedTrades, selectedWeek, getStatsForPeriod]);

    const chartData = useMemo(() => {
        // Only show Mon-Fri
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const start = new Date(currentWeekStart);

        return days.map((day, index) => {
            const d = new Date(start);
            d.setDate(d.getDate() + index);
            const dateStr = toStorageDate(d);

            const dayStats = stats.dailyBreakdown.find(s => s.date === dateStr);
            return {
                day,
                pnl: dayStats ? dayStats.netPnl : 0,
                date: dateStr
            };
        });
    }, [stats, currentWeekStart]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <Calendar className="text-gray-400" />
                <span className="text-gray-300 font-medium">Select Week:</span>
                <span className="text-gray-300 font-medium">Select Week:</span>
                <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 outline-none focus:border-yellow-500 appearance-none pr-8 cursor-pointer"
                    style={{ backgroundImage: 'none' }} // Remove default arrow if needed, or keep for simplicity
                >
                    {(() => {
                        const uniqueMondays = Array.from(new Set(processedTrades.map(t => getMondayOfWeek(t.date)))).sort();
                        // Generate options
                        const options = uniqueMondays.map((monday, index) => {
                            const date = new Date(monday);
                            const weekStr = getWeekString(date);
                            return {
                                value: weekStr,
                                label: `Week ${index + 1} (${monday})`,
                                monday: monday
                            };
                        }).reverse(); // Newest first

                        if (options.length === 0) {
                            return <option value={selectedWeek}>Current Week (No Data)</option>;
                        }

                        return options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ));
                    })()}
                </select>
                {/* Removed separate Week X badge as it's now in the dropdown */}
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

            <Card title="Weekly P&L Overview" className="bg-[#151F32]">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="day" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                formatter={(value: any) => formatCurrency(value)}
                            />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
