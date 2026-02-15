import React from 'react';
import { Card } from "./ui/Card";


interface Position {
    price: number;
    quantity: number;
}

goldPositions: { longs: Position[]; shorts: Position[] };
silverPositions: { longs: Position[]; shorts: Position[] };
}

export const OpenPositionsCard: React.FC<OpenPositionsProps> = ({ goldPositions, silverPositions }) => {



    const renderPositions = (positions: Position[], type: 'Long' | 'Short') => {
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
                                {type === 'Long' ? (
                                    <span className="text-green-500 font-bold">BUY</span>
                                ) : (
                                    <span className="text-red-500 font-bold">SELL</span>
                                )}
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
                            {renderPositions(goldPositions.longs, 'Long')}
                            {renderPositions(goldPositions.shorts, 'Short')}
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
                            {renderPositions(silverPositions.longs, 'Long')}
                            {renderPositions(silverPositions.shorts, 'Short')}
                        </>
                    )}
                </div>

            </div>
        </Card>
    );
};
