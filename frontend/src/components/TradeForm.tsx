
import React, { useState, FormEvent, useEffect, useRef } from 'react';
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

    // Refs for keyboard navigation
    const dateRef = useRef<HTMLInputElement>(null);
    const timeRef = useRef<HTMLInputElement>(null);
    const tradeTypeRef = useRef<HTMLSelectElement>(null);
    const quantityRef = useRef<HTMLInputElement>(null);
    const rateRef = useRef<HTMLInputElement>(null);
    const submitRef = useRef<HTMLButtonElement>(null);

    const handleKeyDown = (
        e: React.KeyboardEvent,
        nextRef: React.RefObject<any> | null,
        prevRef: React.RefObject<any> | null
    ) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                if (prevRef) {
                    e.preventDefault();
                    prevRef.current?.focus();
                }
            } else {
                if (nextRef) {
                    e.preventDefault();
                    nextRef.current?.focus();
                }
            }
        }
    };

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

        // Auto-focus Date input on mount
        setTimeout(() => {
            dateRef.current?.focus();
        }, 0);
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

            // Focus back to Date input
            setTimeout(() => {
                dateRef.current?.focus();
            }, 0);

        } catch (err) {
            console.error('Error adding trade:', err);
            setError('Failed to save trade.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`mb-8 p-6 ${borderColor} bg-gray-900 shadow-xl border-t-4`}>
            {/* Header: Title and Date/Time */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className={`text-xl font-bold ${isGold ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {title}
                </h2>

                {/* Subtle Date/Time Controls */}
                <div className="flex space-x-2 bg-gray-800 p-1.5 rounded border border-gray-700">
                    <input
                        ref={dateRef}
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, timeRef, null)}
                        className="bg-transparent text-gray-400 text-sm focus:outline-none focus:text-white"
                    />
                    <div className="w-px bg-gray-600 h-4 self-center"></div>
                    <input
                        ref={timeRef}
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, tradeTypeRef, dateRef)}
                        className="bg-transparent text-gray-400 text-sm focus:outline-none focus:text-white"
                    />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">

                    {/* Trade Type */}
                    <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            Trade Type
                        </label>
                        <select
                            ref={tradeTypeRef}
                            value={tradeType}
                            onChange={(e) => setTradeType(e.target.value as 'BUY' | 'SELL')}
                            onKeyDown={(e) => handleKeyDown(e, quantityRef, timeRef)}
                            className={`w-full h-10 bg-[#1F2937] text-white border border-gray-700 rounded px-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F59E0B] transition-all cursor-pointer ${tradeType === 'BUY' ? 'focus:border-green-500' : 'focus:border-red-500'}`}
                        >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            Quantity
                        </label>
                        <Input
                            ref={quantityRef}
                            type="number"
                            step="1"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, rateRef, tradeTypeRef)}
                            className="h-10 text-center text-sm bg-[#1F2937] border-gray-700 focus:border-[#F59E0B]"
                            placeholder="Qty"
                        />
                    </div>

                    {/* Rate */}
                    <div className="sm:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                            {rateLabel}
                        </label>
                        <Input
                            ref={rateRef}
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.00"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, submitRef, quantityRef)}
                            className={`block w-full h-10 text-xl font-bold text-center bg-[#1F2937] border-2 rounded focus:ring-0 transition-all ${tradeType === 'BUY' ? 'border-gray-700 focus:border-green-500 text-green-400' : 'border-gray-700 focus:border-red-500 text-red-400'}`}
                        />
                    </div>

                    {/* Action Button */}
                    <div className="sm:col-span-3">
                        <Button
                            ref={submitRef}
                            type="submit"
                            variant={buttonColor} // success or danger
                            loading={loading}
                            onKeyDown={(e) => handleKeyDown(e, null, rateRef)}
                            className="w-full h-10 text-sm font-bold uppercase shadow-sm transform transition active:scale-[0.98]"
                            disabled={!rate || !quantity}
                        >
                            {tradeType === 'BUY' ? 'EXECUTE BUY' : 'EXECUTE SELL'}
                        </Button>
                    </div>
                </div>
            </form>

            {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center">
                    {error}
                </div>
            )}
        </Card>
    );
};
