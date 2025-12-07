import { Platform } from 'react-native'

// FleetFlow Mobile App Typography System
export const typography = {
  // Font Families
  fonts: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System'
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
      default: 'System'
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
      default: 'System'
    }),
    light: Platform.select({
      ios: 'System',
      android: 'Roboto-Light',
      default: 'System'
    }),
  },
  
  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
    '6xl': 36,
    '7xl': 42,
    '8xl': 48,
    '9xl': 56,
  },
  
  // Line Heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
  
  // Text Styles
  styles: {
    // Headings
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.4,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: -0.1,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    
    // Body Text
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    
    // Labels
    labelLarge: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    
    // Buttons
    buttonLarge: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    buttonMedium: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    buttonSmall: {
      fontSize: 12,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    
    // Caption
    caption: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 14,
      letterSpacing: 0.4,
    },
    
    // Overline
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
  }
}

export type Typography = typeof typography




