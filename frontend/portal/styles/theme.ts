import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
    interface Palette {
        gradients: {
            primary: string
            secondary: string
            emerald: string
        }
    }
    interface PaletteOptions {
        gradients?: {
            primary?: string
            secondary?: string
            emerald?: string
        }
    }
}

const theme = createTheme({
    palette: {
        mode: 'light', // Portal can remain light or dark, but "Premium Aura" implies Dark. Let's go Dark or Rich.
        // However, Customer Portal might differ. The plan said "Premium Aura" for *both*. 
        // Let's stick to the Dark Premium theme for consistency, or a very clean Light theme.
        // The Dashboard is Dark. Let's make Portal Dark too for that "Premium" feel.
        // But text readability for random customers (tracking) is key. 
        // Let's try a "Midnight Navy" background like dashboard.

        background: {
            default: '#0F172A',
            paper: '#1E293B'
        },
        primary: {
            main: '#10B981', // Emerald
            light: '#34D399',
            dark: '#059669',
            contrastText: '#fff'
        },
        secondary: {
            main: '#F59E0B', // Saffron
            light: '#FBBF24',
            dark: '#D97706',
            contrastText: '#000'
        },
        text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8'
        },
        gradients: {
            primary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            secondary: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            emerald: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    background: '#0F172A',
                    color: '#F8FAFC'
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Glass
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#10B981',
                        }
                    }
                }
            }
        }
    }
})

export default theme
