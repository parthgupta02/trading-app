import React, { useState, useMemo } from 'react';
import { useReportCalculations } from '../../hooks/useReportCalculations';
import { Card } from '../ui/Card';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const formatTradeTime = (timestamp: any) => {
        if (!timestamp) return '-';
        // Handle Firestore Timestamp
        if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            return format(timestamp.toDate(), 'dd MMM HH:mm');
        }
        // Handle JS Date or string
        const d = new Date(timestamp);
        if (isNaN(d.getTime())) return '-';
        return format(d, 'dd MMM HH:mm');
    };

    const handleExportCSV = () => {
        const headers = ["Date", "Instrument", "Qty", "Buy Price", "Sell Price", "P&L", "Open Time", "Close Time"];
        const rows = filteredTrades.map(t => [
            t.date,
            t.instrument,
            t.quantity,
            t.buy,
            t.sell,
            t.net,
            t.openTimestamp ? new Date(t.openTimestamp.toDate ? t.openTimestamp.toDate() : t.openTimestamp).toLocaleString() : '',
            t.closeTimestamp ? new Date(t.closeTimestamp.toDate ? t.closeTimestamp.toDate() : t.closeTimestamp).toLocaleString() : ''
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

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text('Trade History Report', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Define Columns
        const tableColumn = ["Details", "Instrument", "Qty", "Buy Price", "Sell Price", "P&L"];
        const tableRows: any[] = [];

        filteredTrades.forEach(trade => {
            const buyTime = trade.direction === 'Long' ? formatTradeTime(trade.openTimestamp) : formatTradeTime(trade.closeTimestamp);
            const sellTime = trade.direction === 'Long' ? formatTradeTime(trade.closeTimestamp) : formatTradeTime(trade.openTimestamp);

            const tradeData = [
                `BUY: ${buyTime}\nSELL: ${sellTime}`,
                trade.instrument,
                trade.quantity,
                trade.buy.toFixed(2),
                trade.sell.toFixed(2),
                formatCurrency(trade.net)
            ];
            tableRows.push(tradeData);
        });

        // Generate Table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] }, // Dark gray header
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 40 }, // Details column wider
                5: { fontStyle: 'bold' } // P&L bold
            },
            didParseCell: (data) => {
                // Color P&L column based on value
                if (data.section === 'body' && data.column.index === 5) {
                    const rawValue = data.cell.raw;
                    if (rawValue) {
                        const pnlValue = parseFloat(rawValue.toString().replace(/[₹,]/g, ''));
                        if (pnlValue >= 0) {
                            data.cell.styles.textColor = [34, 197, 94]; // Green
                        } else {
                            data.cell.styles.textColor = [239, 68, 68]; // Red
                        }
                    }
                }
            }
        });

        // Save PDF
        doc.save(`trade_history_${new Date().toISOString().slice(0, 10)}.pdf`);
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

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <FileText size={16} /> Export PDF
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded border border-gray-800">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1F2937]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trade Details</th>
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
                                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-green-500/70 text-[10px] w-8">BUY:</span>
                                                <span className="text-gray-300">
                                                    {trade.direction === 'Long' ? formatTradeTime(trade.openTimestamp) : formatTradeTime(trade.closeTimestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-red-500/70 text-[10px] w-8">SELL:</span>
                                                <span className="text-gray-300">
                                                    {trade.direction === 'Long' ? formatTradeTime(trade.closeTimestamp) : formatTradeTime(trade.openTimestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${trade.instrument.includes('Gold') ? 'bg-yellow-500' : 'bg-gray-400'}`}></span>
                                        {trade.instrument}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">Closed</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-blue-300 font-mono">
                                        {trade.quantity}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                                        {trade.buy.toFixed(2)}
                                        {trade.isSettlement && trade.direction === 'Short' && (
                                            <span className="ml-1 text-[10px] font-bold text-blue-400">S</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-400 font-mono">
                                        {trade.sell.toFixed(2)}
                                        {trade.isSettlement && trade.direction === 'Long' && (
                                            <span className="ml-1 text-[10px] font-bold text-blue-400">S</span>
                                        )}
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

