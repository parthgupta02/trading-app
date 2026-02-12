
import React from 'react';
import { TradeForm } from '../components/TradeForm';
import { HistoryTable } from '../components/HistoryTable';

export const GoldPage = () => {
    return (
        <div className="space-y-8">
            <TradeForm commodity="gold" />
            <HistoryTable commodity="gold" />
        </div>
    );
};
