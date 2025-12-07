import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0A1929', // Deep Navy (Samsara Header)
    secondary: '#2E7D32', // Success Green (Status)
    tertiary: '#D32F2F', // Alert Red
    background: '#F5F5F5', // Light Grey Background
    surface: '#FFFFFF', // White Cards
    onSurface: '#121212', // Black Text
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
  roundness: 8,
};
