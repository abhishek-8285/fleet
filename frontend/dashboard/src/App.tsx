import {
  CssBaseline,
  ThemeProvider,
  Box,
  Typography,
  Grid,
  Card,
  Stack,
  Chip,
  Alert,
  Button
} from '@mui/material'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import FuelEvents from './pages/FuelEvents'
import Login from './pages/Login'
import Track from './pages/Track'
import { RequireAuth } from './auth'
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
import Layout from './components/Layout'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/dashboard">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/track/:id" element={<Track />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Layout><Analytics /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/vehicles" element={<Layout><Vehicles /></Layout>} />
            <Route path="/drivers" element={<Layout><Drivers /></Layout>} />
            <Route path="/trips" element={<Layout><Trips /></Layout>} />
            <Route path="/fuel" element={<Layout><FuelEvents /></Layout>} />
            <Route path="/map" element={<Layout><MapView /></Layout>} />
            <Route path="/map-osm" element={<Layout><MapViewLeaflet /></Layout>} />
            <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
            <Route path="/financial" element={<Layout><Financial /></Layout>} />
            <Route path="/compliance" element={<Layout><Compliance /></Layout>} />
            <Route path="/customers" element={<Layout><Customers /></Layout>} />
            <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
            <Route path="/users" element={<Layout><UserManagement /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
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


