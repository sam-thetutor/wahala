'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'input w-full transition-all duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-primary focus:ring-primary-100',
        error: 'border-error focus:border-error focus:ring-error-100',
        success: 'border-success focus:border-success focus:ring-success-100',
        warning: 'border-warning focus:border-warning focus:ring-warning-100',
      },
      size: {
        sm: 'h-8 px-2 text-sm',
        md: 'h-10 px-3 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: string;
  rightAddon?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    leftAddon,
    rightAddon,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const inputVariant = hasError ? 'error' : variant;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          {leftAddon && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-500">
              {leftAddon}
            </div>
          )}
          
            <input
              id={inputId}
              className={cn(
                inputVariants({ variant: inputVariant, size: size as 'sm' | 'md' | 'lg', className }),
                leftIcon && 'pl-10',
                leftAddon && 'pl-16',
                rightIcon && 'pr-10',
                rightAddon && 'pr-16'
              )}
              ref={ref}
              {...props}
            />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {rightAddon && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center px-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500">
              {rightAddon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
