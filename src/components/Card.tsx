import { ReactNode, forwardRef } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', onClick, hover = false }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={`glass rounded-2xl ${
          hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : ''
        } transition-all duration-300 ${className}`}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-6 border-b border-white/30 ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
