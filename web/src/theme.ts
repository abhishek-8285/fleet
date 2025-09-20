import { createTheme } from '@mui/material/styles'

// FleetFlow India Design System Theme
// Following the specifications from FLEETFLOW_UI_DESIGN_SPECIFICATIONS.md

declare module '@mui/material/styles' {
  interface Palette {
    india: {
      green: string
      saffron: string
      navyBlue: string
      alertRed: string
    }
    status: {
      online: string
      warning: string
      offline: string
      info: string
    }
  }

  interface PaletteOptions {
    india?: {
      green?: string
      saffron?: string
      navyBlue?: string
      alertRed?: string
    }
    status?: {
      online?: string
      warning?: string
      offline?: string
      info?: string
    }
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Indian Green
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF9800', // Saffron
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F', // Alert Red
      light: '#F44336',
      dark: '#B71C1C',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#1565C0', // Navy Blue
      light: '#2196F3',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    grey: {
      50: '#F5F5F5',
      100: '#EEEEEE',
      200: '#E0E0E0',
      300: '#BDBDBD',
      400: '#9E9E9E',
      500: '#757575',
      600: '#616161',
      700: '#424242',
      800: '#212121',
      900: '#000000',
    },
    // Custom India palette
    india: {
      green: '#2E7D32',
      saffron: '#FF9800',
      navyBlue: '#1565C0',
      alertRed: '#D32F2F',
    },
    // Status colors for fleet management
    status: {
      online: '#4CAF50',
      warning: '#FFC107',
      offline: '#F44336',
      info: '#2196F3',
    },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans Devanagari", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '32px',
      fontWeight: 700, // Bold
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 600, // Semibold
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '20px',
      fontWeight: 500, // Medium
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '18px',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '16px',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400, // Regular
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
  spacing: 8, // 8px grid system
  shape: {
    borderRadius: 8, // Consistent border radius
  },
  components: {
    // Button customizations
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Preserve case
          fontWeight: 500,
          borderRadius: 8,
          minHeight: 48, // Large touch targets
          padding: '12px 24px',
        },
        containedPrimary: {
          backgroundColor: '#2E7D32',
          '&:hover': {
            backgroundColor: '#1B5E20',
          },
        },
        containedSecondary: {
          backgroundColor: '#FF9800',
          '&:hover': {
            backgroundColor: '#F57C00',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    // Card customizations
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid #E0E0E0',
        },
      },
    },
    // Input field customizations
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            minHeight: 48, // Large touch targets for mobile
          },
        },
      },
    },
    // Paper customizations
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    // Chip customizations for status indicators
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    // Table customizations
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E0E0E0',
        },
        head: {
          backgroundColor: '#F5F5F5',
          fontWeight: 600,
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
})

// Responsive helper for mobile-first design
export const isMobile = (theme: typeof theme) => theme.breakpoints.down('md')
export const isTablet = (theme: typeof theme) => theme.breakpoints.between('md', 'lg')
export const isDesktop = (theme: typeof theme) => theme.breakpoints.up('lg')

export default theme
