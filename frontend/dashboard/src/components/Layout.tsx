import { useState } from 'react'
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    useTheme,
    Avatar,
    Menu,
    MenuItem,
    Container,
    InputBase,
    Badge,
} from '@mui/material'
import {
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    Logout,
    Dashboard as DashboardIcon,
    DirectionsCar as VehicleIcon,
    Person as DriverIcon,
    Route as TripIcon,
    LocalGasStation as FuelIcon,
    Map as MapIcon,
    Build as MaintenanceIcon,
    AttachMoney as FinanceIcon,
    Assignment as ComplianceIcon,
    Business as CustomerIcon,
    Analytics as AnalyticsIcon,
    Settings as SettingsIcon,
    SupervisorAccount as UserManagementIcon,
} from '@mui/icons-material'
import { Link, useLocation } from 'react-router-dom'
import { isMobile } from '../theme' // Ensure this export exists in theme.ts or adjust import
import { useMediaQuery } from '@mui/material'

const drawerWidth = 280

const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Live Map', icon: <MapIcon />, path: '/map' },
    { text: 'Trips', icon: <TripIcon />, path: '/trips' },
    { text: 'Vehicles', icon: <VehicleIcon />, path: '/vehicles' },
    { text: 'Drivers', icon: <DriverIcon />, path: '/drivers' },
    { text: 'Fuel Management', icon: <FuelIcon />, path: '/fuel' },
    { text: 'Maintenance', icon: <MaintenanceIcon />, path: '/maintenance' },
    { text: 'Financial', icon: <FinanceIcon />, path: '/financial' },
    { text: 'Compliance', icon: <ComplianceIcon />, path: '/compliance' },
    { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
    { text: 'User Management', icon: <UserManagementIcon />, path: '/users' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const theme = useTheme()
    const isMobileView = useMediaQuery(theme.breakpoints.down('md'))
    const location = useLocation()

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen)
    }

    const toggleDrawer = () => {
        setOpen(!open)
    }

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        handleClose();
    }

    const drawerContent = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'transparent',
            color: 'text.primary'
        }}>
            <Toolbar sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: [1],
                minHeight: '80px !important'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
                    <Box
                        component="img"
                        src="/vite.svg" // Replace with actual logo if available
                        alt="Logo"
                        sx={{ height: 32, width: 32 }}
                    />
                    <Typography variant="h5" sx={{
                        fontWeight: 700,
                        background: theme.palette.gradients.primary,
                        backgroundClip: 'text',
                        textFillColor: 'transparent',
                        // Fallback for browsers not supporting textFillColor
                        color: 'primary.main'
                    }}>
                        FleetFlow
                    </Typography>
                </Box>
                {!isMobileView && (
                    <IconButton onClick={toggleDrawer} sx={{ color: 'text.secondary' }}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Toolbar>

            <Box sx={{ px: 2, mb: 2 }}>
                <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Avatar sx={{
                        bgcolor: 'primary.main',
                        background: theme.palette.gradients.primary,
                        width: 40,
                        height: 40
                    }}>R</Avatar>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Rajesh Kumar</Typography>
                        <Typography variant="caption" color="text.secondary">Fleet Manager</Typography>
                    </Box>
                </Box>
            </Box>

            <List component="nav" sx={{ px: 2, flexGrow: 1, overflowY: 'auto' }}>
                {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                onClick={() => isMobileView && setMobileOpen(false)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: 3,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    bgcolor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                    color: isActive ? 'primary.main' : 'text.secondary',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        color: 'text.primary',
                                    },
                                    '&::before': isActive ? {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        height: '24px',
                                        width: '4px',
                                        borderRadius: '0 4px 4px 0',
                                        background: theme.palette.gradients.primary,
                                    } : {}
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: isActive ? 'primary.main' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        '& .MuiTypography-root': {
                                            fontWeight: isActive ? 600 : 500,
                                            fontSize: '0.95rem'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    )
                })}
            </List>
        </Box>
    )

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: 'transparent',
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    pointerEvents: 'none', // Let clicks pass through to sidebar
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(open && {
                        marginLeft: drawerWidth,
                        width: `calc(100% - ${drawerWidth}px)`,
                        transition: theme.transitions.create(['width', 'margin'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                    }),
                }}
            >
                <Toolbar sx={{ pointerEvents: 'auto', pr: '24px' }}> {/* Keep toolbar clickable */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { md: 'none' }, bgcolor: 'background.paper', boxShadow: 1 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Global Search Bar - Floating Glass */}
                    <Box sx={{
                        flexGrow: 1,
                        maxWidth: 600,
                        mx: 'auto',
                        display: { xs: 'none', md: 'flex' }
                    }}>
                        <Box sx={{
                            position: 'relative',
                            borderRadius: 4,
                            bgcolor: 'glass.input',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 0.5,
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                            },
                            '&:focus-within': {
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid primary.main',
                                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                            }
                        }}>
                            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            <InputBase
                                placeholder="Search vehicles, trips, drivers..."
                                sx={{ color: 'inherit', width: '100%' }}
                            />
                            <Box sx={{
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 1,
                                px: 0.8,
                                py: 0.2,
                                fontSize: '0.75rem',
                                color: 'text.secondary'
                            }}>
                                ⌘K
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                        <IconButton color="inherit">
                            <Badge badgeContent={4} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar sx={{
                                width: 32,
                                height: 32,
                                background: theme.palette.gradients.primary
                            }}>R</Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            PaperProps={{
                                sx: {
                                    mt: 1.5,
                                    bgcolor: 'background.paper',
                                    backgroundImage: 'none',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }
                            }}
                        >
                            <MenuItem onClick={handleClose}>
                                <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
                                Profile
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        bgcolor: 'background.default',
                        backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(16, 185, 129, 0.05) 0%, transparent 40%)'
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        position: 'fixed',
                        whiteSpace: 'nowrap',
                        width: drawerWidth,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        boxSizing: 'border-box',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        bgcolor: 'glass.sidebar',
                        backdropFilter: 'blur(12px)',
                        ...(!open && {
                            overflowX: 'hidden',
                            transition: theme.transitions.create('width', {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.leavingScreen,
                            }),
                            width: theme.spacing(9), // Collapsed width
                        }),
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    height: '100vh',
                    overflow: 'auto',
                    pt: 10, // Toolbar spacer
                    px: { xs: 2, md: 4 },
                    pb: 4
                }}
            >
                <Container maxWidth="xl" disableGutters>
                    {children}
                </Container>
            </Box>
        </Box>
    )
}
