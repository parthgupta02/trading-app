
import React from 'react';

const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    success: 'bg-green-600 hover:bg-green-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-500 text-gray-900', // Matches Gold theme
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
