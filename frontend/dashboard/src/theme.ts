import { createTheme, alpha } from '@mui/material/styles'

// FleetFlow "Premium Aura" Design System
// Core Aesthetic: Modern, Dynamic, Glassmorphism, "Alive"

declare module '@mui/material/styles' {
  interface Palette {
    gradients: {
      primary: string
      secondary: string
      emerald: string
      nebula: string
    }
    glass: {
      card: string
      sidebar: string
      input: string
    }
  }

  interface PaletteOptions {
    gradients?: {
      primary?: string
      secondary?: string
      emerald?: string
      nebula?: string
    }
    glass?: {
      card?: string
      sidebar?: string
      input?: string
    }
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10B981', // Emerald 500
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F59E0B', // Amber 500 (Electric Saffron)
      light: '#FBBF24',
      dark: '#D97706',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#0F172A', // Slate 900 (Midnight Navy)
      paper: '#1E293B',   // Slate 800
    },
    text: {
      primary: '#F8FAFC', // Slate 50
      secondary: '#94A3B8', // Slate 400
    },
    gradients: {
      primary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Deep Emerald
      secondary: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Electric Saffron
      emerald: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      nebula: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    },
    glass: {
      card: 'rgba(30, 41, 59, 0.7)',
      sidebar: 'rgba(15, 23, 42, 0.8)',
      input: 'rgba(255, 255, 255, 0.05)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Noto Sans Devanagari", sans-serif',
    h1: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Outfit", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#CBD5E1', // Slate 300
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 16, // More rounded modern feel
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at 50% -20%, #1E293B 0%, #0F172A 100%)',
          backgroundAttachment: 'fixed',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(255,255,255,0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
          borderRadius: 20,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI dark mode overlay
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(4px)',
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#10B981',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        filled: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px 24px',
        },
        head: {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          color: '#94A3B8',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
})

export const isMobile = (theme: typeof theme) => theme.breakpoints.down('md')
export const isTablet = (theme: typeof theme) => theme.breakpoints.between('md', 'lg')
export const isDesktop = (theme: typeof theme) => theme.breakpoints.up('lg')

export default theme
