
import { TradeForm } from '../components/TradeForm';
import { HistoryTable } from '../components/HistoryTable';

export const SilverPage = () => {
    return (
        <div className="space-y-4">
            <TradeForm commodity="silver" />
            <HistoryTable commodity="silver" />
        </div>
    );
};
