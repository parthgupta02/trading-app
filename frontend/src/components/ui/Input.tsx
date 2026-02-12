
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
