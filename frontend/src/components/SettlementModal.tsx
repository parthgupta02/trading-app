import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { useData } from '../context/DataContext';
import { calculateFifoPL } from '../utils/calculations';
import { toStorageDate } from '../utils/dateUtils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose }) => {
    const { trades, settings, settleWeek } = useData();
    const [goldRate, setGoldRate] = useState('');
    const [silverRate, setSilverRate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [summary, setSummary] = useState({
        goldQty: 0,
        silverQty: 0,
        goldType: 'Flat',
        silverType: 'Flat'
    });

    const [targetFriday, setTargetFriday] = useState('');
    const [canSettle, setCanSettle] = useState(false);
    const [dateMessage, setDateMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const day = today.getDay();

            // Check if today is Friday (5), Saturday (6), or Sunday (0)
            const isSettlementWindow = day === 5 || day === 6 || day === 0;

            if (!isSettlementWindow) {
                setCanSettle(false);
                setDateMessage("Settlement is only available on Friday, Saturday, or Sunday.");
            } else {
                setCanSettle(true);
                setDateMessage('');
            }

            // Determine the "Settlement Friday"
            // If today is Friday, it's today.
            // If today is Saturday/Sunday, it's the *past* Friday.
            let d = new Date(today);
            if (day === 6) { // Saturday
                d.setDate(d.getDate() - 1);
            } else if (day === 0) { // Sunday
                d.setDate(d.getDate() - 2);
            } else if (day !== 5) {
                // If it's Mon-Thu, getFridayOfWeek returns *this* coming Friday.
                // But we disable the button anyway.
                // Let's just use the util for consistency of "Current Week's Friday" logic
                // matching the day map.
            }

            // Actually simpler:
            // If we are in the window (Fri-Sun), we want the Friday of that "Trading Week".
            // trading week ends Friday.
            // Fri -> This Friday
            // Sat -> Past Friday
            // Sun -> Past Friday

            // Re-calc specific for this logic
            const fridayDate = new Date(today);
            if (day === 6) fridayDate.setDate(fridayDate.getDate() - 1);
            if (day === 0) fridayDate.setDate(fridayDate.getDate() - 2);
            // If Mon-Thu, it doesn't really matter as we block, but let's show upcoming Friday?
            if (day >= 1 && day <= 4) {
                const diff = 5 - day;
                fridayDate.setDate(fridayDate.getDate() + diff);
            }

            setTargetFriday(toStorageDate(fridayDate));

            // Calculate open positions
            const goldTrades = trades.filter(t => t.commodity === 'gold');
            const goldFifo = calculateFifoPL(goldTrades, 'gold', settings.gold.commissionPerLot, settings.gold.lotSize);
            const goldLongs = goldFifo.openPositions.longs.reduce((acc, p) => acc + p.quantity, 0);
            const goldShorts = goldFifo.openPositions.shorts.reduce((acc, p) => acc + p.quantity, 0);
            const goldNet = goldLongs - goldShorts;

            const silverTrades = trades.filter(t => t.commodity === 'silver');
            const silverFifo = calculateFifoPL(silverTrades, 'silver', settings.silver.commissionPerLot, settings.silver.lotSize);
            const silverLongs = silverFifo.openPositions.longs.reduce((acc, p) => acc + p.quantity, 0);
            const silverShorts = silverFifo.openPositions.shorts.reduce((acc, p) => acc + p.quantity, 0);
            const silverNet = silverLongs - silverShorts;

            setSummary({
                goldQty: Math.abs(goldNet),
                goldType: goldNet > 0 ? 'Long' : (goldNet < 0 ? 'Short' : 'Flat'),
                silverQty: Math.abs(silverNet),
                silverType: silverNet > 0 ? 'Long' : (silverNet < 0 ? 'Short' : 'Flat')
            });

            // Reset inputs
            setGoldRate('');
            setSilverRate('');
            setError('');
        }
    }, [isOpen, trades, settings]);

    const handleSettle = async () => {
        setError('');

        const gRate = parseFloat(goldRate);
        const sRate = parseFloat(silverRate);

        if (summary.goldType !== 'Flat' && (isNaN(gRate) || gRate <= 0)) {
            setError('Please enter a valid Gold Settlement Rate.');
            return;
        }
        if (summary.silverType !== 'Flat' && (isNaN(sRate) || sRate <= 0)) {
            setError('Please enter a valid Silver Settlement Rate.');
            return;
        }

        if (summary.goldType === 'Flat' && summary.silverType === 'Flat') {
            setError('No open positions to settle.');
            return;
        }

        setLoading(true);
        try {
            await settleWeek(targetFriday, gRate || 0, sRate || 0);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to settle week. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settle This Week">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    This will close all open positions at the specified rate and immediately reopen them at the same rate for the next week.
                </p>

                <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Settlement Date:</span>
                        <span className="font-bold text-white">{targetFriday} (Friday)</span>
                    </div>
                    {!canSettle && (
                        <p className="text-red-400 mt-2 font-semibold">
                            {dateMessage}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-900/50 p-4 rounded border border-gray-700">
                    <div>
                        <h4 className="text-yellow-500 font-bold mb-1">Gold Mini</h4>
                        <p className="text-sm text-gray-300">
                            Position: <span className={summary.goldType === 'Long' ? 'text-green-500' : (summary.goldType === 'Short' ? 'text-red-500' : 'text-gray-500')}>{summary.goldType}</span>
                        </p>
                        <p className="text-sm text-gray-300">Qty: {summary.goldQty}</p>
                    </div>
                    <div>
                        <h4 className="text-gray-300 font-bold mb-1">Silver Mini</h4>
                        <p className="text-sm text-gray-300">
                            Position: <span className={summary.silverType === 'Long' ? 'text-green-500' : (summary.silverType === 'Short' ? 'text-red-500' : 'text-gray-500')}>{summary.silverType}</span>
                        </p>
                        <p className="text-sm text-gray-300">Qty: {summary.silverQty}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {summary.goldType !== 'Flat' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Gold Settlement Rate</label>
                            <Input
                                type="number"
                                value={goldRate}
                                onChange={(e) => setGoldRate(e.target.value)}
                                placeholder="Enter Gold Closing Rate"
                                className="bg-gray-900 border-gray-700 text-yellow-400 font-bold"
                            />
                        </div>
                    )}

                    {summary.silverType !== 'Flat' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Silver Settlement Rate</label>
                            <Input
                                type="number"
                                value={silverRate}
                                onChange={(e) => setSilverRate(e.target.value)}
                                placeholder="Enter Silver Closing Rate"
                                className="bg-gray-900 border-gray-700 text-gray-200 font-bold"
                            />
                        </div>
                    )}
                </div>

                {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</p>}

                <div className="flex justify-end gap-3 mt-4">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="primary" onClick={handleSettle} loading={loading} disabled={!canSettle}>
                        Confirm Settlement
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
