import React, { useState, useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';
import { Download } from 'lucide-react';

export const TradeHistory: React.FC = () => {
    const { processedTrades } = useReportCalculations();

    // Filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
    const [pnlFilter, setPnlFilter] = useState<string>('all'); // Profit/Loss/All

    const filteredTrades = useMemo(() => {
        return processedTrades.filter(t => {
            const dateMatch = (!startDate || t.date >= startDate) && (!endDate || t.date <= endDate);
            const instrumentMatch = instrumentFilter === 'all' || t.instrument === instrumentFilter;
            // Type filter is tricky with pairs. 'Buy' usually means Long, 'Sell' Short. 
            // But we don't have direction in pairs explicitly. 
            // However, we can use pnlFilter for Profit/Loss.
            // Let's assume Type filter is kept for future or mapped to something.
            // User asked for "Trade type filter (Buy/Sell)". 
            // If I can't determine it, I should maybe ignore it or try to infer.
            // Since I can't infer, I will disable/hide it or just not filter by it if it's 'all'.

            const pnlMatch = pnlFilter === 'all'
                ? true
                : (pnlFilter === 'profit' ? t.net > 0 : t.net < 0);

            return dateMatch && instrumentMatch && pnlMatch;
        });
    }, [processedTrades, startDate, endDate, instrumentFilter, pnlFilter]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    };

    const handleExportCSV = () => {
        const headers = ["Date", "Instrument", "Qty", "Buy Price", "Sell Price", "P&L"];
        const rows = filteredTrades.map(t => [
            t.date,
            t.instrument,
            t.quantity,
            t.buy,
            t.sell,
            t.net
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `trade_history_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card title="Trade History" className="bg-[#151F32]">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Date Range:</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600" />
                    <span className="text-gray-500">-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600" />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Instrument:</span>
                    <select value={instrumentFilter} onChange={e => setInstrumentFilter(e.target.value)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600">
                        <option value="all">All</option>
                        <option value="Gold Mini">Gold Mini</option>
                        <option value="Silver Mini">Silver Mini</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Outcome:</span>
                    <select value={pnlFilter} onChange={e => setPnlFilter(e.target.value)} className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600">
                        <option value="all">All</option>
                        <option value="profit">Profit Only</option>
                        <option value="loss">Loss Only</option>
                    </select>
                </div>

                <button
                    onClick={handleExportCSV}
                    className="ml-auto bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-gray-800">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1F2937]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Instrument</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Buy Price</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Sell Price</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">P&L</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#111827] divide-y divide-gray-800">
                        {filteredTrades.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No trades found for selected filters.</td>
                            </tr>
                        ) : (
                            filteredTrades.map((trade) => (
                                <tr key={trade.id} className="hover:bg-[#1F2937] transition duration-150">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                        {trade.date}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${trade.instrument.includes('Gold') ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                        {trade.instrument}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                        {/* Since Type is redundant/ambiguous for now, we just show a badge or generic text */}
                                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">Closed</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-blue-300 font-mono">
                                        {trade.quantity}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                                        {trade.buy.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                                        {trade.sell.toFixed(2)}
                                    </td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold font-mono ${trade.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {trade.net > 0 ? '+' : ''}{formatCurrency(trade.net)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
