import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-colors duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-yisraeli-yellow text-yisraeli-blue hover:bg-yellow-400 shadow-md hover:shadow-lg',
    secondary: 'bg-yisraeli-blue text-white hover:bg-blue-900 shadow-md hover:shadow-lg',
    outline: 'border-2 border-yisraeli-blue text-yisraeli-blue hover:bg-blue-50',
    ghost: 'bg-transparent text-yisraeli-blue hover:bg-blue-50',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-5 py-2.5',
    lg: 'text-lg px-8 py-3',
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
