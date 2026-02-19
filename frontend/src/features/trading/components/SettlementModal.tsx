import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { useData } from '../context/DataContext';
import { calculateFifoPL } from '../utils/calculations';
import { toStorageDate, formatDate, getFridayOfWeek } from '../utils/dateUtils';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';

interface SettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type SettlementOption = 'current' | 'previous';

export const SettlementModal: React.FC<SettlementModalProps> = ({ isOpen, onClose }) => {
    const { trades, settings, settleWeek } = useData();
    const [goldRate, setGoldRate] = useState('');
    const [silverRate, setSilverRate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [settlementOption, setSettlementOption] = useState<SettlementOption>('current');
    const [availableOptions, setAvailableOptions] = useState<SettlementOption[]>([]);

    const [currentFriday, setCurrentFriday] = useState('');
    const [previousFriday, setPreviousFriday] = useState('');
    const [targetDate, setTargetDate] = useState('');

    const [summary, setSummary] = useState({
        goldQty: 0,
        silverQty: 0,
        goldType: 'Flat',
        silverType: 'Flat'
    });

    const [canSettle, setCanSettle] = useState(false);
    const [dateMessage, setDateMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const day = today.getDay();

            // 1. Calculate Dates
            const currFriStr = getFridayOfWeek(today);
            setCurrentFriday(currFriStr);

            const prevFriDate = new Date(currFriStr);
            prevFriDate.setDate(prevFriDate.getDate() - 7);
            const prevFriStr = toStorageDate(prevFriDate);
            setPreviousFriday(prevFriStr);

            // 2. Check Availability
            const isCurrentWindow = day === 5 || day === 6 || day === 0;

            const isPrevSettled = trades.some(t =>
                t.isSettlement &&
                t.settlementType === 'close' &&
                t.date === prevFriStr
            );

            const isCurrSettled = trades.some(t =>
                t.isSettlement &&
                t.settlementType === 'close' &&
                t.date === currFriStr
            );

            const options: SettlementOption[] = [];

            // Logic: 
            // - Previous is option if not settled.
            // - Current is option if in window AND not settled (or we allow re-settle? No, block it).

            if (!isPrevSettled) {
                options.push('previous');
            }

            if (isCurrentWindow && !isCurrSettled) {
                options.push('current');
            }

            setAvailableOptions(options);

            // Default Select
            // Priority: Previous (if unsettled) -> Current
            if (options.includes('previous')) {
                setSettlementOption('previous');
            } else if (options.includes('current')) {
                setSettlementOption('current');
            } else {
                // If neither available, default to current but it will be disabled
                setSettlementOption('current');
            }

            // Reset
            setGoldRate('');
            setSilverRate('');
            setError('');
        }
    }, [isOpen, trades]);

    useEffect(() => {
        let tDate = '';
        let valid = false;
        let msg = '';

        if (settlementOption === 'previous') {
            tDate = previousFriday;
            const isPrevSettled = trades.some(t => t.isSettlement && t.settlementType === 'close' && t.date === previousFriday);

            if (!tDate) {
                valid = false;
            } else if (isPrevSettled) {
                valid = false;
                msg = "Previous week is already settled.";
            } else {
                valid = true;
            }
        } else {
            tDate = currentFriday;
            const today = new Date();
            const day = today.getDay();
            const isCurrentWindow = day === 5 || day === 6 || day === 0;
            const isCurrSettled = trades.some(t => t.isSettlement && t.settlementType === 'close' && t.date === currentFriday);

            if (!tDate) {
                valid = false;
            } else if (!isCurrentWindow) {
                valid = false;
                msg = "Settlement is only available on Friday, Saturday, or Sunday.";
            } else if (isCurrSettled) {
                valid = false;
                msg = "Current week is already settled.";
            } else {
                valid = true;
            }
        }

        // If no options were strictly available in the first place, ensure valid is false
        // (Handled by the checks above)

        // Block if trying to settle "Current" while "Previous" is open? 
        // User asked for "option for settel this also", implying choice. 
        // But generally sequential is better. 
        // I'll show a warning if selecting 'current' while 'previous' is unsettled? 
        // Complexity: Keep it simple. Just validation.

        setTargetDate(tDate);
        setCanSettle(valid);
        setDateMessage(msg);

        // Calculate Summary
        if (tDate) {
            // Filter trades UP TO target date (inclusive)
            const relevantTrades = trades.filter(t => {
                const tradeDate = t.date || (t.timestamp && typeof t.timestamp === 'object' && 'toDate' in t.timestamp ? toStorageDate(t.timestamp.toDate()) : '');
                return tradeDate <= tDate;
            });

            const goldTrades = relevantTrades.filter(t => t.commodity === 'gold');
            const goldFifo = calculateFifoPL(goldTrades, 'gold', settings.gold.commissionPerLot, settings.gold.lotSize);
            const goldLongs = goldFifo.openPositions.longs.reduce((acc, p) => acc + p.quantity, 0);
            const goldShorts = goldFifo.openPositions.shorts.reduce((acc, p) => acc + p.quantity, 0);
            const goldNet = goldLongs - goldShorts;

            const silverTrades = relevantTrades.filter(t => t.commodity === 'silver');
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
        }

    }, [settlementOption, currentFriday, previousFriday, availableOptions, trades, settings]);

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
            await settleWeek(targetDate, gRate || 0, sRate || 0);
            onClose();
        } catch (err) {
            console.error(err);
            setError('Failed to settle week. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settle Week">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    This will close all open positions at the specified rate and immediately reopen them at the same rate for the next week.
                </p>

                <div className="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
                    {/* Option Selection */}
                    <div className="flex flex-col gap-2 mb-3">
                        <label className="text-gray-400 font-semibold mb-1">Select Period:</label>
                        <div className="flex gap-4">
                            <label className={`flex items-center gap-2 cursor-pointer ${settlementOption === 'previous' ? 'text-white' : 'text-gray-400'}`}>
                                <input
                                    type="radio"
                                    name="settlementOption"
                                    value="previous"
                                    checked={settlementOption === 'previous'}
                                    onChange={() => setSettlementOption('previous')}
                                    disabled={!availableOptions.includes('previous') && settlementOption !== 'previous'} // Disable if not available, unless it's currently selected (shouldn't happen logic-wise but safe)
                                />
                                <span>
                                    Previous Week ({formatDate(previousFriday)})
                                    {availableOptions.includes('previous') && <span className="text-yellow-500 text-xs ml-1">(Unsettled)</span>}
                                </span>
                            </label>

                            <label className={`flex items-center gap-2 cursor-pointer ${settlementOption === 'current' ? 'text-white' : 'text-gray-400'}`}>
                                <input
                                    type="radio"
                                    name="settlementOption"
                                    value="current"
                                    checked={settlementOption === 'current'}
                                    onChange={() => setSettlementOption('current')}
                                    disabled={false} // Always allow clicking to see status message? Or disable if out of window? 
                                // Better to allow clicking so they see the "future date not allowed" message
                                />
                                <span>Current Week ({formatDate(currentFriday)})</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-between border-t border-gray-700 pt-3">
                        <span className="text-gray-400">Target Date:</span>
                        <span className="font-bold text-white">{formatDate(targetDate)} (Friday)</span>
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
