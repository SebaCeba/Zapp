import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'rounded' | 'hero';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const baseStyles = 'bg-white shadow-sm';
  
  const variantStyles = {
    default: 'rounded-[24px]',
    rounded: 'rounded-3xl',
    hero: 'rounded-[32px]',
  };
  
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const interactiveStyles = onClick 
    ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' 
    : '';
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
