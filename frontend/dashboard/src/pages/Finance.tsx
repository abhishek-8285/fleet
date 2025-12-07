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
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge
} from '@mui/material'
import { 
  AttachMoney as MoneyIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as ExpenseIcon,
  AccountBalance as ProfitIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Person as DriverIcon,
  DirectionsCar as VehicleIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Error as OverdueIcon,
  Analytics as AnalyticsIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Assessment as ReportIcon
} from '@mui/icons-material'

type Invoice = {
  id: number
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  tax: number
  totalAmount: number
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentDate?: string
  tripIds: number[]
  notes?: string
}

type Expense = {
  id: number
  type: 'fuel' | 'maintenance' | 'insurance' | 'salary' | 'permit' | 'other'
  category: string
  description: string
  amount: number
  date: string
  vehicleId?: string
  driverId?: string
  vendorName: string
  invoiceNumber?: string
  status: 'pending' | 'approved' | 'paid'
  approvedBy?: string
  receipts?: string[]
}

type FinancialSummary = {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  outstandingInvoices: number
  pendingExpenses: number
  fuelCosts: number
  maintenanceCosts: number
  profitMargin: number
}

type PaymentRecord = {
  id: number
  invoiceId: number
  amount: number
  paymentDate: string
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card'
  referenceNumber?: string
  status: 'completed' | 'pending' | 'failed'
}

export default function Finance() {
  const [tabValue, setTabValue] = useState(0)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')

  // Sample data
  const sampleInvoices: Invoice[] = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      customerId: 'CUST001',
      customerName: 'ABC Logistics Pvt Ltd',
      amount: 25000,
      tax: 4500,
      totalAmount: 29500,
      issueDate: '2024-01-15',
      dueDate: '2024-02-14',
      status: 'paid',
      paymentDate: '2024-01-28',
      tripIds: [101, 102, 103]
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      customerId: 'CUST002',
      customerName: 'XYZ Trading Company',
      amount: 18000,
      tax: 3240,
      totalAmount: 21240,
      issueDate: '2024-01-18',
      dueDate: '2024-02-17',
      status: 'sent',
      tripIds: [104, 105]
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      customerId: 'CUST003',
      customerName: 'PQR Industries',
      amount: 32000,
      tax: 5760,
      totalAmount: 37760,
      issueDate: '2024-01-10',
      dueDate: '2024-01-25',
      status: 'overdue',
      tripIds: [106, 107, 108, 109]
    }
  ]

  const sampleExpenses: Expense[] = [
    {
      id: 1,
      type: 'fuel',
      category: 'Diesel',
      description: 'Fuel for MH-12-AB-1234',
      amount: 8500,
      date: '2024-01-20',
      vehicleId: 'MH-12-AB-1234',
      vendorName: 'Indian Oil Petrol Pump',
      invoiceNumber: 'IO-2024-001',
      status: 'paid'
    },
    {
      id: 2,
      type: 'maintenance',
      category: 'Brake Service',
      description: 'Brake pad replacement',
      amount: 12000,
      date: '2024-01-18',
      vehicleId: 'GJ-01-CD-5678',
      vendorName: 'Sharma Auto Service',
      invoiceNumber: 'SAS-001',
      status: 'approved',
      approvedBy: 'Manager'
    },
    {
      id: 3,
      type: 'salary',
      category: 'Driver Salary',
      description: 'Monthly salary for Rajesh Kumar',
      amount: 25000,
      date: '2024-01-01',
      driverId: 'DRV001',
      vendorName: 'Rajesh Kumar',
      status: 'paid'
    },
    {
      id: 4,
      type: 'insurance',
      category: 'Vehicle Insurance',
      description: 'Annual motor insurance premium',
      amount: 15000,
      date: '2024-01-05',
      vehicleId: 'MH-12-AB-1234',
      vendorName: 'HDFC ERGO',
      invoiceNumber: 'HDFC-2024-001',
      status: 'pending'
    }
  ]

  const sampleSummary: FinancialSummary = {
    totalRevenue: 245000,
    totalExpenses: 185000,
    netProfit: 60000,
    outstandingInvoices: 3,
    pendingExpenses: 2,
    fuelCosts: 85000,
    maintenanceCosts: 35000,
    profitMargin: 24.5
  }

  useEffect(() => {
    setInvoices(sampleInvoices)
    setExpenses(sampleExpenses)
    setSummary(sampleSummary)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'sent': return 'info'
      case 'overdue': return 'error'
      case 'draft': return 'default'
      case 'cancelled': return 'error'
      case 'approved': return 'warning'
      case 'pending': return 'info'
      case 'completed': return 'success'
      case 'failed': return 'error'
      default: return 'default'
    }
  }

  const FinancialOverview = () => {
    if (!summary) return null

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <RevenueIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₹{(summary.totalRevenue / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="body2">Total Revenue</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              This Month
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <ExpenseIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₹{(summary.totalExpenses / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="body2">Total Expenses</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              This Month
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <ProfitIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              ₹{(summary.netProfit / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="body2">Net Profit</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {summary.profitMargin.toFixed(1)}% Margin
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <InvoiceIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {summary.outstandingInvoices}
            </Typography>
            <Typography variant="body2">Outstanding</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Invoices Pending
            </Typography>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const InvoiceManagement = () => (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🧾 Invoice Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowInvoiceDialog(true)}
        >
          Create Invoice
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {invoice.invoiceNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{invoice.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.customerId}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                <TableCell>₹{invoice.tax.toLocaleString()}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{invoice.totalAmount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Typography 
                    variant="body2"
                    color={invoice.status === 'overdue' ? 'error.main' : 'text.primary'}
                  >
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={invoice.status.toUpperCase()} 
                    color={getStatusColor(invoice.status) as any}
                    size="small"
                    icon={
                      invoice.status === 'paid' ? <PaidIcon /> :
                      invoice.status === 'overdue' ? <OverdueIcon /> :
                      <PendingIcon />
                    }
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )

  const ExpenseManagement = () => (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          💸 Expense Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowExpenseDialog(true)}
        >
          Add Expense
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Vehicle/Driver</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ 
                      bgcolor: expense.type === 'fuel' ? 'warning.main' :
                               expense.type === 'maintenance' ? 'info.main' :
                               expense.type === 'salary' ? 'success.main' : 'primary.main',
                      width: 32, height: 32 
                    }}>
                      {expense.type === 'fuel' ? <FuelIcon fontSize="small" /> :
                       expense.type === 'maintenance' ? <MaintenanceIcon fontSize="small" /> :
                       expense.type === 'salary' ? <DriverIcon fontSize="small" /> :
                       <MoneyIcon fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {expense.category}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₹{expense.amount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.vendorName}</TableCell>
                <TableCell>
                  {expense.vehicleId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <VehicleIcon fontSize="small" color="primary" />
                      <Typography variant="caption">{expense.vehicleId}</Typography>
                    </Box>
                  )}
                  {expense.driverId && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DriverIcon fontSize="small" color="secondary" />
                      <Typography variant="caption">{expense.driverId}</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={expense.status.toUpperCase()} 
                    color={getStatusColor(expense.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )

  const FinancialAnalytics = () => {
    if (!summary) return null

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              📊 Revenue vs Expenses
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PieChartIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Interactive charts will be displayed here
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              📈 Monthly Trends
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BarChartIcon sx={{ fontSize: 80, color: 'secondary.main', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Monthly trend analysis coming soon
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              💰 Cost Breakdown
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <FuelIcon color="warning" />
                </ListItemIcon>
                <ListItemText 
                  primary="Fuel Costs" 
                  secondary={`₹${summary.fuelCosts.toLocaleString()}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MaintenanceIcon color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Maintenance" 
                  secondary={`₹${summary.maintenanceCosts.toLocaleString()}`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DriverIcon color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Salaries" 
                  secondary="₹65,000"
                />
              </ListItem>
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              🎯 Key Metrics
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Profit Margin</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {summary.profitMargin.toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Revenue per Vehicle</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹{(summary.totalRevenue / 35).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Average Trip Value</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ₹8,500
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              ⚠️ Financial Alerts
            </Typography>
            <Stack spacing={2}>
              <Alert severity="error" size="small">
                3 invoices overdue - ₹87,000
              </Alert>
              <Alert severity="warning" size="small">
                Fuel costs increased 15% this month
              </Alert>
              <Alert severity="info" size="small">
                2 expense approvals pending
              </Alert>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    )
  }

  const Reports = () => (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        📋 Financial Reports
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ReportIcon color="primary" />
              <Typography variant="h6">Profit & Loss Statement</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Comprehensive P&L report for the selected period
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Report
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AnalyticsIcon color="secondary" />
              <Typography variant="h6">Cash Flow Analysis</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Monthly cash flow and liquidity analysis
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Report
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <InvoiceIcon color="success" />
              <Typography variant="h6">Outstanding Receivables</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customer-wise pending invoice details
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Report
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ExpenseIcon color="warning" />
              <Typography variant="h6">Expense Summary</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Category-wise expense breakdown and trends
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Report
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Card>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          💰 Financial Management
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            label="Period"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="last_month">Last Month</MenuItem>
            <MenuItem value="this_quarter">This Quarter</MenuItem>
            <MenuItem value="this_year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <FinancialOverview />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
          <Tab label="🧾 Invoices" />
          <Tab label="💸 Expenses" />
          <Tab label="📊 Analytics" />
          <Tab label="📋 Reports" />
        </Tabs>
      </Box>

      {tabValue === 0 && <InvoiceManagement />}
      {tabValue === 1 && <ExpenseManagement />}
      {tabValue === 2 && <FinancialAnalytics />}
      {tabValue === 3 && <Reports />}

      {/* Invoice Creation Dialog */}
      <Dialog open={showInvoiceDialog} onClose={() => setShowInvoiceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>🧾 Create New Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField select label="Customer" fullWidth>
                <MenuItem value="CUST001">ABC Logistics Pvt Ltd</MenuItem>
                <MenuItem value="CUST002">XYZ Trading Company</MenuItem>
                <MenuItem value="CUST003">PQR Industries</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Invoice Number" fullWidth value="INV-2024-004" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Amount" type="number" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Tax %" type="number" fullWidth defaultValue="18" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Issue Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" multiline rows={3} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
          <Button variant="contained">Create Invoice</Button>
        </DialogActions>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={showExpenseDialog} onClose={() => setShowExpenseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>💸 Add New Expense</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField select label="Expense Type" fullWidth>
                <MenuItem value="fuel">Fuel</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="salary">Salary</MenuItem>
                <MenuItem value="permit">Permit/License</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Amount" type="number" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Vendor Name" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Vehicle ID (if applicable)" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Invoice Number" fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" multiline rows={3} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpenseDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Expense</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
