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
  Tab,
  Tabs,
  LinearProgress,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material'
import { 
  Build as MaintenanceIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  DirectionsCar as CarIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'

type MaintenanceRecord = {
  id: number
  vehicleId: string
  vehiclePlate: string
  serviceType: 'routine' | 'repair' | 'inspection' | 'emergency'
  description: string
  scheduledDate: string
  completedDate?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  cost?: number
  mechanic?: string
  parts?: string[]
  mileage?: number
  notes?: string
  nextServiceDue?: string
}

type ServiceSchedule = {
  id: number
  vehicleId: string
  vehiclePlate: string
  serviceType: string
  dueDate: string
  dueMileage: number
  currentMileage: number
  priority: 'high' | 'medium' | 'low'
  estimatedCost: number
}

type InventoryItem = {
  id: number
  partName: string
  partNumber: string
  quantity: number
  minStock: number
  cost: number
  supplier: string
  lastOrdered?: string
}

export default function Maintenance() {
  const [tabValue, setTabValue] = useState(0)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [serviceSchedule, setServiceSchedule] = useState<ServiceSchedule[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
  const [newService, setNewService] = useState({
    vehicleId: '',
    serviceType: 'routine',
    description: '',
    scheduledDate: '',
    estimatedCost: 0
  })

  // Sample data
  useEffect(() => {
    setMaintenanceRecords([
      {
        id: 1,
        vehicleId: '1',
        vehiclePlate: 'MH-12-AB-1234',
        serviceType: 'routine',
        description: 'Engine Oil Change + Filter Replacement',
        scheduledDate: '2024-01-15',
        completedDate: '2024-01-15',
        status: 'completed',
        cost: 2500,
        mechanic: 'Ramesh Kumar',
        parts: ['Engine Oil 5L', 'Oil Filter', 'Air Filter'],
        mileage: 45000,
        notes: 'All filters replaced, no issues found',
        nextServiceDue: '2024-04-15'
      },
      {
        id: 2,
        vehicleId: '2',
        vehiclePlate: 'MH-14-CD-5678',
        serviceType: 'repair',
        description: 'Brake Pad Replacement - Front Wheels',
        scheduledDate: '2024-01-20',
        status: 'in_progress',
        cost: 4500,
        mechanic: 'Suresh Patil',
        parts: ['Brake Pads (Front)', 'Brake Fluid'],
        mileage: 52000,
        notes: 'Brake pads worn out, replacing both front wheels'
      },
      {
        id: 3,
        vehicleId: '3',
        vehiclePlate: 'GJ-01-EF-9012',
        serviceType: 'inspection',
        description: 'Annual Fitness Certificate Renewal',
        scheduledDate: '2024-01-25',
        status: 'scheduled',
        estimatedCost: 1500,
        mileage: 48000
      },
      {
        id: 4,
        vehicleId: '4',
        vehiclePlate: 'KA-03-GH-3456',
        serviceType: 'emergency',
        description: 'Tire Puncture Repair - Rear Left',
        scheduledDate: '2024-01-18',
        completedDate: '2024-01-18',
        status: 'completed',
        cost: 800,
        mechanic: 'Prakash Singh',
        parts: ['Tire Tube', 'Tire Patch'],
        mileage: 41000,
        notes: 'Emergency roadside repair completed'
      }
    ])

    setServiceSchedule([
      {
        id: 1,
        vehicleId: '1',
        vehiclePlate: 'MH-12-AB-1234',
        serviceType: 'Engine Oil Change',
        dueDate: '2024-04-15',
        dueMileage: 50000,
        currentMileage: 45200,
        priority: 'medium',
        estimatedCost: 2500
      },
      {
        id: 2,
        vehicleId: '5',
        vehiclePlate: 'DL-05-IJ-7890',
        serviceType: 'Tire Rotation & Alignment',
        dueDate: '2024-02-10',
        dueMileage: 55000,
        currentMileage: 54500,
        priority: 'high',
        estimatedCost: 3500
      },
      {
        id: 3,
        vehicleId: '3',
        vehiclePlate: 'GJ-01-EF-9012',
        serviceType: 'Brake System Check',
        dueDate: '2024-03-01',
        dueMileage: 60000,
        currentMileage: 48000,
        priority: 'low',
        estimatedCost: 2000
      }
    ])

    setInventory([
      {
        id: 1,
        partName: 'Engine Oil (5L)',
        partNumber: 'EO-5L-15W40',
        quantity: 45,
        minStock: 20,
        cost: 450,
        supplier: 'Castrol India',
        lastOrdered: '2024-01-10'
      },
      {
        id: 2,
        partName: 'Brake Pads (Front)',
        partNumber: 'BP-FR-TATA',
        quantity: 8,
        minStock: 10,
        cost: 1200,
        supplier: 'Bosch India'
      },
      {
        id: 3,
        partName: 'Air Filter',
        partNumber: 'AF-STD-TATA',
        quantity: 25,
        minStock: 15,
        cost: 350,
        supplier: 'Mann Filter India',
        lastOrdered: '2024-01-08'
      },
      {
        id: 4,
        partName: 'Tire Tube',
        partNumber: 'TT-1000R20',
        quantity: 5,
        minStock: 8,
        cost: 180,
        supplier: 'MRF Tyres'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'warning'
      case 'scheduled': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const handleScheduleService = () => {
    const newRecord: MaintenanceRecord = {
      id: Date.now(),
      vehicleId: newService.vehicleId,
      vehiclePlate: `Vehicle-${newService.vehicleId}`,
      serviceType: newService.serviceType as any,
      description: newService.description,
      scheduledDate: newService.scheduledDate,
      status: 'scheduled',
      estimatedCost: newService.estimatedCost
    }
    setMaintenanceRecords(prev => [newRecord, ...prev])
    setDialogOpen(false)
    setNewService({
      vehicleId: '',
      serviceType: 'routine',
      description: '',
      scheduledDate: '',
      estimatedCost: 0
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🔧 MAINTENANCE & SERVICE CENTER
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete vehicle maintenance, service scheduling, and inventory management
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <ScheduleIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {maintenanceRecords.filter(r => r.status === 'scheduled').length}
            </Typography>
            <Typography variant="body2">Scheduled Services</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <SettingsIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {maintenanceRecords.filter(r => r.status === 'in_progress').length}
            </Typography>
            <Typography variant="body2">In Progress</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <CheckIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {maintenanceRecords.filter(r => r.status === 'completed').length}
            </Typography>
            <Typography variant="body2">Completed</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {inventory.filter(item => item.quantity <= item.minStock).length}
            </Typography>
            <Typography variant="body2">Low Stock Alerts</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Service Records" icon={<AssignmentIcon />} />
          <Tab label="Service Schedule" icon={<ScheduleIcon />} />
          <Tab label="Parts Inventory" icon={<InventoryIcon />} />
          <Tab label="Analytics" icon={<TimelineIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              🛠️ SERVICE RECORDS
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Schedule Service
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Service Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Mechanic</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CarIcon color="primary" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {record.vehiclePlate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.serviceType.toUpperCase()} 
                        size="small"
                        color={record.serviceType === 'emergency' ? 'error' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>{record.description}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(record.scheduledDate).toLocaleDateString('en-IN')}
                      </Typography>
                      {record.completedDate && (
                        <Typography variant="caption" color="text.secondary">
                          Completed: {new Date(record.completedDate).toLocaleDateString('en-IN')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{record.cost?.toLocaleString('en-IN') || 'TBD'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.mechanic ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" color="primary" />
                          <Typography variant="body2">{record.mechanic}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Not assigned</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabValue === 1 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📅 UPCOMING SERVICE SCHEDULE
          </Typography>

          <Grid container spacing={3}>
            {serviceSchedule.map((schedule) => (
              <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {schedule.vehiclePlate}
                    </Typography>
                    <Chip 
                      label={schedule.priority.toUpperCase()} 
                      color={getPriorityColor(schedule.priority)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {schedule.serviceType}
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Due Date:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {new Date(schedule.dueDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Mileage:</Typography>
                      <Typography variant="body2">
                        {schedule.currentMileage.toLocaleString()} / {schedule.dueMileage.toLocaleString()} km
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(schedule.currentMileage / schedule.dueMileage) * 100}
                      sx={{ mt: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Est. Cost:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ₹{schedule.estimatedCost.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Stack>

                  <Button variant="contained" fullWidth>
                    Schedule Now
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {tabValue === 2 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📦 PARTS INVENTORY
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Add Part
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Part Name</TableCell>
                  <TableCell>Part Number</TableCell>
                  <TableCell>Stock Level</TableCell>
                  <TableCell>Cost (₹)</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Last Ordered</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.partName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.partNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          color: item.quantity <= item.minStock ? 'error.main' : 'success.main'
                        }}>
                          {item.quantity} units
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Min: {item.minStock}
                        </Typography>
                        {item.quantity <= item.minStock && (
                          <Chip label="LOW STOCK" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{item.cost.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.supplier}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.lastOrdered ? new Date(item.lastOrdered).toLocaleDateString('en-IN') : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small">
                        Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tabValue === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📊 MAINTENANCE ANALYTICS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Monthly Maintenance Costs</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  ₹45,800
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  +12% vs last month
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Average Service Time</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  2.4 days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  -8% improvement
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                📈 <strong>Insights:</strong> Most common service is oil changes (45%), followed by brake maintenance (25%). 
                Consider bulk ordering brake pads to reduce costs.
              </Alert>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Schedule Service Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Schedule New Service</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle ID"
                value={newService.vehicleId}
                onChange={e => setNewService(prev => ({ ...prev, vehicleId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={newService.serviceType}
                  onChange={e => setNewService(prev => ({ ...prev, serviceType: e.target.value }))}
                  label="Service Type"
                >
                  <MenuItem value="routine">Routine Maintenance</MenuItem>
                  <MenuItem value="repair">Repair</MenuItem>
                  <MenuItem value="inspection">Inspection</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Service Description"
                multiline
                rows={3}
                value={newService.description}
                onChange={e => setNewService(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Scheduled Date"
                type="date"
                value={newService.scheduledDate}
                onChange={e => setNewService(prev => ({ ...prev, scheduledDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Cost (₹)"
                type="number"
                value={newService.estimatedCost}
                onChange={e => setNewService(prev => ({ ...prev, estimatedCost: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleScheduleService}
            disabled={!newService.vehicleId || !newService.description || !newService.scheduledDate}
          >
            Schedule Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}