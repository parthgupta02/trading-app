
import React from 'react';

const variants = {
    primary: 'bg-[#F59E0B] hover:bg-yellow-600 text-gray-900 font-bold', // Gold, dark text
    secondary: 'bg-[#1F2937] hover:bg-gray-700 text-gray-200 border border-gray-600', // Dark slate
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-500 text-gray-900',
};

type ButtonVariant = keyof typeof variants;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    className = '',
    loading = false,
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) => {
    const baseStyles = 'py-2 px-4 font-bold rounded-lg shadow-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center';
    const variantStyles = variants[variant] || variants.primary;

    return (
        <button
            type={type}
            className={`${baseStyles} ${variantStyles} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading ? (
                <span className="loader mr-2">...</span> // Simple text loader for now
            ) : null}
            {children}
        </button>
    );
};
