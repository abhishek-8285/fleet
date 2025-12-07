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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Rating
} from '@mui/material'
import { 
  Business as BusinessIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  Timeline as TimelineIcon,
  Assignment as ContractIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CallMade as CallIcon,
  Message as MessageIcon
} from '@mui/icons-material'

type Customer = {
  id: number
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  gstNumber?: string
  panNumber?: string
  creditLimit: number
  creditTerms: number
  customerType: 'enterprise' | 'sme' | 'individual'
  status: 'active' | 'inactive' | 'blocked'
  rating: number
  totalTrips: number
  totalRevenue: number
  averageMonthlyBusiness: number
  lastTripDate?: string
  joinDate: string
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor'
  preferredRoutes: string[]
  notes?: string
}

type Contract = {
  id: number
  customerId: number
  contractNumber: string
  title: string
  startDate: string
  endDate: string
  value: number
  status: 'draft' | 'active' | 'expired' | 'terminated'
  terms: string
  paymentTerms: string
  renewalDate?: string
}

type CustomerActivity = {
  id: number
  customerId: number
  date: string
  type: 'trip' | 'payment' | 'inquiry' | 'complaint' | 'contract'
  description: string
  amount?: number
  status: string
}

export default function Customers() {
  const [tabValue, setTabValue] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [activities, setActivities] = useState<CustomerActivity[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [contractDialogOpen, setContractDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    creditLimit: 100000,
    creditTerms: 30,
    customerType: 'sme'
  })

  // Sample data
  useEffect(() => {
    setCustomers([
      {
        id: 1,
        companyName: 'ABC Industries Ltd.',
        contactPerson: 'Rajesh Sharma',
        email: 'rajesh@abcindustries.com',
        phone: '+91-98765-43210',
        address: 'Plot No. 15, Industrial Area, Phase-2',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gstNumber: '27AABCU9603R1ZX',
        panNumber: 'AABCU9603R',
        creditLimit: 500000,
        creditTerms: 45,
        customerType: 'enterprise',
        status: 'active',
        rating: 4.8,
        totalTrips: 156,
        totalRevenue: 2850000,
        averageMonthlyBusiness: 285000,
        lastTripDate: '2024-01-20',
        joinDate: '2023-03-15',
        paymentHistory: 'excellent',
        preferredRoutes: ['Mumbai-Pune', 'Mumbai-Delhi', 'Mumbai-Bangalore'],
        notes: 'Premium customer with excellent payment history. Prefers dedicated vehicles.'
      },
      {
        id: 2,
        companyName: 'XYZ Logistics Pvt. Ltd.',
        contactPerson: 'Priya Patel',
        email: 'priya@xyzlogistics.in',
        phone: '+91-87654-32109',
        address: 'Warehouse Complex, Sector 18',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411018',
        gstNumber: '27BBCDE1234F5GH',
        creditLimit: 300000,
        creditTerms: 30,
        customerType: 'sme',
        status: 'active',
        rating: 4.2,
        totalTrips: 89,
        totalRevenue: 1450000,
        averageMonthlyBusiness: 145000,
        lastTripDate: '2024-01-18',
        joinDate: '2023-06-20',
        paymentHistory: 'good',
        preferredRoutes: ['Pune-Mumbai', 'Pune-Nashik'],
        notes: 'Regular customer with seasonal fluctuations in business volume.'
      },
      {
        id: 3,
        companyName: 'PQR Manufacturing Co.',
        contactPerson: 'Amit Kumar',
        email: 'amit@pqrmfg.com',
        phone: '+91-76543-21098',
        address: 'Factory Road, MIDC Area',
        city: 'Aurangabad',
        state: 'Maharashtra',
        pincode: '431001',
        gstNumber: '27CDEFG5678H9IJ',
        creditLimit: 200000,
        creditTerms: 21,
        customerType: 'sme',
        status: 'active',
        rating: 3.8,
        totalTrips: 45,
        totalRevenue: 780000,
        averageMonthlyBusiness: 78000,
        lastTripDate: '2024-01-15',
        joinDate: '2023-09-10',
        paymentHistory: 'fair',
        preferredRoutes: ['Aurangabad-Mumbai', 'Aurangabad-Pune'],
        notes: 'Requires careful credit monitoring. Sometimes delays in payment.'
      },
      {
        id: 4,
        companyName: 'LMN Traders',
        contactPerson: 'Sunita Joshi',
        email: 'sunita@lmntraders.in',
        phone: '+91-65432-10987',
        address: 'Market Yard, Old City',
        city: 'Nashik',
        state: 'Maharashtra',
        pincode: '422001',
        creditLimit: 150000,
        creditTerms: 15,
        customerType: 'individual',
        status: 'active',
        rating: 4.5,
        totalTrips: 32,
        totalRevenue: 485000,
        averageMonthlyBusiness: 48500,
        lastTripDate: '2024-01-12',
        joinDate: '2023-11-05',
        paymentHistory: 'excellent',
        preferredRoutes: ['Nashik-Mumbai'],
        notes: 'Small but reliable customer. Always pays on time.'
      },
      {
        id: 5,
        companyName: 'DEF Enterprises',
        contactPerson: 'Vikash Singh',
        email: 'vikash@defenterprises.com',
        phone: '+91-54321-09876',
        address: 'Technology Park, Hinjewadi',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411057',
        creditLimit: 400000,
        creditTerms: 60,
        customerType: 'enterprise',
        status: 'inactive',
        rating: 3.2,
        totalTrips: 12,
        totalRevenue: 180000,
        averageMonthlyBusiness: 0,
        lastTripDate: '2023-12-10',
        joinDate: '2023-08-15',
        paymentHistory: 'poor',
        preferredRoutes: ['Pune-Bangalore'],
        notes: 'Account on hold due to payment delays. Requires management approval for new trips.'
      }
    ])

    setContracts([
      {
        id: 1,
        customerId: 1,
        contractNumber: 'CTR-2024-001',
        title: 'Annual Transportation Contract - ABC Industries',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        value: 3600000,
        status: 'active',
        terms: 'Dedicated vehicle allocation, 24/7 service, priority handling',
        paymentTerms: '45 days credit, monthly invoicing',
        renewalDate: '2024-11-01'
      },
      {
        id: 2,
        customerId: 2,
        contractNumber: 'CTR-2023-045',
        title: 'Quarterly Logistics Support - XYZ Logistics',
        startDate: '2023-10-01',
        endDate: '2024-03-31',
        value: 800000,
        status: 'active',
        terms: 'Shared vehicle basis, standard service levels',
        paymentTerms: '30 days credit, monthly invoicing'
      },
      {
        id: 3,
        customerId: 1,
        contractNumber: 'CTR-2023-012',
        title: 'Special Project Transportation',
        startDate: '2023-06-01',
        endDate: '2023-12-31',
        value: 1200000,
        status: 'expired',
        terms: 'Project-specific requirements, insurance coverage included',
        paymentTerms: '45 days credit'
      }
    ])

    setActivities([
      {
        id: 1,
        customerId: 1,
        date: '2024-01-20',
        type: 'trip',
        description: 'Completed trip Mumbai to Pune - 15 tons cargo',
        amount: 25000,
        status: 'completed'
      },
      {
        id: 2,
        customerId: 1,
        date: '2024-01-18',
        type: 'payment',
        description: 'Payment received for Invoice INV-2024-001',
        amount: 125000,
        status: 'received'
      },
      {
        id: 3,
        customerId: 2,
        date: '2024-01-17',
        type: 'inquiry',
        description: 'Inquiry for emergency transportation service',
        status: 'responded'
      },
      {
        id: 4,
        customerId: 3,
        date: '2024-01-15',
        type: 'trip',
        description: 'Trip Aurangabad to Mumbai - 8 tons cargo',
        amount: 18000,
        status: 'completed'
      },
      {
        id: 5,
        customerId: 4,
        date: '2024-01-12',
        type: 'contract',
        description: 'Contract renewal discussion initiated',
        status: 'in_progress'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'
      case 'blocked': return 'error'
      case 'expired': return 'error'
      case 'terminated': return 'error'
      case 'draft': return 'info'
      default: return 'default'
    }
  }

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'enterprise': return <BusinessIcon />
      case 'sme': return <BusinessIcon />
      case 'individual': return <PersonIcon />
      default: return <BusinessIcon />
    }
  }

  const getPaymentHistoryColor = (history: string) => {
    switch (history) {
      case 'excellent': return 'success'
      case 'good': return 'info'
      case 'fair': return 'warning'
      case 'poor': return 'error'
      default: return 'default'
    }
  }

  const addCustomer = () => {
    const customer: Customer = {
      id: Date.now(),
      companyName: newCustomer.companyName,
      contactPerson: newCustomer.contactPerson,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      city: newCustomer.city,
      state: newCustomer.state,
      pincode: newCustomer.pincode,
      gstNumber: newCustomer.gstNumber,
      panNumber: newCustomer.panNumber,
      creditLimit: newCustomer.creditLimit,
      creditTerms: newCustomer.creditTerms,
      customerType: newCustomer.customerType as any,
      status: 'active',
      rating: 0,
      totalTrips: 0,
      totalRevenue: 0,
      averageMonthlyBusiness: 0,
      joinDate: new Date().toISOString().split('T')[0],
      paymentHistory: 'good',
      preferredRoutes: []
    }
    setCustomers(prev => [customer, ...prev])
    setDialogOpen(false)
    setNewCustomer({
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      panNumber: '',
      creditLimit: 100000,
      creditTerms: 30,
      customerType: 'sme'
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🤝 CUSTOMER RELATIONSHIP MANAGEMENT
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete customer management, contracts, and relationship tracking
        </Typography>
      </Box>

      {/* Customer Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <BusinessIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {customers.filter(c => c.status === 'active').length}
            </Typography>
            <Typography variant="body2">Active Customers</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {customers.filter(c => c.customerType === 'enterprise').length} Enterprise
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₹{(customers.reduce((sum, c) => sum + c.averageMonthlyBusiness, 0) / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="body2">Monthly Revenue</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Average per customer
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <ContractIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {contracts.filter(c => c.status === 'active').length}
            </Typography>
            <Typography variant="body2">Active Contracts</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              ₹{(contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.value, 0) / 100000).toFixed(1)}L value
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <StarIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {(customers.reduce((sum, c) => sum + c.rating, 0) / customers.length).toFixed(1)}
            </Typography>
            <Typography variant="body2">Avg. Rating</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Customer satisfaction
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Customer Directory" icon={<BusinessIcon />} />
          <Tab label="Contracts & Agreements" icon={<ContractIcon />} />
          <Tab label="Customer Analytics" icon={<AnalyticsIcon />} />
          <Tab label="Activity Timeline" icon={<TimelineIcon />} />
        </Tabs>
      </Paper>

      {/* Customer Directory Tab */}
      {tabValue === 0 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              👥 CUSTOMER DIRECTORY
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Customer
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Payment History</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCustomerTypeIcon(customer.customerType)}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {customer.companyName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.city}, {customer.state}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{customer.contactPerson}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.phone}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.customerType.toUpperCase()} 
                        size="small"
                        color={customer.customerType === 'enterprise' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{customer.totalRevenue.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.totalTrips} trips
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={customer.rating} readOnly size="small" />
                        <Typography variant="caption">({customer.rating})</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.paymentHistory.toUpperCase()} 
                        color={getPaymentHistoryColor(customer.paymentHistory)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={customer.status.toUpperCase()} 
                        color={getStatusColor(customer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <CallIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <MessageIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Contracts Tab */}
      {tabValue === 1 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 CONTRACTS & AGREEMENTS
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setContractDialogOpen(true)}
            >
              New Contract
            </Button>
          </Box>

          <Grid container spacing={3}>
            {contracts.map((contract) => (
              <Grid item xs={12} md={6} lg={4} key={contract.id}>
                <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {contract.contractNumber}
                    </Typography>
                    <Chip 
                      label={contract.status.toUpperCase()} 
                      color={getStatusColor(contract.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body1" gutterBottom>
                    {contract.title}
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Customer:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {customers.find(c => c.id === contract.customerId)?.companyName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Duration:</Typography>
                      <Typography variant="body2">
                        {new Date(contract.startDate).toLocaleDateString('en-IN')} - {new Date(contract.endDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Value:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        ₹{contract.value.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    {contract.renewalDate && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Renewal Due:</Typography>
                        <Typography variant="body2" color="warning.main">
                          {new Date(contract.renewalDate).toLocaleDateString('en-IN')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Button variant="outlined" fullWidth>
                    View Details
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Customer Analytics Tab */}
      {tabValue === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📊 CUSTOMER ANALYTICS & INSIGHTS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Revenue by Customer Type</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Enterprise Customers</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ₹{(customers.filter(c => c.customerType === 'enterprise').reduce((sum, c) => sum + c.totalRevenue, 0) / 100000).toFixed(1)}L
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">SME Customers</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ₹{(customers.filter(c => c.customerType === 'sme').reduce((sum, c) => sum + c.totalRevenue, 0) / 100000).toFixed(1)}L
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={60} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Individual Customers</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                      ₹{(customers.filter(c => c.customerType === 'individual').reduce((sum, c) => sum + c.totalRevenue, 0) / 100000).toFixed(1)}L
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={25} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Top Performing Customers</Typography>
                <List>
                  {customers
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((customer) => (
                    <ListItem key={customer.id}>
                      <ListItemIcon>
                        {getCustomerTypeIcon(customer.customerType)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={customer.companyName}
                        secondary={`₹${customer.totalRevenue.toLocaleString('en-IN')} • ${customer.totalTrips} trips`}
                      />
                      <Rating value={customer.rating} readOnly size="small" />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                📈 <strong>Customer Insights:</strong> Enterprise customers generate 65% of total revenue. 
                Customer satisfaction is high at 4.1/5 average rating. Focus on retaining top 5 customers 
                who contribute 70% of monthly revenue.
              </Alert>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Activity Timeline Tab */}
      {tabValue === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📅 CUSTOMER ACTIVITY TIMELINE
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Activity Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((activity) => (
                  <TableRow key={activity.id} hover>
                    <TableCell>
                      {new Date(activity.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {customers.find(c => c.id === activity.customerId)?.companyName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={activity.type.toUpperCase()} 
                        size="small"
                        color={activity.type === 'payment' ? 'success' : 
                               activity.type === 'trip' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{activity.description}</Typography>
                    </TableCell>
                    <TableCell>
                      {activity.amount ? (
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ₹{activity.amount.toLocaleString('en-IN')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={activity.status.replace('_', ' ').toUpperCase()} 
                        size="small"
                        color={activity.status === 'completed' || activity.status === 'received' ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={newCustomer.companyName}
                onChange={e => setNewCustomer(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person"
                value={newCustomer.contactPerson}
                onChange={e => setNewCustomer(prev => ({ ...prev, contactPerson: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newCustomer.email}
                onChange={e => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={newCustomer.phone}
                onChange={e => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newCustomer.address}
                onChange={e => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={newCustomer.city}
                onChange={e => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={newCustomer.state}
                onChange={e => setNewCustomer(prev => ({ ...prev, state: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={newCustomer.pincode}
                onChange={e => setNewCustomer(prev => ({ ...prev, pincode: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Number"
                value={newCustomer.gstNumber}
                onChange={e => setNewCustomer(prev => ({ ...prev, gstNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="PAN Number"
                value={newCustomer.panNumber}
                onChange={e => setNewCustomer(prev => ({ ...prev, panNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={newCustomer.customerType}
                  onChange={e => setNewCustomer(prev => ({ ...prev, customerType: e.target.value }))}
                  label="Customer Type"
                >
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                  <MenuItem value="sme">SME</MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credit Limit (₹)"
                type="number"
                value={newCustomer.creditLimit}
                onChange={e => setNewCustomer(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Credit Terms (Days)"
                type="number"
                value={newCustomer.creditTerms}
                onChange={e => setNewCustomer(prev => ({ ...prev, creditTerms: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={addCustomer}
            disabled={!newCustomer.companyName || !newCustomer.contactPerson || !newCustomer.email}
          >
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}