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
  LinearProgress,
  Divider
} from '@mui/material'
import { 
  LocalGasStation as FuelIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  CameraAlt as CameraIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Search as InvestigateIcon
} from '@mui/icons-material'

type FuelEvent = { 
  id: number; 
  liters: number; 
  amountINR: number; 
  odometerKm: number;
  vehiclePlate?: string;
  location?: string;
  timestamp?: string;
  efficiency?: number;
  status?: 'verified' | 'pending' | 'suspicious';
  receiptPhoto?: boolean;
}

export default function FuelEvents() {
  const [events, setEvents] = useState<FuelEvent[]>([])

  // Sample data to match design specifications
  const sampleEvents = [
    { 
      id: 1, 
      liters: 35.5, 
      amountINR: 2500, 
      odometerKm: 45000,
      vehiclePlate: 'MH-12-AB-1234',
      location: 'HP Pump, Nashik',
      timestamp: '2024-01-20 14:30',
      efficiency: 4.2,
      status: 'verified' as const,
      receiptPhoto: true
    },
    { 
      id: 2, 
      liters: 40.0, 
      amountINR: 3200, 
      odometerKm: 32000,
      vehiclePlate: 'GJ-01-EF-9012',
      location: 'BPCL, Ahmedabad',
      timestamp: '2024-01-20 16:45',
      efficiency: 5.1,
      status: 'pending' as const,
      receiptPhoto: true
    },
    { 
      id: 3, 
      liters: 45.0, 
      amountINR: 4100, 
      odometerKm: 67000,
      vehiclePlate: 'KA-03-GH-3456',
      location: 'Indian Oil, Bangalore',
      timestamp: '2024-01-20 11:15',
      efficiency: 3.8,
      status: 'verified' as const,
      receiptPhoto: true
    },
    { 
      id: 4, 
      liters: 50.0, 
      amountINR: 2600, 
      odometerKm: 28000,
      vehiclePlate: 'MH-14-CD-5678',
      location: 'Reliance Petrol, Mumbai',
      timestamp: '2024-01-20 09:30',
      efficiency: 4.8,
      status: 'suspicious' as const,
      receiptPhoto: false
    }
  ]

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<FuelEvent[]>('/fuel-events')
        // If no data from API, use sample data for demonstration
        setEvents(data.length > 0 ? data : sampleEvents)
      } catch {
        setEvents(sampleEvents)
      }
    }
    load()
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'success'
      case 'pending': return 'warning'
      case 'suspicious': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'verified': return <CheckIcon />
      case 'pending': return <WarningIcon />
      case 'suspicious': return <WarningIcon />
      default: return <FuelIcon />
    }
  }

  const totalFuelCost = events.reduce((sum, e) => sum + e.amountINR, 0)
  const averageEfficiency = events.reduce((sum, e) => sum + (e.efficiency || 0), 0) / events.length
  const pendingVerifications = events.filter(e => e.status === 'pending').length
  const suspiciousEvents = events.filter(e => e.status === 'suspicious').length

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⛽ FUEL MANAGEMENT
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor fuel consumption, expenses, and detect anomalies
        </Typography>
      </Box>

      {/* Fuel Analytics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'primary.dark', margin: '0 auto', mb: 1 }}>
              <FuelIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{totalFuelCost.toLocaleString()}</Typography>
            <Typography variant="body2">Total Fuel Cost</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'success.dark', margin: '0 auto', mb: 1 }}>
              <TrendingUpIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{averageEfficiency.toFixed(1)} km/L</Typography>
            <Typography variant="body2">Avg Efficiency</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'warning.dark', margin: '0 auto', mb: 1 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{pendingVerifications}</Typography>
            <Typography variant="body2">Pending Verification</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'error.dark', margin: '0 auto', mb: 1 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{suspiciousEvents}</Typography>
            <Typography variant="body2">Theft Alerts</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Fuel Analytics Chart Area */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📊 FUEL ANALYTICS
            </Typography>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Daily Consumption Trend
            </Typography>
            <Box sx={{ 
              height: 200, 
              bgcolor: 'grey.50', 
              borderRadius: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 3
            }}>
              <Typography variant="body1" color="text.secondary">
                📈 Chart Area - Expected vs Actual Fuel Consumption
              </Typography>
            </Box>

            {/* Fuel Expenses Table */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              💰 FUEL EXPENSES
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fuel Cost</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Efficiency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.slice(0, 4).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.vehiclePlate}</TableCell>
                    <TableCell>₹{event.amountINR.toLocaleString()}</TableCell>
                    <TableCell>{event.efficiency} km/L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Grid>

        {/* Theft Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚨 THEFT ALERTS
            </Typography>
            
            {suspiciousEvents > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom color="error.main">
                  ⚠️ Suspected
                </Typography>
                {events.filter(e => e.status === 'suspicious').map((event) => (
                  <Alert key={event.id} severity="error" sx={{ mb: 1, borderRadius: 2 }}>
                    <Typography variant="body2">
                      {event.vehiclePlate}
                    </Typography>
                    <Typography variant="caption">
                      Excess: {(event.liters - 30).toFixed(1)}L
                    </Typography>
                    <Typography variant="caption" display="block">
                      Route: {event.location}
                    </Typography>
                  </Alert>
                ))}
                <Button size="small" variant="outlined" color="error">
                  Investigate
                </Button>
              </Box>
            )}

            <Typography variant="subtitle2" gutterBottom color="success.main">
              ✅ Verified
            </Typography>
            {events.filter(e => e.status === 'verified').slice(0, 2).map((event) => (
              <Box key={event.id} sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {event.vehiclePlate}
                </Typography>
                <Typography variant="body2">
                  Amount: ₹{event.amountINR.toLocaleString()}
                </Typography>
                <Typography variant="caption">
                  Valid Receipt
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* Fuel Purchase Verification */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          🔍 FUEL PURCHASE VERIFICATION
        </Typography>
        <Typography variant="subtitle2" gutterBottom color="warning.main">
          Recent Fuel Entries Requiring Verification:
        </Typography>
        
        <Stack spacing={2}>
          {events.filter(e => e.status === 'pending').map((event) => (
            <Box key={event.id} sx={{ 
              p: 2, 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CameraIcon />
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {event.vehiclePlate} - ₹{event.amountINR.toLocaleString()} at {event.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.liters}L • {event.timestamp}
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />}>
                  Approve
                </Button>
                <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />}>
                  Reject
                </Button>
                <Button size="small" variant="outlined" startIcon={<InvestigateIcon />}>
                  Investigate
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Card>

      {/* All Fuel Events Table */}
      <Card>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            All Fuel Events
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Liters</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Efficiency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {event.vehiclePlate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.location}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ₹{event.amountINR.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.liters} L
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={event.efficiency && event.efficiency < 4 ? 'error' : 'textPrimary'}>
                      {event.efficiency} km/L
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status) as any}
                      size="small"
                      icon={getStatusIcon(event.status)}
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {event.timestamp}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                      {event.receiptPhoto && (
                        <IconButton size="small" color="secondary">
                          <CameraIcon />
                        </IconButton>
                      )}
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

