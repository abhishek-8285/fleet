import { useEffect, useState } from 'react'
import { apiGet } from '../api'
import { 
  Box, 
  Stack, 
  Typography, 
  Card, 
  Grid, 
  Chip, 
  Avatar, 
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  LinearProgress
} from '@mui/material'
import { 
  Route as TripIcon,
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Navigation as NavigationIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material'

type Trip = { 
  id: number; 
  customerName?: string; 
  pickupAddress?: string; 
  dropoffAddress?: string; 
  status?: string;
  driver?: string;
  vehicle?: string;
  startTime?: string;
  expectedArrival?: string;
  distance?: number;
  progress?: number;
  phone?: string;
  trackingId?: string;
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([])

  // Sample data to match design specifications  
  const sampleTrips = [
    { 
      id: 1, 
      customerName: 'XYZ Company',
      pickupAddress: 'Mumbai Warehouse', 
      dropoffAddress: 'Pune Office',
      status: 'In Transit',
      driver: 'Rajesh Kumar',
      vehicle: 'MH-12-AB-1234',
      startTime: '10:30 AM',
      expectedArrival: '2:30 PM',
      distance: 150,
      progress: 75,
      phone: '+91 98765-43210',
      trackingId: 'RTC240801001'
    },
    { 
      id: 2, 
      customerName: 'ABC Industries',
      pickupAddress: 'Delhi Hub', 
      dropoffAddress: 'Gurgaon Facility',
      status: 'Scheduled',
      driver: 'Suresh Patil',
      vehicle: 'GJ-01-EF-9012',
      startTime: '8:00 AM',
      expectedArrival: '10:00 AM',
      distance: 45,
      progress: 0,
      phone: '+91 87654-32109',
      trackingId: 'RTC240801002'
    },
    { 
      id: 3, 
      customerName: 'DEF Logistics',
      pickupAddress: 'Bangalore Central', 
      dropoffAddress: 'Mysore Plant',
      status: 'Delivered',
      driver: 'Amit Singh',
      vehicle: 'KA-03-GH-3456',
      startTime: '6:00 AM',
      expectedArrival: '9:30 AM',
      distance: 140,
      progress: 100,
      phone: '+91 76543-21098',
      trackingId: 'RTC240801003'
    }
  ]

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<Trip[]>('/trips')
        setTrips(data.length > 0 ? data : sampleTrips)
      } catch {
        setTrips(sampleTrips)
      }
    }
    load()
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'In Transit': return 'info'
      case 'Delivered': return 'success'
      case 'Scheduled': return 'warning'
      case 'Delayed': return 'error'
      default: return 'default'
    }
  }

  const activeTrips = trips.filter(t => t.status === 'In Transit').length
  const scheduledTrips = trips.filter(t => t.status === 'Scheduled').length
  const deliveredTrips = trips.filter(t => t.status === 'Delivered').length

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
          🚛 TRIP MANAGEMENT
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor active trips and delivery schedules
        </Typography>
      </Box>

      {/* Trip Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'info.dark', margin: '0 auto', mb: 1 }}>
              <DeliveryIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{activeTrips}</Typography>
            <Typography variant="body2">Active Trips</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'warning.dark', margin: '0 auto', mb: 1 }}>
              <ScheduleIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{scheduledTrips}</Typography>
            <Typography variant="body2">Scheduled</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'success.dark', margin: '0 auto', mb: 1 }}>
              <CheckIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{deliveredTrips}</Typography>
            <Typography variant="body2">Delivered Today</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'primary.dark', margin: '0 auto', mb: 1 }}>
              <TripIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{trips.length}</Typography>
            <Typography variant="body2">Total Trips</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Current Trip Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚛 Current Trip
            </Typography>
            {trips.filter(t => t.status === 'In Transit').slice(0, 1).map((trip) => (
              <Box key={trip.id}>
                <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {trip.pickupAddress} → {trip.dropoffAddress}
                  </Typography>
                  <Typography variant="body2">
                    ⏰ {trip.startTime} • ETA: {trip.expectedArrival}
                  </Typography>
                  <Typography variant="body2">
                    📍 {trip.distance} km • Driver: {trip.driver}
                  </Typography>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Progress: {trip.progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={trip.progress} 
                  sx={{ height: 8, borderRadius: 1, mb: 2 }}
                />

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" variant="contained" startIcon={<NavigationIcon />}>
                    View Route
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<PhoneIcon />}>
                    Call Driver
                  </Button>
                </Stack>
              </Box>
            ))}
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📊 Today's Summary
            </Typography>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                🛣️ {trips.reduce((sum, t) => sum + (t.distance || 0), 0)} km
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Distance • ⭐ 4.8 Rating
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" startIcon={<LocationIcon />}>
                Route
              </Button>
              <Button size="small" variant="outlined" startIcon={<PersonIcon />}>
                Drivers
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Add Trip Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          All Trips
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ bgcolor: 'primary.main' }}>
          Create Trip
        </Button>
      </Box>

      {/* All Trips Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Trip ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Route</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Driver/Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {trip.trackingId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {trip.customerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {trip.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        📍 {trip.pickupAddress}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🎯 {trip.dropoffAddress}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trip.distance} km
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{trip.driver}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {trip.vehicle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={trip.status}
                      color={getStatusColor(trip.status) as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: 80 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={trip.progress} 
                        sx={{ mb: 1, height: 6 }}
                      />
                      <Typography variant="caption">
                        {trip.progress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small" color="primary">
                        <PhoneIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}

