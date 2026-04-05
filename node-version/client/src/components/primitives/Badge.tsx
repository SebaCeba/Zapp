import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-black uppercase tracking-tight rounded-full';
  
  const variantStyles = {
    primary: 'bg-blue-50 text-blue-700',
    secondary: 'bg-purple-50 text-purple-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1 text-[10px]',
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
