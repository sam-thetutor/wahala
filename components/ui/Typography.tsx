'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'heading-1 text-4xl font-bold leading-tight tracking-tight',
      h2: 'heading-2 text-3xl font-bold leading-tight tracking-tight',
      h3: 'heading-3 text-2xl font-semibold leading-snug tracking-tight',
      h4: 'heading-4 text-xl font-semibold leading-snug tracking-tight',
      h5: 'text-lg font-semibold leading-snug tracking-tight',
      h6: 'text-base font-semibold leading-snug tracking-tight',
      body: 'body text-base leading-normal',
      'body-large': 'body-large text-lg leading-relaxed',
      'body-small': 'body-small text-sm leading-normal',
      caption: 'caption text-xs leading-normal',
      lead: 'text-lg leading-relaxed text-gray-600',
      blockquote: 'border-l-4 border-gray-300 pl-4 italic text-gray-700',
      code: 'font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded',
      pre: 'font-mono text-sm bg-gray-100 p-4 rounded-lg overflow-x-auto',
    },
    color: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      tertiary: 'text-gray-500',
      inverse: 'text-white',
      success: 'text-success-600',
      warning: 'text-warning-600',
      error: 'text-error-600',
      muted: 'text-gray-400',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'primary',
    weight: 'normal',
    align: 'left',
  },
});

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant, 
    color, 
    weight, 
    align, 
    as, 
    children, 
    ...props 
  }, ref) => {
    // Determine the HTML element based on variant or as prop
    const getElement = () => {
      if (as) return as;
      
      switch (variant) {
        case 'h1': return 'h1';
        case 'h2': return 'h2';
        case 'h3': return 'h3';
        case 'h4': return 'h4';
        case 'h5': return 'h5';
        case 'h6': return 'h6';
        case 'blockquote': return 'blockquote';
        case 'code': return 'code';
        case 'pre': return 'pre';
        default: return 'p';
      }
    };
    
    const Element = getElement() as keyof JSX.IntrinsicElements;
    
    return (
      <Element
        className={cn(typographyVariants({ variant, color, weight, align, className }))}
        ref={ref as any}
        {...(props as any)}
      >
        {children}
      </Element>
    );
  }
);

Typography.displayName = 'Typography';

// Convenience components for common typography patterns
export const Heading1 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h1" {...props} />
);
Heading1.displayName = 'Heading1';

export const Heading2 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h2" {...props} />
);
Heading2.displayName = 'Heading2';

export const Heading3 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h3" {...props} />
);
Heading3.displayName = 'Heading3';

export const Heading4 = React.forwardRef<HTMLHeadingElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="h4" {...props} />
);
Heading4.displayName = 'Heading4';

export const Body = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body" {...props} />
);
Body.displayName = 'Body';

export const BodyLarge = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body-large" {...props} />
);
BodyLarge.displayName = 'BodyLarge';

export const BodySmall = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="body-small" {...props} />
);
BodySmall.displayName = 'BodySmall';

export const Caption = React.forwardRef<HTMLSpanElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="caption" {...props} />
);
Caption.displayName = 'Caption';

export const Lead = React.forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="lead" {...props} />
);
Lead.displayName = 'Lead';

export const Code = React.forwardRef<HTMLElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="code" {...props} />
);
Code.displayName = 'Code';

export const Pre = React.forwardRef<HTMLPreElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => <Typography ref={ref} variant="pre" {...props} />
);
Pre.displayName = 'Pre';

export { Typography, typographyVariants };
