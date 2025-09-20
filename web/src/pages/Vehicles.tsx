import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete } from '../api'
import { useFleetWebSocket } from '../services/websocket'
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Stack, 
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
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Badge,
  Tooltip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import { 
  DirectionsCar as VehicleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
  Battery90 as BatteryIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  ExpandLess,
  ExpandMore,
  Circle as StatusIcon
} from '@mui/icons-material'

type Vehicle = { 
  id: number; 
  licensePlate: string; 
  make?: string; 
  model?: string; 
  status?: 'active' | 'parked' | 'maintenance' | 'alert';
  fuelLevel?: number;
  lastMaintenance?: string;
  mileage?: number;
  driver?: string;
  driverId?: number;
  location?: { lat: number; lng: number; address?: string };
  speed?: number;
  batteryLevel?: number;
  lastUpdate?: string;
  trips?: number;
  revenue?: number;
  fuelEfficiency?: number;
  nextMaintenanceKm?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
}

type VehicleFormData = {
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  engineType: string;
  fuelCapacity: string;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    licensePlate: '',
    make: '',
    model: '',
    year: '',
    engineType: '',
    fuelCapacity: ''
  })
  
  // Real-time and filtering state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Use WebSocket for real-time updates
  const { vehicles: liveVehicles, isConnected, websocketService } = useFleetWebSocket()

  const fetchVehicles = async () => {
    try {
      setRefreshing(true)
      setError('')
      const data = await apiGet<Vehicle[]>('/vehicles')
      setVehicles(data)
      setFilteredVehicles(data)
    } catch (err) {
      setError('Failed to fetch vehicles')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Merge real-time updates with vehicle data
  useEffect(() => {
    if (liveVehicles.length > 0 && vehicles.length > 0) {
      const updatedVehicles = vehicles.map(vehicle => {
        const liveUpdate = liveVehicles.find(live => live.vehicleId === vehicle.id.toString())
        if (liveUpdate) {
          return {
            ...vehicle,
            location: { lat: liveUpdate.latitude, lng: liveUpdate.longitude },
            speed: liveUpdate.speed,
            status: liveUpdate.status,
            fuelLevel: liveUpdate.fuelLevel || vehicle.fuelLevel,
            batteryLevel: liveUpdate.batteryLevel,
            lastUpdate: liveUpdate.lastUpdate,
            driver: liveUpdate.driver || vehicle.driver
          }
        }
        return vehicle
      })
      setVehicles(updatedVehicles)
    }
  }, [liveVehicles])

  // Filter vehicles based on search and status
  useEffect(() => {
    let filtered = vehicles

    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter)
    }

    setFilteredVehicles(filtered)
  }, [vehicles, searchTerm, statusFilter])

  useEffect(() => {
    fetchVehicles()
  }, [])

  const handleAdd = async () => {
    try {
      const newVehicle = await apiPost<Vehicle>('/vehicles', formData)
      setVehicles(prev => [...prev, newVehicle])
      setAddDialogOpen(false)
      setFormData({ licensePlate: '', make: '', model: '', year: '', engineType: '', fuelCapacity: '' })
    } catch (err) {
      setError('Failed to add vehicle')
    }
  }

  const handleEdit = async () => {
    if (!editingVehicle) return
    try {
      const updatedVehicle = await apiPost<Vehicle>(`/vehicles/${editingVehicle.id}`, formData)
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? updatedVehicle : v))
      setEditingVehicle(null)
      setFormData({ licensePlate: '', make: '', model: '', year: '', engineType: '', fuelCapacity: '' })
    } catch (err) {
      setError('Failed to update vehicle')
    }
  }

  const handleDelete = async (vehicle: Vehicle) => {
    try {
      await apiDelete(`/vehicles/${vehicle.id}`)
      setVehicles(prev => prev.filter(v => v.id !== vehicle.id))
      setDeleteConfirmOpen(null)
    } catch (err) {
      setError('Failed to delete vehicle')
    }
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: '',
      engineType: '',
      fuelCapacity: ''
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'parked': return 'info'  
      case 'maintenance': return 'warning'
      case 'alert': return 'error'
      default: return 'default'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'parked': return '🔵' 
      case 'maintenance': return '🟡'
      case 'alert': return '🔴'
      default: return '⚪'
    }
  }

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return 'No data'
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, vehicle: Vehicle) => {
    setAnchorEl(event.currentTarget)
    setSelectedVehicle(vehicle)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedVehicle(null)
  }

  const vehicleStats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    parked: vehicles.filter(v => v.status === 'parked').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    alerts: vehicles.filter(v => v.status === 'alert').length
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading vehicles...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header with Real-time Status */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VehicleIcon /> VEHICLE FLEET MANAGEMENT
            <Badge color={isConnected ? 'success' : 'error'} variant="dot">
              <Chip 
                label={isConnected ? 'LIVE' : 'OFFLINE'}
                color={isConnected ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Badge>
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Real-time fleet monitoring and management • {vehicleStats.total} total vehicles
        </Typography>
      </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchVehicles()}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Vehicle
          </Button>
        </Stack>
      </Stack>

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Fleet Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vehicleStats.total}</Typography>
            <Typography variant="body2">Total Vehicles</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vehicleStats.active}</Typography>
            <Typography variant="body2">Active</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vehicleStats.parked}</Typography>
            <Typography variant="body2">Parked</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vehicleStats.maintenance}</Typography>
            <Typography variant="body2">Maintenance</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <Card sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vehicleStats.alerts}</Typography>
            <Typography variant="body2">Alerts</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search vehicles, license plates, drivers..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="parked">Parked</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="alert">Alerts</MenuItem>
            </Select>
          </FormControl>
        <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {showFilters ? <ExpandLess /> : <ExpandMore />}
        </Button>
        </Stack>

        <Collapse in={showFilters}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Additional filters coming soon: Driver assignment, fuel level, maintenance due, location-based filtering
            </Typography>
      </Box>
        </Collapse>
      </Card>

      {/* Vehicle Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Vehicle</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Driver</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Fuel Level</strong></TableCell>
                <TableCell><strong>Last Update</strong></TableCell>
                <TableCell><strong>Performance</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <VehicleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {vehicle.licensePlate}
                    </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.make} {vehicle.model}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <StatusIcon 
                        sx={{ 
                          color: vehicle.status === 'active' ? 'success.main' : 
                                 vehicle.status === 'parked' ? 'info.main' :
                                 vehicle.status === 'maintenance' ? 'warning.main' :
                                 vehicle.status === 'alert' ? 'error.main' : 'grey.400',
                          fontSize: 12
                        }}
                      />
                      <Chip 
                        label={vehicle.status?.toUpperCase() || 'UNKNOWN'}
                        color={getStatusColor(vehicle.status) as any}
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 80 }}
                      />
                    </Stack>
                    {vehicle.speed !== undefined && vehicle.speed > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        <SpeedIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {Math.round(vehicle.speed)} km/h
                    </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.driver ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                          {vehicle.driver.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{vehicle.driver}</Typography>
                      </Stack>
                    ) : (
                      <Chip label="Unassigned" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.location ? (
                      <Tooltip title={`Lat: ${vehicle.location.lat.toFixed(4)}, Lng: ${vehicle.location.lng.toFixed(4)}`}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          <Typography variant="body2" color="success.main">
                            Live GPS
                          </Typography>
                        </Stack>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No GPS data
                      </Typography>
                    )}
                    {vehicle.batteryLevel && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <BatteryIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        {vehicle.batteryLevel}%
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {vehicle.fuelLevel !== undefined ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={vehicle.fuelLevel}
                          sx={{ 
                            width: 60, 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: vehicle.fuelLevel < 20 ? 'error.main' : 
                                       vehicle.fuelLevel < 40 ? 'warning.main' : 'success.main'
                            }
                          }}
                        />
                        <Typography 
                          variant="body2" 
                          color={vehicle.fuelLevel < 20 ? 'error.main' : 'text.primary'}
                          sx={{ fontWeight: 600, minWidth: 35 }}
                        >
                          {Math.round(vehicle.fuelLevel)}%
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data
                    </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={
                      vehicle.lastUpdate && (Date.now() - new Date(vehicle.lastUpdate).getTime()) < 300000 ? 'success.main' : 'text.secondary'
                    }>
                      {formatLastUpdate(vehicle.lastUpdate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      {vehicle.trips !== undefined && (
                        <Typography variant="caption">
                          {vehicle.trips} trips
                        </Typography>
                      )}
                      {vehicle.fuelEfficiency !== undefined && (
                        <Typography variant="caption" color="success.main">
                          {vehicle.fuelEfficiency} km/L
                        </Typography>
                      )}
                      {vehicle.revenue !== undefined && (
                        <Typography variant="caption" color="primary.main">
                          ₹{(vehicle.revenue / 1000).toFixed(0)}K
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuClick(e, vehicle)}>
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {filteredVehicles.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <VehicleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {vehicles.length === 0 ? 'No vehicles found' : 'No vehicles match your search criteria'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {vehicles.length === 0 ? 'Add your first vehicle to get started' : 'Try adjusting your search or filters'}
          </Typography>
        </Box>
      )}

      {/* Vehicle Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          console.log('View details for vehicle:', selectedVehicle?.licensePlate)
          handleMenuClose()
        }}>
          <ListItemIcon><ViewIcon /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedVehicle) openEditDialog(selectedVehicle)
          handleMenuClose()
        }}>
          <ListItemIcon><EditIcon /></ListItemIcon>
          <ListItemText>Edit Vehicle</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Assign trip to vehicle:', selectedVehicle?.licensePlate)
          handleMenuClose()
        }}>
          <ListItemIcon><AssignIcon /></ListItemIcon>
          <ListItemText>Assign Trip</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedVehicle?.driver) {
            console.log('Call driver:', selectedVehicle.driver)
          }
          handleMenuClose()
        }} disabled={!selectedVehicle?.driver}>
          <ListItemIcon><PhoneIcon /></ListItemIcon>
          <ListItemText>Call Driver</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('Schedule maintenance for:', selectedVehicle?.licensePlate)
          handleMenuClose()
        }}>
          <ListItemIcon><ScheduleIcon /></ListItemIcon>
          <ListItemText>Schedule Maintenance</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedVehicle) setDeleteConfirmOpen(selectedVehicle)
            handleMenuClose()
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
          <ListItemText>Delete Vehicle</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Vehicle Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Vehicle</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="License Plate"
              value={formData.licensePlate}
              onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
              fullWidth
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Make"
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Year"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                type="number"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Engine Type</InputLabel>
                <Select
                  value={formData.engineType}
                  onChange={(e) => setFormData(prev => ({ ...prev, engineType: e.target.value }))}
                  label="Engine Type"
                >
                  <MenuItem value="diesel">Diesel</MenuItem>
                  <MenuItem value="petrol">Petrol</MenuItem>
                  <MenuItem value="cng">CNG</MenuItem>
                  <MenuItem value="electric">Electric</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <TextField
              label="Fuel Capacity (Liters)"
              value={formData.fuelCapacity}
              onChange={(e) => setFormData(prev => ({ ...prev, fuelCapacity: e.target.value }))}
              type="number"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">Add Vehicle</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={Boolean(editingVehicle)} onClose={() => setEditingVehicle(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Vehicle: {editingVehicle?.licensePlate}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="License Plate"
              value={formData.licensePlate}
              onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
              fullWidth
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Make"
                value={formData.make}
                onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingVehicle(null)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">Update Vehicle</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteConfirmOpen)} onClose={() => setDeleteConfirmOpen(null)}>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete vehicle <strong>{deleteConfirmOpen?.licensePlate}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmOpen && handleDelete(deleteConfirmOpen)} 
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}