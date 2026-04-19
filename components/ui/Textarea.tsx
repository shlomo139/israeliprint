import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full">
        {label && (
          <label className="block text-gray-700 font-bold mb-3 text-xl">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full border-2 rounded-xl p-4 text-lg bg-white text-gray-900 
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:border-transparent resize-none shadow-inner
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-200 focus:ring-yisraeli-blue'
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

Textarea.displayName = 'Textarea';
