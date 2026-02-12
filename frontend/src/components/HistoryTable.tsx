
import React, { useState } from 'react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getMondayOfWeek, formatDate } from '../utils/dateUtils';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Trade } from '../types';

interface HistoryTableProps {
    commodity: string;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ commodity }) => {
    const { trades, APP_ID } = useData();
    const { currentUser } = useAuth();

    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);

    // Filter and Sort
    const filteredTrades = trades
        .filter((t) => t.commodity === commodity)
        .sort((a, b) => {
            const dateA = a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? a.timestamp.toDate() : new Date((a.timestamp as any) || 0);
            const dateB = b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? b.timestamp.toDate() : new Date((b.timestamp as any) || 0);
            return dateA.getTime() - dateB.getTime();
        });

    // Calculate Weeks
    const weekMap: { [key: string]: number } = {};
    let currentWeekNumber = 0;

    const tradesWithWeek = filteredTrades.map(trade => {
        const monday = getMondayOfWeek(trade.timestamp);
        if (weekMap[monday] === undefined) {
            currentWeekNumber++;
            weekMap[monday] = currentWeekNumber;
        }
        return { ...trade, weekNum: weekMap[monday] };
    });

    // Actions
    const handleDelete = async () => {
        if (!deletingTradeId || !currentUser) return;
        try {
            const ref = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`, deletingTradeId);
            await deleteDoc(ref);
            setDeletingTradeId(null);
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTrade || !currentUser || !editingTrade.id) return;

        // Validation similar to Form
        const buy = parseFloat(editingTrade.buyAmount as string);
        const sell = parseFloat(editingTrade.sellAmount as string);
        const qty = parseFloat(editingTrade.quantity as unknown as string); // Handle string input

        try {
            const ref = doc(db, `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`, editingTrade.id);
            await updateDoc(ref, {
                buyAmount: isNaN(buy) ? 0 : buy,
                sellAmount: isNaN(sell) ? 0 : sell,
                quantity: isNaN(qty) ? 1 : qty
            });
            setEditingTrade(null);
        } catch (error) {
            console.error("Update failed", error);
        }
    };


    return (

        <Card className="">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#F59E0B] rounded-full inline-block"></span>
                {commodity.charAt(0).toUpperCase() + commodity.slice(1)} Trade History
            </h2>
            <div className="overflow-x-auto rounded border border-gray-800">
                <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1F2937]">
                        <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Week</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-green-500 uppercase tracking-wider">Buy Rate</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-red-500 uppercase tracking-wider">Sell Rate</th>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#111827] divide-y divide-gray-800">
                        {tradesWithWeek.length === 0 ? (
                            <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-gray-500">No trades recorded yet.</td></tr>
                        ) : (
                            tradesWithWeek.map((trade) => (
                                <tr key={trade.id} className="hover:bg-[#1F2937] transition duration-150 group">
                                    <td className={`px-3 py-2 whitespace-nowrap text-xs font-medium ${commodity === 'gold' ? 'text-[#F59E0B]' : 'text-gray-300'}`}>
                                        {trade.weekNum}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-300">
                                        {trade.date || formatDate(trade.timestamp)}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-300">
                                        {trade.quantity || 1}
                                    </td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-xs font-semibold ${Number(trade.buyAmount) > 0 ? 'text-green-500' : 'text-gray-600'}`}>
                                        {Number(trade.buyAmount) > 0 ? Number(trade.buyAmount).toFixed(2) : '-'}
                                    </td>
                                    <td className={`px-3 py-2 whitespace-nowrap text-xs font-semibold ${Number(trade.sellAmount) > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                                        {Number(trade.sellAmount) > 0 ? Number(trade.sellAmount).toFixed(2) : '-'}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="primary" onClick={() => setEditingTrade(trade)} className="px-2 py-0.5 text-[10px] h-6 font-medium uppercase">Edit</Button>
                                            <Button variant="danger" onClick={() => setDeletingTradeId(trade.id as string)} className="px-2 py-0.5 text-[10px] h-6 font-medium uppercase">Del</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingTrade && (
                <Modal isOpen={!!editingTrade} onClose={() => setEditingTrade(null)} title={`Edit ${commodity} Rate`}>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <Input
                            label="Qty"
                            type="number"
                            step="1"
                            min="1"
                            value={(editingTrade.quantity || 1) as unknown as string}
                            onChange={e => setEditingTrade({ ...editingTrade, quantity: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Buy Rate"
                            type="number"
                            step="any"
                            value={editingTrade.buyAmount as string}
                            onChange={e => setEditingTrade({ ...editingTrade, buyAmount: e.target.value })}
                        />
                        <Input
                            label="Sell Rate"
                            type="number"
                            step="any"
                            value={editingTrade.sellAmount as string}
                            onChange={e => setEditingTrade({ ...editingTrade, sellAmount: e.target.value })}
                        />
                        <div className="flex space-x-2 justify-end mt-4">
                            <Button variant="secondary" onClick={() => setEditingTrade(null)}>Cancel</Button>
                            <Button variant="success" type="submit">Save Changes</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete Modal */}
            {deletingTradeId && (
                <Modal isOpen={!!deletingTradeId} onClose={() => setDeletingTradeId(null)} title="Confirm Deletion">
                    <p className="mb-4">Are you sure you want to delete this trade? This action cannot be undone.</p>
                    <div className="flex space-x-2 justify-end">
                        <Button variant="secondary" onClick={() => setDeletingTradeId(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Delete</Button>
                    </div>
                </Modal>
            )}
        </Card>
    );
};
