import React from 'react';
import { Card } from "./ui/Card";
import { TradingSettings } from '../types';

interface Position {
    price: number;
    quantity: number;
}

interface OpenPositionsProps {
    goldPositions: { longs: Position[]; shorts: Position[] };
    silverPositions: { longs: Position[]; shorts: Position[] };
    settings: TradingSettings;
}

export const OpenPositionsCard: React.FC<OpenPositionsProps> = ({ goldPositions, silverPositions, settings }) => {

    const calculateValue = (price: number, quantity: number, commodity: 'gold' | 'silver') => {
        const lotSize = commodity === 'gold' ? settings.gold.lotSize : settings.silver.lotSize;
        const multiplier = commodity === 'gold' ? (lotSize / 10) : (lotSize / 1);
        return (price * quantity * multiplier).toFixed(2);
    };

    const renderPositions = (positions: Position[], type: 'Long' | 'Short', commodity: 'gold' | 'silver') => {
        if (positions.length === 0) return null;

        return (
            <div className="mb-4">
                <h4 className={`text-sm font-semibold mb-2 ${type === 'Long' ? 'text-green-500' : 'text-red-500'}`}>
                    {type} Positions
                </h4>
                <div className="space-y-2">
                    {positions.map((pos, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-900/50 p-2 rounded text-sm border border-gray-800">
                            <span>
                                <span className="text-gray-400">Rate:</span> {pos.price.toLocaleString()}
                            </span>
                            <span>
                                <span className="text-gray-400">Qty:</span> {pos.quantity}
                            </span>
                            <span>
                                <span className="text-gray-400">Val:</span> {calculateValue(pos.price, pos.quantity, commodity)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const hasGoldPositions = goldPositions.longs.length > 0 || goldPositions.shorts.length > 0;
    const hasSilverPositions = silverPositions.longs.length > 0 || silverPositions.shorts.length > 0;

    return (
        <Card title="Open Standing Positions" className="bg-[#1a1d24] border-gray-800">
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Gold Column */}
                <div>
                    <h3 className="text-[#F59E0B] font-bold mb-3 border-b border-[#F59E0B]/30 pb-1">Gold Mini</h3>
                    {!hasGoldPositions ? (
                        <div className="text-gray-500 text-sm italic">No open positions</div>
                    ) : (
                        <>
                            {renderPositions(goldPositions.longs, 'Long', 'gold')}
                            {renderPositions(goldPositions.shorts, 'Short', 'gold')}
                        </>
                    )}
                </div>
                {/* Silver Column */}
                <div>
                    <h3 className="text-gray-300 font-bold mb-3 border-b border-gray-500/30 pb-1">Silver Mini</h3>
                    {!hasSilverPositions ? (
                        <div className="text-gray-500 text-sm italic">No open positions</div>
                    ) : (
                        <>
                            {renderPositions(silverPositions.longs, 'Long', 'silver')}
                            {renderPositions(silverPositions.shorts, 'Short', 'silver')}
                        </>
                    )}
                </div>

            </div>
        </Card>
    );
};
