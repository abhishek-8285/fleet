import { 
  CssBaseline, 
  ThemeProvider, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Container,
  IconButton,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Card,
  Alert,
  Stack,
  Chip
} from '@mui/material'
import { 
  Dashboard as DashboardIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Route as TripIcon,
  LocalGasStation as FuelIcon,
  Map as MapIcon,
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Build as MaintenanceIcon,
  Assignment as ComplianceIcon,
  AttachMoney as FinanceIcon,
  Business as CustomerIcon,
  Notifications as NotificationIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  SupervisorAccount as UserManagementIcon
} from '@mui/icons-material'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import FuelEvents from './pages/FuelEvents'
import Login from './pages/Login'
import Track from './pages/Track'
import { RequireAuth, isAuthed } from './auth'
import MapView from './pages/MapView'
import MapViewLeaflet from './pages/MapViewLeaflet'
import Maintenance from './pages/Maintenance'
import Compliance from './pages/Compliance'
import Financial from './pages/Financial'
import Customers from './pages/Customers'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import UserManagement from './pages/UserManagement'
import theme from './theme'

const drawerWidth = 280

const navigationItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Vehicles', icon: <VehicleIcon />, path: '/vehicles' },
  { text: 'Drivers', icon: <DriverIcon />, path: '/drivers' },
  { text: 'Trips', icon: <TripIcon />, path: '/trips' },
  { text: 'Fuel Management', icon: <FuelIcon />, path: '/fuel' },
  { text: 'Live Map (Google)', icon: <MapIcon />, path: '/map' },
  { text: 'Live Map (OpenStreetMap)', icon: <MapIcon />, path: '/map-osm' },
  { text: 'Maintenance', icon: <MaintenanceIcon />, path: '/maintenance' },
  { text: 'Financial', icon: <FinanceIcon />, path: '/financial' },
  { text: 'Compliance', icon: <ComplianceIcon />, path: '/compliance' },
  { text: 'Customers', icon: <CustomerIcon />, path: '/customers' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Notifications', icon: <NotificationIcon />, path: '/notifications' },
  { text: 'User Management', icon: <UserManagementIcon />, path: '/users' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
]

function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget)
  }

  const handleProfileClose = () => {
    setProfileAnchor(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    handleProfileClose()
  }

  const drawer = (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
          🚛 FleetFlow India
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rajesh Transport Co.
        </Typography>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              textDecoration: 'none',
              // color: 'inherit',
              backgroundColor: location.pathname === item.path ? 'primary.main' : 'transparent',
              color: location.pathname === item.path ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: location.pathname === item.path ? 'primary.dark' : 'grey.100'
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5
            }}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'primary.main' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              href="/api/health"
              target="_blank"
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              API Status
            </Button>
            <IconButton onClick={handleProfileMenu} color="inherit">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                R
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={handleProfileClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
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
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              borderRight: 1,
              borderColor: 'divider'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/track/:id" element={<Track />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<AppLayout><DashboardHome /></AppLayout>} />
            <Route path="/vehicles" element={<AppLayout><Vehicles /></AppLayout>} />
            <Route path="/drivers" element={<AppLayout><Drivers /></AppLayout>} />
            <Route path="/trips" element={<AppLayout><Trips /></AppLayout>} />
            <Route path="/fuel" element={<AppLayout><FuelEvents /></AppLayout>} />
            <Route path="/map" element={<AppLayout><MapView /></AppLayout>} />
            <Route path="/map-osm" element={<AppLayout><MapViewLeaflet /></AppLayout>} />
            <Route path="/maintenance" element={<AppLayout><Maintenance /></AppLayout>} />
            <Route path="/financial" element={<AppLayout><Financial /></AppLayout>} />
            <Route path="/compliance" element={<AppLayout><Compliance /></AppLayout>} />
            <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
            <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
            <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
            <Route path="/users" element={<AppLayout><UserManagement /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

// Enhanced Dashboard with Real-time Features and AI Analytics
function DashboardHome() {
  const [fleetStats, setFleetStats] = useState({
    active: 24,
    maintenance: 3,
    parked: 8,
    issues: 2
  })
  const [todayStats, setTodayStats] = useState({
    revenue: 245000,
    fuelCost: 185000,
    profit: 60000
  })
  const [realTimeData, setRealTimeData] = useState({
    activeTrips: 12,
    avgSpeed: 45,
    fuelEfficiency: 4.2,
    onTimeDelivery: 94
  })
  const [weeklyTrends, setWeeklyTrends] = useState({
    revenueGrowth: 12.5,
    fuelSavings: 8.3,
    customerSatisfaction: 4.8
  })
  const [aiInsights, setAiInsights] = useState([
    { type: 'fuel', message: 'Route optimization could save ₹15,000/month', priority: 'high' },
    { type: 'maintenance', message: '3 vehicles due for service this week', priority: 'medium' },
    { type: 'performance', message: 'Driver Rajesh has 98% on-time delivery rate', priority: 'low' }
  ])

  return (
    <Box>
      {/* Header with Live Status */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🚛 FLEET COMMAND CENTER
          <Chip label="LIVE" color="success" size="small" sx={{ fontWeight: 600 }} />
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Good Morning, Rajesh! Here's your real-time fleet dashboard for {new Date().toLocaleDateString('en-IN')}
        </Typography>
      </Box>

      {/* Real-time KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>🚛</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{fleetStats.active}</Typography>
            <Typography variant="body2">Active Vehicles</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {realTimeData.activeTrips} trips in progress
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>⚡</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{realTimeData.avgSpeed}</Typography>
            <Typography variant="body2">Avg Speed (km/h)</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {realTimeData.onTimeDelivery}% on-time delivery
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>⛽</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{realTimeData.fuelEfficiency}</Typography>
            <Typography variant="body2">Fuel Efficiency (km/L)</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {weeklyTrends.fuelSavings}% improvement this week
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>📈</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{(todayStats.revenue / 1000).toFixed(0)}K</Typography>
            <Typography variant="body2">Today's Revenue</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              +{weeklyTrends.revenueGrowth}% vs last week
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Fleet Overview & AI Insights */}
        <Grid item xs={12} md={8}>
          {/* Fleet Status Grid */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📊 FLEET STATUS OVERVIEW
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>🟢</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{fleetStats.active}</Typography>
                  <Typography variant="body2">Active</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>🔧</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{fleetStats.maintenance}</Typography>
                  <Typography variant="body2">Maintenance</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>🏠</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{fleetStats.parked}</Typography>
                  <Typography variant="body2">Parked</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>🚨</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{fleetStats.issues}</Typography>
                  <Typography variant="body2">Issues</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* AI Insights & Recommendations */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🤖 AI INSIGHTS & RECOMMENDATIONS
            </Typography>
            <Stack spacing={2}>
              {aiInsights.map((insight, index) => (
                <Alert 
                  key={index}
                  severity={insight.priority === 'high' ? 'error' : insight.priority === 'medium' ? 'warning' : 'info'}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="body2">
                    {insight.type === 'fuel' ? '⛽' : insight.type === 'maintenance' ? '🔧' : '🏆'} {insight.message}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Card>

          {/* Critical Alerts */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚨 CRITICAL ALERTS & NOTIFICATIONS
            </Typography>
            <Stack spacing={2}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  🚨 MH-14-CD-5678 - FUEL THEFT SUSPECTED: Unusual consumption pattern detected (45% above normal)
                </Typography>
              </Alert>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  📍 GJ-01-EF-9012 - OFF-ROUTE: Deviation from planned route for 45 minutes near Ahmedabad
                </Typography>
              </Alert>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  🔧 KA-03-GH-3456 - MAINTENANCE DUE: Service due in 2 days (48,500 km completed)
                </Typography>
              </Alert>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  ✅ Route optimization saved ₹12,500 in fuel costs this week
                </Typography>
              </Alert>
            </Stack>
          </Card>
        </Grid>

        {/* Right Panel: Stats & Performance */}
        <Grid item xs={12} md={4}>
          {/* Today's Performance */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📊 TODAY'S PERFORMANCE
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>💰 Revenue</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(todayStats.revenue / 1000).toFixed(0)}K</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Target: ₹200K (+22.5% achieved)
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>⛽ Fuel Cost</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(todayStats.fuelCost / 1000).toFixed(0)}K</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Budget: ₹200K (-7.5% saved)
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>📈 Net Profit</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(todayStats.profit / 1000).toFixed(0)}K</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Margin: {((todayStats.profit / todayStats.revenue) * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Stack>
          </Card>

          {/* Critical Vehicle Status */}
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              ⚠️ CRITICAL VEHICLE STATUS
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'white', mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>MH-12-AB-1234</Typography>
              <Typography variant="body2">CRITICAL: Fuel 15% • Engine temp high</Typography>
              <Typography variant="caption">Driver: Rajesh Kumar • Last ping: 2 min ago</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" size="small" color="error">
                Emergency Contact
              </Button>
              <Button variant="outlined" size="small" sx={{ color: 'white', borderColor: 'white' }}>
                Track Live
              </Button>
            </Stack>
          </Card>

          {/* Weekly Trends */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📈 WEEKLY TRENDS
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Revenue Growth</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +{weeklyTrends.revenueGrowth}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Fuel Savings</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                  +{weeklyTrends.fuelSavings}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Customer Rating</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {weeklyTrends.customerSatisfaction}⭐
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}


