import plugin from 'tailwindcss/plugin';
import type { PluginAPI } from 'tailwindcss/types/config';

// SVG Filter IDs
const FILTER_IDS = {
  liquidGlass: 'glacier-liquid-glass',
  liquidGlassLight: 'glacier-liquid-glass-light',
  liquidGlassDark: 'glacier-liquid-glass-dark',
  frosted: 'glacier-frosted',
  frostedLight: 'glacier-frosted-light',
  frostedDark: 'glacier-frosted-dark',
  refraction: 'glacier-refraction',
  dispersion: 'glacier-dispersion',
  glow: 'glacier-glow',
} as const;

// Default theme configuration
const defaultTheme = {
  // Glass blur amounts
  glassBlur: {
    none: '0',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '40px',
    '3xl': '64px',
  },
  // Glass opacity levels
  glassOpacity: {
    0: '0',
    5: '0.05',
    10: '0.1',
    15: '0.15',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    80: '0.8',
    90: '0.9',
    100: '1',
  },
  // Glass tint colors
  glassTint: {
    white: 'rgba(255, 255, 255, var(--glacier-tint-opacity, 0.1))',
    black: 'rgba(0, 0, 0, var(--glacier-tint-opacity, 0.1))',
    primary: 'rgba(59, 130, 246, var(--glacier-tint-opacity, 0.1))',
    secondary: 'rgba(147, 51, 234, var(--glacier-tint-opacity, 0.1))',
    success: 'rgba(34, 197, 94, var(--glacier-tint-opacity, 0.1))',
    warning: 'rgba(245, 158, 11, var(--glacier-tint-opacity, 0.1))',
    danger: 'rgba(239, 68, 68, var(--glacier-tint-opacity, 0.1))',
    info: 'rgba(6, 182, 212, var(--glacier-tint-opacity, 0.1))',
  },
  // Glass saturation
  glassSaturation: {
    0: '0%',
    50: '50%',
    75: '75%',
    100: '100%',
    125: '125%',
    150: '150%',
    200: '200%',
  },
  // Refraction strength
  glassRefraction: {
    none: '0',
    subtle: '2px',
    light: '4px',
    medium: '8px',
    strong: '12px',
    intense: '20px',
  },
  // Glass border styles
  glassBorder: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
  // Fresnel intensity
  glassFresnel: {
    none: '0',
    subtle: '0.1',
    light: '0.2',
    medium: '0.3',
    strong: '0.5',
    intense: '0.7',
  },
  // Glare intensity
  glassGlare: {
    none: '0',
    subtle: '0.05',
    light: '0.1',
    medium: '0.2',
    strong: '0.3',
    intense: '0.5',
  },
};

// Plugin options interface
export interface GlacierOptions {
  prefix?: string;
  injectSvgFilters?: boolean;
  theme?: Partial<typeof defaultTheme>;
}

// Main Glacier plugin
const glacierPlugin = plugin.withOptions<GlacierOptions>(
  (options = {}) => {
    const { prefix = 'glacier', injectSvgFilters = true } = options;

    return ({ addBase, addComponents, addUtilities, matchUtilities, theme }: PluginAPI) => {
      // Inject CSS custom properties
      addBase({
        ':root': {
          '--glacier-blur': '12px',
          '--glacier-opacity': '0.15',
          '--glacier-saturation': '180%',
          '--glacier-tint-opacity': '0.1',
          '--glacier-border-opacity': '0.2',
          '--glacier-refraction': '0',
          '--glacier-fresnel': '0.2',
          '--glacier-glare': '0.1',
          '--glacier-glare-angle': '135deg',
          '--glacier-shadow-opacity': '0.1',
          '--glacier-transition': '0.3s ease',
        },
      });

      // Inject SVG filters into the document (via CSS)
      if (injectSvgFilters) {
        addBase({
          'body::before': {
            content: '""',
            position: 'absolute',
            width: '0',
            height: '0',
            overflow: 'hidden',
            zIndex: '-9999',
          },
        });
      }

      // ===========================================
      // BASE GLASS UTILITIES
      // ===========================================

      // Glass backdrop filter
      addUtilities({
        [`.${prefix}-glass`]: {
          '--glacier-blur': '12px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
        },
        [`.${prefix}-glass-clear`]: {
          '--glacier-blur': '0px',
          '--glacier-saturation': '100%',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        },
      });

      // Glass blur utilities
      matchUtilities(
        {
          [`${prefix}-blur`]: (value: string) => ({
            '--glacier-blur': value,
            backdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
            WebkitBackdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
          }),
        },
        { values: theme('glassBlur') }
      );

      // Glass saturation utilities
      matchUtilities(
        {
          [`${prefix}-saturate`]: (value: string) => ({
            '--glacier-saturation': value,
            backdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
            WebkitBackdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
          }),
        },
        { values: theme('glassSaturation') }
      );

      // ===========================================
      // LIQUID GLASS EFFECTS
      // ===========================================

      addUtilities({
        // Base liquid glass
        [`.${prefix}-liquid`]: {
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

        // Liquid glass with refraction effect
        [`.${prefix}-liquid-refract`]: {
          position: 'relative',
          '--glacier-blur': '20px',
          '--glacier-saturation': '200%',
          '--glacier-tint-opacity': '0.05',
          '--glacier-refraction': '4px',
          backdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
          WebkitBackdropFilter: `blur(var(--glacier-blur)) saturate(var(--glacier-saturation))`,
          backgroundColor: 'rgba(255, 255, 255, var(--glacier-tint-opacity))',
          border: '1px solid rgba(255, 255, 255, calc(var(--glacier-border-opacity) * 0.3))',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.15),
            inset 0 -2px 4px rgba(0, 0, 0, 0.05),
            0 8px 32px rgba(0, 0, 0, calc(var(--glacier-shadow-opacity) * 1.5))
          `,
          overflow: 'hidden',
        },

        // Liquid glass with fresnel reflection
        [`.${prefix}-liquid-fresnel`]: {
          position: 'relative',
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          '--glacier-fresnel': '0.3',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, var(--glacier-fresnel)),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
          overflow: 'hidden',
        },

        // Liquid glass with glare
        [`.${prefix}-liquid-glare`]: {
          position: 'relative',
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          '--glacier-glare': '0.2',
          '--glacier-glare-angle': '135deg',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
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
      });

      // ===========================================
      // FROSTED GLASS EFFECTS
      // ===========================================

      addUtilities({
        // Base frosted glass
        [`.${prefix}-frosted`]: {
          '--glacier-blur': '10px',
          '--glacier-saturation': '120%',
          '--glacier-tint-opacity': '0.7',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, var(--glacier-tint-opacity))',
        },

        // Light frosted
        [`.${prefix}-frosted-light`]: {
          '--glacier-blur': '10px',
          '--glacier-saturation': '120%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },

        // Dark frosted
        [`.${prefix}-frosted-dark`]: {
          '--glacier-blur': '10px',
          '--glacier-saturation': '120%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },

        // Subtle frosted
        [`.${prefix}-frosted-subtle`]: {
          '--glacier-blur': '6px',
          '--glacier-saturation': '100%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        },

        // Heavy frosted
        [`.${prefix}-frosted-heavy`]: {
          '--glacier-blur': '20px',
          '--glacier-saturation': '150%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
      });

      // ===========================================
      // GLASS TINT UTILITIES
      // ===========================================

      matchUtilities(
        {
          [`${prefix}-tint`]: (value: string) => ({
            backgroundColor: value,
          }),
        },
        { values: theme('glassTint') }
      );

      // Tint opacity
      matchUtilities(
        {
          [`${prefix}-tint-opacity`]: (value: string) => ({
            '--glacier-tint-opacity': value,
          }),
        },
        { values: theme('glassOpacity') }
      );

      // ===========================================
      // GLASS BORDER UTILITIES
      // ===========================================

      addUtilities({
        [`.${prefix}-border`]: {
          border: '1px solid rgba(255, 255, 255, var(--glacier-border-opacity))',
        },
        [`.${prefix}-border-light`]: {
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        [`.${prefix}-border-dark`]: {
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
        [`.${prefix}-border-glow`]: {
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
        },
        [`.${prefix}-border-inner`]: {
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
        },
      });

      // Border opacity
      matchUtilities(
        {
          [`${prefix}-border-opacity`]: (value: string) => ({
            '--glacier-border-opacity': value,
          }),
        },
        { values: theme('glassOpacity') }
      );

      // ===========================================
      // GLASS SHADOW UTILITIES
      // ===========================================

      addUtilities({
        [`.${prefix}-shadow`]: {
          boxShadow: '0 4px 30px rgba(0, 0, 0, var(--glacier-shadow-opacity))',
        },
        [`.${prefix}-shadow-sm`]: {
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
        [`.${prefix}-shadow-lg`]: {
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
        },
        [`.${prefix}-shadow-xl`]: {
          boxShadow: '0 12px 60px rgba(0, 0, 0, 0.2)',
        },
        [`.${prefix}-shadow-inner`]: {
          boxShadow: `
            inset 0 1px 2px rgba(255, 255, 255, 0.1),
            inset 0 -1px 2px rgba(0, 0, 0, 0.05)
          `,
        },
        [`.${prefix}-shadow-glow`]: {
          boxShadow: '0 0 30px rgba(255, 255, 255, 0.15)',
        },
      });

      // Shadow opacity
      matchUtilities(
        {
          [`${prefix}-shadow-opacity`]: (value: string) => ({
            '--glacier-shadow-opacity': value,
          }),
        },
        { values: theme('glassOpacity') }
      );

      // ===========================================
      // FRESNEL UTILITIES
      // ===========================================

      matchUtilities(
        {
          [`${prefix}-fresnel`]: (value: string) => ({
            '--glacier-fresnel': value,
            boxShadow: `
              inset 0 1px 2px rgba(255, 255, 255, var(--glacier-fresnel)),
              inset 0 -1px 2px rgba(0, 0, 0, 0.05),
              0 4px 30px rgba(0, 0, 0, var(--glacier-shadow-opacity))
            `,
          }),
        },
        { values: theme('glassFresnel') }
      );

      // ===========================================
      // GLARE UTILITIES
      // ===========================================

      matchUtilities(
        {
          [`${prefix}-glare`]: (value: string) => ({
            '--glacier-glare': value,
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
          }),
        },
        { values: theme('glassGlare') }
      );

      // Glare angle
      addUtilities({
        [`.${prefix}-glare-tl`]: { '--glacier-glare-angle': '135deg' },
        [`.${prefix}-glare-tr`]: { '--glacier-glare-angle': '225deg' },
        [`.${prefix}-glare-bl`]: { '--glacier-glare-angle': '45deg' },
        [`.${prefix}-glare-br`]: { '--glacier-glare-angle': '315deg' },
        [`.${prefix}-glare-t`]: { '--glacier-glare-angle': '180deg' },
        [`.${prefix}-glare-b`]: { '--glacier-glare-angle': '0deg' },
        [`.${prefix}-glare-l`]: { '--glacier-glare-angle': '90deg' },
        [`.${prefix}-glare-r`]: { '--glacier-glare-angle': '270deg' },
      });

      // ===========================================
      // REFRACTION UTILITIES
      // ===========================================

      matchUtilities(
        {
          [`${prefix}-refract`]: (value: string) => ({
            '--glacier-refraction': value,
            filter: `url(#${FILTER_IDS.refraction})`,
          }),
        },
        { values: theme('glassRefraction') }
      );

      // ===========================================
      // ANIMATION UTILITIES
      // ===========================================

      addUtilities({
        [`.${prefix}-animate`]: {
          transition: 'var(--glacier-transition)',
          transitionProperty: 'backdrop-filter, background-color, box-shadow, border, transform',
        },
        [`.${prefix}-animate-slow`]: {
          '--glacier-transition': '0.5s ease',
          transition: 'var(--glacier-transition)',
          transitionProperty: 'backdrop-filter, background-color, box-shadow, border, transform',
        },
        [`.${prefix}-animate-fast`]: {
          '--glacier-transition': '0.15s ease',
          transition: 'var(--glacier-transition)',
          transitionProperty: 'backdrop-filter, background-color, box-shadow, border, transform',
        },
      });

      // ===========================================
      // HOVER STATES
      // ===========================================

      addUtilities({
        [`.${prefix}-hover-brighten`]: {
          '&:hover': {
            '--glacier-tint-opacity': '0.15',
            boxShadow: `
              inset 0 1px 2px rgba(255, 255, 255, 0.2),
              0 8px 40px rgba(0, 0, 0, 0.15)
            `,
          },
        },
        [`.${prefix}-hover-lift`]: {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
        [`.${prefix}-hover-glow`]: {
          '&:hover': {
            boxShadow: `
              0 0 30px rgba(255, 255, 255, 0.2),
              0 8px 40px rgba(0, 0, 0, 0.15)
            `,
          },
        },
        [`.${prefix}-hover-intensify`]: {
          '&:hover': {
            '--glacier-blur': '20px',
            '--glacier-saturation': '200%',
          },
        },
      });

      // ===========================================
      // ACTIVE/PRESSED STATES
      // ===========================================

      addUtilities({
        [`.${prefix}-active-dim`]: {
          '&:active': {
            '--glacier-tint-opacity': '0.2',
            transform: 'scale(0.98)',
          },
        },
        [`.${prefix}-active-press`]: {
          '&:active': {
            transform: 'scale(0.95)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      });

      // ===========================================
      // PRESET COMBINATIONS
      // ===========================================

      addComponents({
        // Apple-style card
        [`.${prefix}-card`]: {
          '--glacier-blur': '16px',
          '--glacier-saturation': '180%',
          '--glacier-tint-opacity': '0.1',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, var(--glacier-tint-opacity))',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: `
            inset 0 1px 1px rgba(255, 255, 255, 0.1),
            0 4px 30px rgba(0, 0, 0, 0.1)
          `,
          padding: '1.5rem',
          overflow: 'hidden',
        },

        // visionOS-style panel
        [`.${prefix}-panel`]: {
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

        // iOS-style modal
        [`.${prefix}-modal`]: {
          '--glacier-blur': '40px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        },

        // macOS-style window
        [`.${prefix}-window`]: {
          '--glacier-blur': '30px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: `
            0 2px 4px rgba(0, 0, 0, 0.05),
            0 10px 40px rgba(0, 0, 0, 0.15)
          `,
          overflow: 'hidden',
        },

        // Notification style
        [`.${prefix}-notification`]: {
          '--glacier-blur': '20px',
          '--glacier-saturation': '180%',
          backdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          WebkitBackdropFilter: 'blur(var(--glacier-blur)) saturate(var(--glacier-saturation))',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '1rem',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
          padding: '1rem 1.25rem',
          overflow: 'hidden',
        },
      });
    };
  },
  // Theme extension
  (options = {}) => {
    const userTheme = options.theme || {};
    
    return {
      theme: {
        extend: {
          glassBlur: { ...defaultTheme.glassBlur, ...userTheme.glassBlur },
          glassOpacity: { ...defaultTheme.glassOpacity, ...userTheme.glassOpacity },
          glassTint: { ...defaultTheme.glassTint, ...userTheme.glassTint },
          glassSaturation: { ...defaultTheme.glassSaturation, ...userTheme.glassSaturation },
          glassRefraction: { ...defaultTheme.glassRefraction, ...userTheme.glassRefraction },
          glassBorder: { ...defaultTheme.glassBorder, ...userTheme.glassBorder },
          glassFresnel: { ...defaultTheme.glassFresnel, ...userTheme.glassFresnel },
          glassGlare: { ...defaultTheme.glassGlare, ...userTheme.glassGlare },
        },
      },
    };
  }
);

export default glacierPlugin;
export { glacierPlugin, FILTER_IDS, defaultTheme };
export type { PluginAPI };
