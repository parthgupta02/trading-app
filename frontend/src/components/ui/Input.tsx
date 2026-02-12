
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1 uppercase tracking-xs">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                className={`w-full px-4 py-2 bg-[#1F2937] border border-gray-800 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] transition-all duration-200 placeholder-gray-600 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
