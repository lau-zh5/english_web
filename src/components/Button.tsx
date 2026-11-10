import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: React.FormEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-apple-blue text-white hover:bg-apple-blueHover shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    outline: 'border-2 border-apple-blue text-apple-blue hover:bg-blue-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
