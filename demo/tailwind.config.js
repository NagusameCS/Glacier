import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        glacier: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.1), 0 4px 30px rgba(0, 0, 0, 0.1)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 255, 255, 0.2), 0 4px 30px rgba(0, 0, 0, 0.1)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    // Glacier Plugin (inline for demo)
    plugin(function({ addBase, addComponents, addUtilities, matchUtilities, theme }) {
      // Root CSS variables
      addBase({
        ':root': {
          '--glacier-blur': '12px',
          '--glacier-opacity': '0.15',
          '--glacier-saturation': '180%',
          '--glacier-tint-opacity': '0.1',
          '--glacier-border-opacity': '0.2',
          '--glacier-shadow-opacity': '0.1',
          '--glacier-fresnel': '0.2',
          '--glacier-glare': '0.1',
          '--glacier-glare-angle': '135deg',
          '--glacier-transition': '0.3s ease',
        },
      });

      // Base glass utilities
      addUtilities({
        '.glacier-glass': {
          '--glacier-blur': '12px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
        },
        '.glacier-glass-clear': {
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        },
      });

      // Blur utilities
      const blurValues = {
        none: '0',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      };

      matchUtilities(
        {
          'glacier-blur': (value) => ({
            '--glacier-blur': value,
            backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
            WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          }),
        },
        { values: blurValues }
      );

      // Saturation utilities
      const saturationValues = {
        '0': '0%',
        '50': '50%',
        '75': '75%',
        '100': '100%',
        '125': '125%',
        '150': '150%',
        '200': '200%',
      };

      matchUtilities(
        {
          'glacier-saturate': (value) => ({
            '--glacier-saturation': value,
          }),
        },
        { values: saturationValues }
      );

      // Liquid glass effects
      addUtilities({
        '.glacier-liquid': {
          position: 'relative',
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          '--glacier-tint-opacity': '0.08',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, var(--glacier-tint-opacity))',
          border: '1px solid rgba(255, 255, 255, calc(var(--glacier-border-opacity) * 0.5))',
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            inset 0 -1px 1px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, var(--glacier-shadow-opacity))
          `,
          overflow: 'hidden',
        },
        '.glacier-liquid-refract': {
          position: 'relative',
          '--glacier-blur': '20px',
          '--glacier-saturation': '200%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.05),
            0 8px 32px rgba(0, 0, 0, 0.15)
          `,
          overflow: 'hidden',
        },
        '.glacier-liquid-fresnel': {
          position: 'relative',
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
          overflow: 'hidden',
        },
        '.glacier-liquid-glare': {
          position: 'relative',
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        },
      });

      // Frosted glass effects
      addUtilities({
        '.glacier-frosted': {
          '--glacier-blur': '10px',
          '--glacier-saturation': '120%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        },
        '.glacier-frosted-light': {
          '--glacier-blur': '10px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(120%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(120%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.glacier-frosted-dark': {
          '--glacier-blur': '10px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(120%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(120%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glacier-frosted-subtle': {
          '--glacier-blur': '6px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(100%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(100%)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        },
        '.glacier-frosted-heavy': {
          '--glacier-blur': '20px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(150%)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      });

      // Tint utilities
      addUtilities({
        '.glacier-tint-white': {
          backgroundColor: 'rgba(255, 255, 255, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-black': {
          backgroundColor: 'rgba(0, 0, 0, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-primary': {
          backgroundColor: 'rgba(59, 130, 246, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-secondary': {
          backgroundColor: 'rgba(147, 51, 234, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-success': {
          backgroundColor: 'rgba(34, 197, 94, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-warning': {
          backgroundColor: 'rgba(245, 158, 11, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-danger': {
          backgroundColor: 'rgba(239, 68, 68, var(--glacier-tint-opacity))',
        },
        '.glacier-tint-info': {
          backgroundColor: 'rgba(6, 182, 212, var(--glacier-tint-opacity))',
        },
      });

      // Border utilities
      addUtilities({
        '.glacier-border': {
          border: '1px solid rgba(255, 255, 255, var(--glacier-border-opacity))',
        },
        '.glacier-border-light': {
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        '.glacier-border-dark': {
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
        '.glacier-border-glow': {
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        },
      });

      // Shadow utilities
      addUtilities({
        '.glacier-shadow': {
          boxShadow: '0 4px 30px rgba(0, 0, 0, var(--glacier-shadow-opacity))',
        },
        '.glacier-shadow-sm': {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
        '.glacier-shadow-lg': {
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
        },
        '.glacier-shadow-xl': {
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.2)',
        },
        '.glacier-shadow-glow': {
          boxShadow: '0 0 30px rgba(255, 255, 255, 0.15)',
        },
      });

      // Animation utilities
      addUtilities({
        '.glacier-animate': {
          transition: 'var(--glacier-transition)',
          transitionProperty: 'backdrop-filter, background-color, box-shadow, border, transform',
        },
        '.glacier-animate-slow': {
          '--glacier-transition': '0.5s ease',
          transition: 'var(--glacier-transition)',
        },
        '.glacier-animate-fast': {
          '--glacier-transition': '0.15s ease',
          transition: 'var(--glacier-transition)',
        },
      });

      // Hover states
      addUtilities({
        '.glacier-hover-brighten': {
          '&:hover': {
            '--glacier-tint-opacity': '0.15',
            boxShadow: `
              inset 0 1px 2px rgba(255, 255, 255, 0.2),
              0 8px 40px rgba(0, 0, 0, 0.15)
            `,
          },
        },
        '.glacier-hover-lift': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
        '.glacier-hover-glow': {
          '&:hover': {
            boxShadow: `
              0 0 30px rgba(255, 255, 255, 0.2),
              0 8px 40px rgba(0, 0, 0, 0.15)
            `,
          },
        },
      });

      // Active states
      addUtilities({
        '.glacier-active-press': {
          '&:active': {
            transform: 'scale(0.98)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      });

      // Component presets
      addComponents({
        '.glacier-card': {
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
          padding: '1.5rem',
          overflow: 'hidden',
        },
        '.glacier-panel': {
          '--glacier-blur': '24px',
          '--glacier-saturation': '200%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.05),
            0 8px 40px rgba(0, 0, 0, 0.15)
          `,
          padding: '2rem',
          overflow: 'hidden',
        },
        '.glacier-modal': {
          '--glacier-blur': '40px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },
        '.glacier-window': {
          '--glacier-blur': '30px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05), 0 10px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        },
        '.glacier-notification': {
          '--glacier-blur': '20px',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(180%)',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
          padding: '1rem 1.25rem',
          overflow: 'hidden',
        },
      });

      // Glare utilities
      addUtilities({
        '.glacier-glare': {
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '0',
            background: `linear-gradient(
              var(--glacier-glare-angle),
              rgba(255, 255, 255, var(--glacier-glare)) 0%,
              transparent 50%,
              transparent 100%
            )`,
            pointerEvents: 'none',
          },
        },
        '.glacier-glare-subtle': {
          '--glacier-glare': '0.05',
        },
        '.glacier-glare-light': {
          '--glacier-glare': '0.1',
        },
        '.glacier-glare-medium': {
          '--glacier-glare': '0.2',
        },
        '.glacier-glare-strong': {
          '--glacier-glare': '0.3',
        },
        '.glacier-glare-tl': { '--glacier-glare-angle': '135deg' },
        '.glacier-glare-tr': { '--glacier-glare-angle': '225deg' },
        '.glacier-glare-bl': { '--glacier-glare-angle': '45deg' },
        '.glacier-glare-br': { '--glacier-glare-angle': '315deg' },
      });

      // Fresnel utilities
      addUtilities({
        '.glacier-fresnel-subtle': {
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.1),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
        },
        '.glacier-fresnel-light': {
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.2),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
        },
        '.glacier-fresnel-medium': {
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
        },
        '.glacier-fresnel-strong': {
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1),
            0 8px 40px rgba(0, 0, 0, 0.15)
          `,
        },
      });
    }),
  ],
}
