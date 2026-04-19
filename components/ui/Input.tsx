import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full">
        {label && (
          <label className="mb-2 text-sm font-bold text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 
            transition-colors duration-200 focus:outline-none focus:ring-2 
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-200 focus:border-yisraeli-blue focus:ring-yisraeli-yellow/50'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="mt-1 text-sm text-red-500">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
