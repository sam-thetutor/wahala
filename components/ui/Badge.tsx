'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary-600',
        secondary: 'bg-secondary text-white hover:bg-secondary-600',
        success: 'bg-success text-white hover:bg-success-600',
        warning: 'bg-warning text-white hover:bg-warning-600',
        error: 'bg-error text-white hover:bg-error-600',
        outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-gray-100',
        // Status variants
        active: 'bg-success-100 text-success-800 border border-success-200',
        inactive: 'bg-gray-100 text-gray-800 border border-gray-200',
        pending: 'bg-warning-100 text-warning-800 border border-warning-200',
        ended: 'bg-gray-100 text-gray-600 border border-gray-200',
        // Market status variants
        'market-active': 'bg-green-100 text-green-800 border border-green-200',
        'market-ended': 'bg-gray-100 text-gray-600 border border-gray-200',
        'market-resolved': 'bg-blue-100 text-blue-800 border border-blue-200',
        // Category variants
        politics: 'bg-red-100 text-red-800 border border-red-200',
        sports: 'bg-green-100 text-green-800 border border-green-200',
        technology: 'bg-blue-100 text-blue-800 border border-blue-200',
        entertainment: 'bg-purple-100 text-purple-800 border border-purple-200',
        finance: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        science: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        weather: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
        general: 'bg-gray-100 text-gray-800 border border-gray-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
