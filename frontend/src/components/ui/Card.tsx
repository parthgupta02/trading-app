
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-[#151F32] p-3 rounded-lg shadow-xl border border-gray-800 ${className}`}>
            {title && <h2 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5">
                <span className="w-0.5 h-4 bg-[#F59E0B] rounded-full inline-block"></span>
                {title}
            </h2>}
            {children}
        </div>
    );
};
