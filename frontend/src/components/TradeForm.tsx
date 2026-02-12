
import React, { useState, FormEvent, useEffect } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface TradeFormProps {
    commodity: string;
}

export const TradeForm: React.FC<TradeFormProps> = ({ commodity }) => {
    const { currentUser } = useAuth();
    const { APP_ID } = useData();
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [rate, setRate] = useState('');
    const [quantity, setQuantity] = useState('1'); // Default 1

    // Date and Time State
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initialize Date/Time on mount
    useEffect(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');

        setCustomDate(`${y}-${m}-${d}`);
        setCustomTime(`${hh}:${mm}`);
    }, []);

    const isGold = commodity === 'gold';
    const title = isGold ? 'New Gold Mini Trade (100g)' : 'New Silver Mini Trade (5kg)';
    const unitLabel = isGold ? 'per 10g' : 'per 1kg';
    const rateLabel = `Rate (${unitLabel})`;

    // Dynamic styles
    const borderColor = isGold ? 'border-yellow-700' : 'border-gray-600';
    const buttonColor = tradeType === 'BUY' ? 'success' : 'danger';


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const numericRate = rate === '' ? 0 : parseFloat(rate);
        const numericQty = quantity === '' ? 0 : parseFloat(quantity);

        if (isNaN(numericRate) || numericRate <= 0) {
            setError('Please enter a valid rate greater than 0.');
            return;
        }
        if (isNaN(numericQty) || numericQty < 1) {
            setError('Please enter a valid quantity (minimum 1).');
            return;
        }
        if (!customDate || !customTime) {
            setError('Please enter a valid date and time.');
            return;
        }

        if (!currentUser) {
            setError('You must be logged in.');
            return;
        }

        setLoading(true);
        try {
            const path = `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`;

            // Construct Timestamp from Custom Date and Time
            const dateTimeString = `${customDate}T${customTime}`;
            const tradeDate = new Date(dateTimeString);
            const timestamp = Timestamp.fromDate(tradeDate);

            const tradeData = {
                buyAmount: tradeType === 'BUY' ? numericRate : 0,
                sellAmount: tradeType === 'SELL' ? numericRate : 0,
                quantity: numericQty,
                commodity,
                timestamp: timestamp,
                date: customDate, // Use the custom date
            };

            await addDoc(collection(db, path), tradeData);

            // Reset form (keep date/time as is? or reset to now? user likely wants to enter multiple for same day)
            setRate('');
            setQuantity('1');
            // We keep customDate and customTime as they are, for convenience of multiple entries
        } catch (err) {
            console.error('Error adding trade:', err);
            setError('Failed to save trade.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`mb-8 ${borderColor}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${isGold ? 'text-yellow-400' : 'text-gray-300'}`}>
                {title}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 align-bottom">

                {/* Date Input */}
                <div className="col-span-1">
                    <Input
                        label="Date"
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                    />
                </div>

                {/* Time Input */}
                <div className="col-span-1">
                    <Input
                        label="Time"
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                    />
                </div>

                {/* Trade Type Dropdown */}
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Type
                    </label>
                    <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value as 'BUY' | 'SELL')}
                        className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>

                {/* Rate Input */}
                <div className="col-span-1">
                    <Input
                        label={rateLabel}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className={tradeType === 'BUY' ? "focus:ring-green-500 focus:border-green-500" : "focus:ring-red-500 focus:border-red-500"}
                    />
                </div>

                {/* Quantity Input */}
                <div className="col-span-1">
                    <div className="flex space-x-2">
                        <div className="flex-grow">
                            <Input
                                label="Qty"
                                type="number"
                                step="1"
                                min="1"
                                placeholder="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end mb-[2px]">
                            <Button
                                type="submit"
                                variant={buttonColor}
                                loading={loading}
                                disabled={!rate || !quantity}
                                className="h-[42px]" // Height match approx
                            >
                                {tradeType === 'BUY' ? 'Buy' : 'Sell'}
                            </Button>
                        </div>
                    </div>
                </div>

            </form>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </Card>
    );
};
