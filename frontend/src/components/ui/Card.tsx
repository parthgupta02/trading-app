
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-[#151F32] p-4 rounded-lg shadow-xl border border-gray-800 ${className}`}>
            {title && <h2 className="text-lg font-bold text-gray-100 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#F59E0B] rounded-full inline-block"></span>
                {title}
            </h2>}
            {children}
        </div>
    );
};
