
import React, { useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';

export const InstrumentAnalysis: React.FC = () => {
    const { processedTrades, calculateDailyStats } = useReportCalculations();

    const analysis = useMemo(() => {
        const instruments = ['Gold Mini', 'Silver Mini'];

        return instruments.map(inst => {
            const instTrades = processedTrades.filter(t => t.instrument === inst);
            const stats = calculateDailyStats(instTrades, 'All Time');
            return {
                instrument: inst,
                ...stats
            };
        });
    }, [processedTrades, calculateDailyStats]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <Card title="Instrument Analysis" className="bg-[#151F32]">
            <div className="overflow-x-auto rounded border border-gray-800">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1F2937]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Instrument</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Trades</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Profit</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Loss</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Net P&L</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Win Rate</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#111827] divide-y divide-gray-800">
                        {analysis.map((row) => (
                            <tr key={row.instrument} className="hover:bg-[#1F2937] transition duration-150">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-300">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${row.instrument.includes('Gold') ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                    {row.instrument}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-400">
                                    {row.totalTrades}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-500">
                                    {formatCurrency(row.grossProfit)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-500">
                                    {formatCurrency(row.grossLoss)}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${row.netPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatCurrency(row.netPnl)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-300">
                                    {row.winRate.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
