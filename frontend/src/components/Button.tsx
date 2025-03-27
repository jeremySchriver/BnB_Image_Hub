
import React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | "destructive";
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    icon, 
    iconPosition = 'left',
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/30',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary/30',
      outline: 'border border-input bg-transparent hover:bg-secondary/50 focus:ring-secondary',
      ghost: 'hover:bg-secondary focus:ring-secondary',
      link: 'text-primary underline-offset-4 hover:underline',
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    };

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 rounded-md',
      md: 'text-sm px-4 py-2 rounded-lg',
      lg: 'text-base px-5 py-2.5 rounded-lg'
    };

    const loadingSpinner = (
      <svg 
        className="animate-spin -ml-1 mr-2 h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          "transform active:scale-[0.98] active:translate-y-[1px]",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && loadingSpinner}
        {!isLoading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        <span className="flex-1">{children}</span>
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
        <span className="absolute inset-0 bg-white/0 rounded-lg hover:bg-white/5 transition-colors duration-200"></span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
