const { designSystem } = require('./lib/design-system');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colors from design system
      colors: {
        primary: designSystem.colors.primary,
        secondary: designSystem.colors.secondary,
        success: designSystem.colors.success,
        warning: designSystem.colors.warning,
        error: designSystem.colors.error,
        gray: designSystem.colors.gray,
        accent: designSystem.colors.accent,
      },
      
      // Typography from design system
      fontFamily: designSystem.typography.fontFamily,
      fontSize: designSystem.typography.fontSize,
      fontWeight: designSystem.typography.fontWeight,
      letterSpacing: designSystem.typography.letterSpacing,
      lineHeight: designSystem.typography.lineHeight,
      
      // Spacing from design system
      spacing: designSystem.spacing,
      
      // Border radius from design system
      borderRadius: designSystem.borderRadius,
      
      // Box shadow from design system
      boxShadow: designSystem.shadows,
      
      // Z-index from design system
      zIndex: designSystem.zIndex,
      
      // Breakpoints from design system
      screens: {
        'sm': designSystem.breakpoints.sm,
        'md': designSystem.breakpoints.md,
        'lg': designSystem.breakpoints.lg,
        'xl': designSystem.breakpoints.xl,
        '2xl': designSystem.breakpoints['2xl'],
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 5s ease-in-out infinite',
      },
      
      // Custom keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideInRight: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(100%)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)'
          },
        },
        slideInLeft: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(-100%)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0)'
          },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(5deg)' },
          '50%': { transform: 'translateY(-20px) rotate(0deg)' },
          '75%': { transform: 'translateY(-10px) rotate(-5deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(10px) rotate(-5deg)' },
          '50%': { transform: 'translateY(20px) rotate(0deg)' },
          '75%': { transform: 'translateY(10px) rotate(5deg)' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for design system utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Text utilities
        '.text-primary': {
          color: theme('colors.primary.500'),
        },
        '.text-secondary': {
          color: theme('colors.secondary.500'),
        },
        '.text-success': {
          color: theme('colors.success.500'),
        },
        '.text-warning': {
          color: theme('colors.warning.500'),
        },
        '.text-error': {
          color: theme('colors.error.500'),
        },
        
        // Background utilities
        '.bg-primary': {
          backgroundColor: theme('colors.primary.500'),
        },
        '.bg-secondary': {
          backgroundColor: theme('colors.secondary.500'),
        },
        '.bg-success': {
          backgroundColor: theme('colors.success.500'),
        },
        '.bg-warning': {
          backgroundColor: theme('colors.warning.500'),
        },
        '.bg-error': {
          backgroundColor: theme('colors.error.500'),
        },
        
        // Border utilities
        '.border-primary': {
          borderColor: theme('colors.primary.500'),
        },
        '.border-secondary': {
          borderColor: theme('colors.secondary.500'),
        },
        '.border-success': {
          borderColor: theme('colors.success.500'),
        },
        '.border-warning': {
          borderColor: theme('colors.warning.500'),
        },
        '.border-error': {
          borderColor: theme('colors.error.500'),
        },
        
        // Focus utilities
        '.focus-ring': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
            borderColor: theme('colors.primary.500'),
          },
        },
        
        // Card utilities
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.base'),
          border: `1px solid ${theme('colors.gray.200')}`,
        },
        '.card-elevated': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.lg'),
          border: 'none',
        },
        
        // Button utilities
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.lg'),
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-sm': {
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm'),
        },
        '.btn-md': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.base'),
        },
        '.btn-lg': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          fontSize: theme('fontSize.lg'),
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.500'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.primary.600'),
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.secondary.500'),
          color: theme('colors.white'),
          '&:hover': {
            backgroundColor: theme('colors.secondary.600'),
          },
        },
        '.btn-outline': {
          backgroundColor: 'transparent',
          color: theme('colors.primary.500'),
          border: `1px solid ${theme('colors.primary.500')}`,
          '&:hover': {
            backgroundColor: theme('colors.primary.50'),
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.gray.700'),
          '&:hover': {
            backgroundColor: theme('colors.gray.100'),
          },
        },
        
        // Input utilities
        '.input': {
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.base'),
          borderRadius: theme('borderRadius.md'),
          border: `1px solid ${theme('colors.gray.300')}`,
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`,
          },
        },
        
        // Typography utilities
        '.heading-1': {
          fontSize: theme('fontSize.4xl'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.tight'),
          color: theme('colors.gray.900'),
        },
        '.heading-2': {
          fontSize: theme('fontSize.3xl'),
          fontWeight: theme('fontWeight.bold'),
          lineHeight: theme('lineHeight.tight'),
          color: theme('colors.gray.900'),
        },
        '.heading-3': {
          fontSize: theme('fontSize.2xl'),
          fontWeight: theme('fontWeight.semibold'),
          lineHeight: theme('lineHeight.snug'),
          color: theme('colors.gray.900'),
        },
        '.heading-4': {
          fontSize: theme('fontSize.xl'),
          fontWeight: theme('fontWeight.semibold'),
          lineHeight: theme('lineHeight.snug'),
          color: theme('colors.gray.900'),
        },
        '.body-large': {
          fontSize: theme('fontSize.lg'),
          lineHeight: theme('lineHeight.relaxed'),
          color: theme('colors.gray.700'),
        },
        '.body': {
          fontSize: theme('fontSize.base'),
          lineHeight: theme('lineHeight.normal'),
          color: theme('colors.gray.700'),
        },
        '.body-small': {
          fontSize: theme('fontSize.sm'),
          lineHeight: theme('lineHeight.normal'),
          color: theme('colors.gray.600'),
        },
        '.caption': {
          fontSize: theme('fontSize.xs'),
          lineHeight: theme('lineHeight.normal'),
          color: theme('colors.gray.500'),
        },
        
        // Layout utilities
        '.container': {
          maxWidth: theme('screens.xl'),
          margin: '0 auto',
          padding: `0 ${theme('spacing.4')}`,
          '@screen sm': {
            padding: `0 ${theme('spacing.6')}`,
          },
          '@screen lg': {
            padding: `0 ${theme('spacing.8')}`,
          },
        },
        
        // Mobile-specific utilities
        '.mobile-only': {
          display: 'block',
          '@screen md': {
            display: 'none',
          },
        },
        '.desktop-only': {
          display: 'none',
          '@screen md': {
            display: 'block',
          },
        },
        
        // Touch target utilities
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
};
