
import React from 'react';
import { TradeForm } from '../components/TradeForm';
import { HistoryTable } from '../components/HistoryTable';

export const SilverPage = () => {
    return (
        <div className="space-y-8">
            <TradeForm commodity="silver" />
            <HistoryTable commodity="silver" />
        </div>
    );
};
