import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api'
import { 
  Box, 
  Button, 
  Stack, 
  TextField, 
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Rating
} from '@mui/material'
import { 
  Person as DriverIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Star as StarIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material'

type Driver = { 
  id: number; 
  name: string; 
  phone: string;
  rating?: number;
  trips?: number;
  fuelEfficiency?: number;
  status?: string;
  vehicle?: string;
  licenseExpiry?: string;
  medicalCertExpiry?: string;
}

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [openDialog, setOpenDialog] = useState(false)

  // Sample data to match design specifications
  const sampleDrivers = [
    { 
      id: 1, 
      name: 'Rajesh Kumar', 
      phone: '+91 98765-43210',
      rating: 4.9,
      trips: 28,
      fuelEfficiency: 4.5,
      status: 'Active Trip',
      vehicle: 'MH-12-AB-1234',
      licenseExpiry: '2025-06-15',
      medicalCertExpiry: '2024-12-20'
    },
    { 
      id: 2, 
      name: 'Suresh Patil', 
      phone: '+91 87654-32109',
      rating: 4.8,
      trips: 25,
      fuelEfficiency: 4.2,
      status: 'On Break',
      vehicle: 'GJ-01-EF-9012',
      licenseExpiry: '2024-09-10',
      medicalCertExpiry: '2024-11-15'
    },
    { 
      id: 3, 
      name: 'Amit Singh', 
      phone: '+91 76543-21098',
      rating: 4.7,
      trips: 22,
      fuelEfficiency: 4.1,
      status: 'Maintenance',
      vehicle: 'KA-03-GH-3456',
      licenseExpiry: '2025-03-25',
      medicalCertExpiry: '2025-01-30'
    },
    { 
      id: 4, 
      name: 'Ram Prakash', 
      phone: '+91 65432-10987',
      rating: 4.2,
      trips: 18,
      fuelEfficiency: 3.8,
      status: 'Available',
      vehicle: null,
      licenseExpiry: '2024-02-15', // Expiring soon
      medicalCertExpiry: '2024-02-08' // Expiring soon
    },
    { 
      id: 5, 
      name: 'Vikash Yadav', 
      phone: '+91 54321-09876',
      rating: 4.5,
      trips: 20,
      fuelEfficiency: 4.0,
      status: 'Available',
      vehicle: null,
      licenseExpiry: '2024-02-20', // Expiring soon
      medicalCertExpiry: '2024-12-10'
    }
  ]

  async function load() {
    try {
      const data = await apiGet<Driver[]>('/drivers')
      // If no data from API, use sample data for demonstration
      setDrivers(data.length > 0 ? data : sampleDrivers)
    } catch {
      setDrivers(sampleDrivers)
    }
  }

  useEffect(() => { load() }, [])

  async function add() {
    if (!name || !phone) return
    try {
      await apiPost<Driver>('/drivers', { name, phone })
      setName('')
      setPhone('')
      setOpenDialog(false)
      await load()
    } catch {
      // For demo purposes, add locally
      const newDriver = { 
        id: Date.now(), 
        name, 
        phone,
        rating: 5.0,
        trips: 0,
        fuelEfficiency: 0,
        status: 'Available',
        vehicle: null,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        medicalCertExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
      setDrivers(prev => [...prev, newDriver])
      setName('')
      setPhone('')
      setOpenDialog(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Active Trip': return 'success'
      case 'On Break': return 'warning'
      case 'Maintenance': return 'error'
      case 'Available': return 'info'
      default: return 'default'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Active Trip': return '🟢'
      case 'On Break': return '🟡'
      case 'Maintenance': return '🔴'
      case 'Available': return '🔵'
      default: return '⚪'
    }
  }

  const isDocumentExpiring = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }

  const activeDrivers = drivers.filter(d => d.status === 'Active Trip').length
  const availableDrivers = drivers.filter(d => d.status === 'Available').length
  const onBreakDrivers = drivers.filter(d => d.status === 'On Break').length

  // Top performers (rating >= 4.7)
  const topPerformers = drivers.filter(d => (d.rating || 0) >= 4.7).sort((a, b) => (b.rating || 0) - (a.rating || 0))

  // Drivers with expiring documents
  const expiringDocs = drivers.filter(d => 
    isDocumentExpiring(d.licenseExpiry) || isDocumentExpiring(d.medicalCertExpiry)
  )

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          👨‍✈️ DRIVER MANAGEMENT
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor driver performance and manage your team
        </Typography>
      </Box>

      {/* Driver Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'success.dark', margin: '0 auto', mb: 1 }}>
              <TruckIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{activeDrivers}</Typography>
            <Typography variant="body2">Active Trips</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'info.dark', margin: '0 auto', mb: 1 }}>
              <CheckIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{availableDrivers}</Typography>
            <Typography variant="body2">Available</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'warning.dark', margin: '0 auto', mb: 1 }}>
              <DriverIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{onBreakDrivers}</Typography>
            <Typography variant="body2">On Break</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'primary.dark', margin: '0 auto', mb: 1 }}>
              <StarIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{topPerformers.length}</Typography>
            <Typography variant="body2">Top Performers</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Performance and Driver List */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Driver Performance */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📊 DRIVER PERFORMANCE
            </Typography>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Top Performers This Month
            </Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              {topPerformers.slice(0, 3).map((driver) => (
                <Box key={driver.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {driver.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {driver.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {driver.trips} trips • {driver.fuelEfficiency} km/L
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon color="warning" fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {driver.rating}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
            
            <Typography variant="subtitle2" gutterBottom color="warning.main">
              Areas Needing Attention
            </Typography>
            <Stack spacing={1}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  ⚠️ Ram Prakash - Fuel Efficiency needs improvement
                </Typography>
              </Alert>
            </Stack>
          </Card>
        </Grid>

        {/* Driver List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📋 DRIVER LIST
            </Typography>
            <Stack spacing={2}>
              {drivers.slice(0, 5).map((driver) => (
                <Box key={driver.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">{getStatusIcon(driver.status)}</Typography>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {driver.name.charAt(0)}
                    </Avatar>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {driver.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {driver.status}
                    </Typography>
                    {driver.vehicle && (
                      <Typography variant="caption" color="primary">
                        {driver.vehicle}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" color="primary">
                    <PhoneIcon />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Add Driver Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Performance Metrics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add Driver
        </Button>
      </Box>

      {/* Performance Metrics Table */}
      <Card sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trips</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fuel Efficiency</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {driver.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {driver.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={driver.rating} readOnly size="small" precision={0.1} />
                      <Typography variant="body2">
                        {driver.rating}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {driver.trips}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {driver.fuelEfficiency} km/L
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={driver.status}
                      color={getStatusColor(driver.status) as any}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={driver.vehicle ? 'textPrimary' : 'textSecondary'}>
                      {driver.vehicle || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton size="small" color="primary">
                        <EditIcon />
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

      {/* Compliance Status */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          📋 COMPLIANCE STATUS
        </Typography>
        
        {expiringDocs.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom color="warning.main">
              ⚠️ Documents Expiring Soon:
            </Typography>
            <Stack spacing={1}>
              {expiringDocs.map((driver) => (
                <Alert key={driver.id} severity="warning" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2">
                    📄 {driver.name} - 
                    {isDocumentExpiring(driver.licenseExpiry) && ` License expires ${driver.licenseExpiry}`}
                    {isDocumentExpiring(driver.medicalCertExpiry) && ` Medical certificate expires ${driver.medicalCertExpiry}`}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        <Typography variant="subtitle2" gutterBottom color="success.main">
          ✅ All Documents Valid:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {drivers.filter(d => !isDocumentExpiring(d.licenseExpiry) && !isDocumentExpiring(d.medicalCertExpiry))
            .map(d => d.name).join(', ')}
        </Typography>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            👨‍✈️ Add New Driver
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Driver Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rajesh Kumar"
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +91 98765-43210"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={add}
            variant="contained"
            disabled={!name || !phone}
            sx={{ bgcolor: 'primary.main' }}
          >
            Add Driver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

