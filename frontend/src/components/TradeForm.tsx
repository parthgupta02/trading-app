
import React, { useState, FormEvent } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { toStorageDate } from '../utils/dateUtils';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface TradeFormProps {
    commodity: string;
}

export const TradeForm: React.FC<TradeFormProps> = ({ commodity }) => {
    const { currentUser } = useAuth();
    const { APP_ID } = useData();
    const [buyAmount, setBuyAmount] = useState('');
    const [sellAmount, setSellAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isGold = commodity === 'gold';
    const title = isGold ? 'New Gold Mini Trade (100g)' : 'New Silver Mini Trade (5kg)';
    const buyLabel = isGold ? 'Buy Rate (per 10g)' : 'Buy Rate (per 1kg)';
    const sellLabel = isGold ? 'Sell Rate (per 10g)' : 'Sell Rate (per 1kg)';
    const borderColor = isGold ? 'border-yellow-700' : 'border-gray-600';
    const buttonColor = isGold ? 'warning' : 'primary';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const buy = buyAmount === '' ? 0 : parseFloat(buyAmount);
        const sell = sellAmount === '' ? 0 : parseFloat(sellAmount);

        if (isNaN(buy) || isNaN(sell)) {
            setError('Please enter valid numbers.');
            return;
        }
        if (buy === 0 && sell === 0) {
            setError('Please enter a Buy or Sell Amount.');
            return;
        }

        if (!currentUser) {
            setError('You must be logged in.');
            return;
        }

        setLoading(true);
        try {
            const path = `artifacts/${APP_ID}/users/${currentUser.uid}/commodity_trades`;
            await addDoc(collection(db, path), {
                buyAmount: buy,
                sellAmount: sell,
                commodity,
                timestamp: serverTimestamp(),
                date: toStorageDate(new Date()),
            });
            setBuyAmount('');
            setSellAmount('');
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
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                <div className="col-span-1">
                    <Input
                        label={buyLabel}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Rate"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="focus:ring-green-500 focus:border-green-500"
                    />
                </div>
                <div className="col-span-1">
                    <Input
                        label={sellLabel}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Rate"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        className="focus:ring-red-500 focus:border-red-500"
                    />
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end">
                    <Button
                        type="submit"
                        variant={buttonColor}
                        loading={loading}
                        className="w-full"
                        disabled={(!buyAmount && !sellAmount)}
                    >
                        Add Trade
                    </Button>
                </div>
            </form>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </Card>
    );
};
