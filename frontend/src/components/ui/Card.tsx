
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 ${className}`}>
            {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
            {children}
        </div>
    );
};
