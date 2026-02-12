
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
        <Card className="border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-white">
                {commodity.charAt(0).toUpperCase() + commodity.slice(1)} Trade History
            </h2>
            <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Week</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Qty</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Buy Rate</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-red-400 uppercase tracking-wider">Sell Rate</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {tradesWithWeek.length === 0 ? (
                            <tr><td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-400">No trades recorded yet.</td></tr>
                        ) : (
                            tradesWithWeek.map((trade) => (
                                <tr key={trade.id} className="hover:bg-gray-700 transition duration-150">
                                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium ${commodity === 'gold' ? 'text-yellow-400' : 'text-gray-300'}`}>
                                        {trade.weekNum}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {trade.date || formatDate(trade.timestamp)}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {trade.quantity || 1}
                                    </td>
                                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-semibold ${Number(trade.buyAmount) > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                        {Number(trade.buyAmount).toFixed(2)}
                                    </td>
                                    <td className={`px-3 py-4 whitespace-nowrap text-sm font-semibold ${Number(trade.sellAmount) > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {Number(trade.sellAmount).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                                        <div className="flex space-x-2">
                                            <Button variant="primary" onClick={() => setEditingTrade(trade)} className="px-2 py-1 text-xs">Edit</Button>
                                            <Button variant="danger" onClick={() => setDeletingTradeId(trade.id as string)} className="px-2 py-1 text-xs">Delete</Button>
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
