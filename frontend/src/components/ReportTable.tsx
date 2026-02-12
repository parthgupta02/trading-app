
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { calculateFifoPL } from '../utils/calculations';
import { getMondayOfWeek } from '../utils/dateUtils';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';
import { Trade, TradePair } from '../types';

interface DetailData {
    totalPL: number;
    pairs: TradePair[];
    totalCommission: number;
}

interface CombinedDetailData {
    gold: DetailData;
    silver: DetailData;
}

interface SelectedDetail {
    commodity: string;
    week: string;
    title: string;
    data: DetailData | CombinedDetailData;
}

export const ReportTable: React.FC = () => {
    const { trades, loadingData } = useData();
    const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null); // { commodity, week, title, data }

    if (loadingData) return <div className="text-center p-4">Loading reports...</div>;

    // Group trades by week
    const weeklyData: { [key: string]: { gold: Trade[], silver: Trade[] } } = {};
    const weekMap: { [key: string]: number } = {};
    let weekCounter = 0;

    // Sort trades first
    const sortedTrades = [...trades].sort((a, b) => {
        const dateA = a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? a.timestamp.toDate() : new Date((a.timestamp as any) || 0);
        const dateB = b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? b.timestamp.toDate() : new Date((b.timestamp as any) || 0);
        return dateA.getTime() - dateB.getTime();
    });

    sortedTrades.forEach(trade => {
        const monday = getMondayOfWeek(trade.timestamp);
        let weekNum: number;
        if (weekMap[monday] === undefined) {
            weekCounter++;
            weekMap[monday] = weekCounter;
        }
        weekNum = weekMap[monday];

        if (!weeklyData[weekNum]) {
            weeklyData[weekNum] = { gold: [], silver: [] };
        }
        if (trade.commodity === 'gold') weeklyData[weekNum].gold.push(trade);
        else if (trade.commodity === 'silver') weeklyData[weekNum].silver.push(trade);
    });

    // Calculate & Render Rows
    const weekKeys = Object.keys(weeklyData).sort((a, b) => Number(a) - Number(b));

    let totalGoldPL = 0;
    let totalSilverPL = 0;

    const rows = weekKeys.map(weekNum => {
        const goldTrades = weeklyData[weekNum].gold;
        const silverTrades = weeklyData[weekNum].silver;

        const goldResult = calculateFifoPL(goldTrades, 'gold');
        const silverResult = calculateFifoPL(silverTrades, 'silver');
        const totalPL = goldResult.totalPL + silverResult.totalPL;

        totalGoldPL += goldResult.totalPL;
        totalSilverPL += silverResult.totalPL;

        return (
            <tr key={weekNum} className="hover:bg-gray-700 transition duration-150">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-yellow-400">Week {weekNum}</td>
                <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline ${goldResult.totalPL > 0 ? 'text-green-400' : (goldResult.totalPL < 0 ? 'text-red-400' : 'text-gray-400')}`}
                    onClick={() => setSelectedDetail({ commodity: 'gold', week: weekNum, title: `Week ${weekNum} Gold P&L`, data: goldResult })}
                >
                    {goldResult.totalPL.toFixed(2)}
                </td>
                <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline ${silverResult.totalPL > 0 ? 'text-green-400' : (silverResult.totalPL < 0 ? 'text-red-400' : 'text-gray-400')}`}
                    onClick={() => setSelectedDetail({ commodity: 'silver', week: weekNum, title: `Week ${weekNum} Silver P&L`, data: silverResult })}
                >
                    {silverResult.totalPL.toFixed(2)}
                </td>
                <td
                    className={`px-4 py-3 whitespace-nowrap text-right text-sm font-medium cursor-pointer hover:underline ${totalPL > 0 ? 'text-green-400' : (totalPL < 0 ? 'text-red-400' : 'text-gray-400')}`}
                    onClick={() => {
                        // For 'all', we combine the results roughly for display or just show both
                        setSelectedDetail({ commodity: 'all', week: weekNum, title: `Week ${weekNum} Combined P&L`, data: { gold: goldResult, silver: silverResult } });
                    }}
                >
                    {totalPL.toFixed(2)}
                </td>
            </tr>
        );
    });

    const grandTotal = totalGoldPL + totalSilverPL;

    return (
        <Card className="border-gray-700">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Overall Realized Profit & Loss</h2>
            <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">P&L (Gold)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">P&L (Silver)</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Total P&L</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {rows}
                        <tr className="bg-gray-700 font-bold">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-extrabold text-white">Total</td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-extrabold ${totalGoldPL > 0 ? 'text-green-400' : (totalGoldPL < 0 ? 'text-red-400' : 'text-white')}`}>
                                {totalGoldPL.toFixed(2)}
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-sm font-extrabold ${totalSilverPL > 0 ? 'text-green-400' : (totalSilverPL < 0 ? 'text-red-400' : 'text-white')}`}>
                                {totalSilverPL.toFixed(2)}
                            </td>
                            <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-extrabold ${grandTotal > 0 ? 'text-green-400' : (grandTotal < 0 ? 'text-red-400' : 'text-white')}`}>
                                {grandTotal.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedDetail && (
                <Modal isOpen={!!selectedDetail} onClose={() => setSelectedDetail(null)} title={selectedDetail.title}>
                    {/* Simple Detail View */}
                    {selectedDetail.commodity !== 'all' ? (
                        <DetailContent name={selectedDetail.commodity} result={selectedDetail.data as DetailData} />
                    ) : (
                        <div className="space-y-6">
                            <DetailContent name="gold" result={(selectedDetail.data as CombinedDetailData).gold} />
                            <DetailContent name="silver" result={(selectedDetail.data as CombinedDetailData).silver} />
                            <div className="pt-4 border-t border-gray-600 flex justify-between font-bold">
                                <span>Net Total:</span>
                                <span className={((selectedDetail.data as CombinedDetailData).gold.totalPL + (selectedDetail.data as CombinedDetailData).silver.totalPL) > 0 ? 'text-green-400' : 'text-red-400'}>
                                    {((selectedDetail.data as CombinedDetailData).gold.totalPL + (selectedDetail.data as CombinedDetailData).silver.totalPL).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </Card>
    );
};

interface DetailContentProps {
    name: string;
    result: DetailData;
}

const DetailContent: React.FC<DetailContentProps> = ({ name, result }) => (
    <div>
        <h4 className={`text-lg font-bold uppercase mb-2 ${name === 'gold' ? 'text-yellow-400' : 'text-gray-400'}`}>{name}</h4>
        {result.pairs.length === 0 ? (
            <p className="text-gray-500 text-sm">No completed trade pairs.</p>
        ) : (
            <div className="space-y-2">
                <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-700">
                            <th className="py-1">Buy</th>
                            <th className="py-1">Sell</th>
                            <th className="py-1 text-right">Profit</th>
                            <th className="py-1 text-right">Net</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {result.pairs.map((p, i) => (
                            <tr key={i}>
                                <td className="py-1 text-green-400">{p.buy.toFixed(2)}</td>
                                <td className="py-1 text-red-400">{p.sell.toFixed(2)}</td>
                                <td className="py-1 text-right">{p.profit.toFixed(2)}</td>
                                <td className={`py-1 text-right font-medium ${p.net > 0 ? 'text-green-400' : 'text-red-400'}`}>{p.net.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="text-sm mt-2 flex justify-between">
                    <span>Commission:</span>
                    <span className="text-red-400">({result.totalCommission})</span>
                </div>
                <div className="text-sm font-bold flex justify-between border-t border-gray-700 pt-1">
                    <span>Total:</span>
                    <span className={result.totalPL > 0 ? 'text-green-400' : 'text-red-400'}>{result.totalPL.toFixed(2)}</span>
                </div>
            </div>
        )}
    </div>
);
