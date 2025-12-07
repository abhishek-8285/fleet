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
  ListItemIcon
} from '@mui/material'
import { 
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Assignment as InvoiceIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Person as PersonIcon
} from '@mui/icons-material'

type Invoice = {
  id: number
  invoiceNumber: string
  customerName: string
  customerEmail: string
  tripId?: number
  issueDate: string
  dueDate: string
  amount: number
  tax: number
  totalAmount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  paymentMethod?: string
  paidDate?: string
  items: InvoiceItem[]
}

type InvoiceItem = {
  description: string
  quantity: number
  rate: number
  amount: number
}

type Expense = {
  id: number
  date: string
  category: 'fuel' | 'maintenance' | 'insurance' | 'salary' | 'misc'
  description: string
  amount: number
  vehicleId?: string
  receipt?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
}

type FinancialSummary = {
  revenue: {
    today: number
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
  expenses: {
    today: number
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
  profit: {
    today: number
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
  outstanding: number
  cashFlow: number
}

export default function Financial() {
  const [tabValue, setTabValue] = useState(0)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerEmail: '',
    amount: 0,
    tax: 18,
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
  })
  const [newExpense, setNewExpense] = useState({
    category: 'fuel',
    description: '',
    amount: 0,
    vehicleId: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Sample data
  useEffect(() => {
    // Financial Summary
    setSummary({
      revenue: {
        today: 45000,
        thisMonth: 1250000,
        lastMonth: 1180000,
        thisYear: 14500000
      },
      expenses: {
        today: 28000,
        thisMonth: 780000,
        lastMonth: 720000,
        thisYear: 9200000
      },
      profit: {
        today: 17000,
        thisMonth: 470000,
        lastMonth: 460000,
        thisYear: 5300000
      },
      outstanding: 185000,
      cashFlow: 285000
    })

    // Sample Invoices
    setInvoices([
      {
        id: 1,
        invoiceNumber: 'INV-2024-001',
        customerName: 'ABC Industries Ltd.',
        customerEmail: 'accounts@abcindustries.com',
        tripId: 1001,
        issueDate: '2024-01-15',
        dueDate: '2024-02-14',
        amount: 25000,
        tax: 4500,
        totalAmount: 29500,
        status: 'paid',
        paymentMethod: 'Bank Transfer',
        paidDate: '2024-01-20',
        items: [
          { description: 'Transportation: Mumbai to Pune', quantity: 1, rate: 25000, amount: 25000 }
        ]
      },
      {
        id: 2,
        invoiceNumber: 'INV-2024-002',
        customerName: 'XYZ Logistics Pvt. Ltd.',
        customerEmail: 'billing@xyzlogistics.in',
        tripId: 1002,
        issueDate: '2024-01-18',
        dueDate: '2024-02-17',
        amount: 18000,
        tax: 3240,
        totalAmount: 21240,
        status: 'sent',
        items: [
          { description: 'Transportation: Delhi to Jaipur', quantity: 1, rate: 18000, amount: 18000 }
        ]
      },
      {
        id: 3,
        invoiceNumber: 'INV-2024-003',
        customerName: 'PQR Manufacturing Co.',
        customerEmail: 'finance@pqrmfg.com',
        tripId: 1003,
        issueDate: '2024-01-10',
        dueDate: '2024-01-25',
        amount: 15000,
        tax: 2700,
        totalAmount: 17700,
        status: 'overdue',
        items: [
          { description: 'Transportation: Bangalore to Chennai', quantity: 1, rate: 15000, amount: 15000 }
        ]
      },
      {
        id: 4,
        invoiceNumber: 'INV-2024-004',
        customerName: 'LMN Traders',
        customerEmail: 'admin@lmntraders.in',
        issueDate: '2024-01-20',
        dueDate: '2024-02-19',
        amount: 22000,
        tax: 3960,
        totalAmount: 25960,
        status: 'draft',
        items: [
          { description: 'Transportation: Ahmedabad to Mumbai', quantity: 1, rate: 22000, amount: 22000 }
        ]
      }
    ])

    // Sample Expenses
    setExpenses([
      {
        id: 1,
        date: '2024-01-20',
        category: 'fuel',
        description: 'Diesel for MH-12-AB-1234',
        amount: 8500,
        vehicleId: 'MH-12-AB-1234',
        receipt: 'FUEL-001.pdf',
        approvedBy: 'Manager',
        status: 'approved'
      },
      {
        id: 2,
        date: '2024-01-19',
        category: 'maintenance',
        description: 'Brake pad replacement - MH-14-CD-5678',
        amount: 4500,
        vehicleId: 'MH-14-CD-5678',
        receipt: 'MAINT-002.pdf',
        approvedBy: 'Manager',
        status: 'approved'
      },
      {
        id: 3,
        date: '2024-01-18',
        category: 'salary',
        description: 'Driver salary - Rajesh Kumar',
        amount: 25000,
        approvedBy: 'HR Manager',
        status: 'approved'
      },
      {
        id: 4,
        date: '2024-01-21',
        category: 'insurance',
        description: 'Vehicle insurance premium',
        amount: 12000,
        vehicleId: 'GJ-01-EF-9012',
        status: 'pending'
      },
      {
        id: 5,
        date: '2024-01-20',
        category: 'misc',
        description: 'Office supplies and stationery',
        amount: 2500,
        status: 'approved'
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'approved': return 'success'
      case 'sent': case 'pending': return 'warning'
      case 'overdue': case 'rejected': return 'error'
      case 'draft': return 'info'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel': return <FuelIcon />
      case 'maintenance': return <MaintenanceIcon />
      case 'salary': return <PersonIcon />
      case 'insurance': return <BankIcon />
      default: return <ReceiptIcon />
    }
  }

  const calculateInvoiceItems = () => {
    const amount = newInvoice.items.reduce((sum, item) => sum + item.amount, 0)
    const tax = (amount * newInvoice.tax) / 100
    return { amount, tax, totalAmount: amount + tax }
  }

  const addInvoiceItem = () => {
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }))
  }

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setNewInvoice(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      if (field === 'quantity' || field === 'rate') {
        items[index].amount = items[index].quantity * items[index].rate
      }
      return { ...prev, items }
    })
  }

  const createInvoice = () => {
    const calculated = calculateInvoiceItems()
    const invoice: Invoice = {
      id: Date.now(),
      invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: newInvoice.customerName,
      customerEmail: newInvoice.customerEmail,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate,
      amount: calculated.amount,
      tax: calculated.tax,
      totalAmount: calculated.totalAmount,
      status: 'draft',
      items: newInvoice.items
    }
    setInvoices(prev => [invoice, ...prev])
    setDialogOpen(false)
    setNewInvoice({
      customerName: '',
      customerEmail: '',
      amount: 0,
      tax: 18,
      dueDate: '',
      items: [{ description: '', quantity: 1, rate: 0, amount: 0 }]
    })
  }

  const addExpense = () => {
    const expense: Expense = {
      id: Date.now(),
      date: newExpense.date,
      category: newExpense.category as any,
      description: newExpense.description,
      amount: newExpense.amount,
      vehicleId: newExpense.vehicleId || undefined,
      status: 'pending'
    }
    setExpenses(prev => [expense, ...prev])
    setExpenseDialogOpen(false)
    setNewExpense({
      category: 'fuel',
      description: '',
      amount: 0,
      vehicleId: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          💰 FINANCIAL MANAGEMENT CENTER
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete financial operations including invoicing, expense tracking, and revenue analytics
        </Typography>
      </Box>

      {/* Financial Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{(summary.revenue.thisMonth / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2">Monthly Revenue</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                +{(((summary.revenue.thisMonth - summary.revenue.lastMonth) / summary.revenue.lastMonth) * 100).toFixed(1)}% vs last month
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
              <TrendingDownIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{(summary.expenses.thisMonth / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2">Monthly Expenses</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                +{(((summary.expenses.thisMonth - summary.expenses.lastMonth) / summary.expenses.lastMonth) * 100).toFixed(1)}% vs last month
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
              <PieChartIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{(summary.profit.thisMonth / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2">Monthly Profit</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {((summary.profit.thisMonth / summary.revenue.thisMonth) * 100).toFixed(1)}% margin
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <ScheduleIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{(summary.outstanding / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2">Outstanding</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {invoices.filter(i => i.status === 'overdue').length} overdue invoices
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Invoices" icon={<InvoiceIcon />} />
          <Tab label="Expenses" icon={<ReceiptIcon />} />
          <Tab label="Revenue Analytics" icon={<TimelineIcon />} />
          <Tab label="Financial Reports" icon={<PieChartIcon />} />
        </Tabs>
      </Paper>

      {/* Invoices Tab */}
      {tabValue === 0 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📄 INVOICES & BILLING
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Invoice
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {invoice.invoiceNumber}
                      </Typography>
                      {invoice.tripId && (
                        <Typography variant="caption" color="text.secondary">
                          Trip #{invoice.tripId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{invoice.customerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {invoice.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issueDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        color: invoice.status === 'overdue' ? 'error.main' : 'text.primary'
                      }}>
                        {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{invoice.totalAmount.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Tax: ₹{invoice.tax.toLocaleString('en-IN')})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.toUpperCase().replace('_', ' ')} 
                        color={getStatusColor(invoice.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary">
                          <PrintIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <EmailIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <DownloadIcon />
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

      {/* Expenses Tab */}
      {tabValue === 1 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              💳 EXPENSE TRACKING
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setExpenseDialogOpen(true)}
            >
              Add Expense
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Approved By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoryIcon(expense.category)}
                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                          {expense.category}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{expense.description}</Typography>
                      {expense.receipt && (
                        <Typography variant="caption" color="primary.main">
                          📎 {expense.receipt}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.vehicleId || <Typography variant="body2" color="text.secondary">-</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.status.toUpperCase()} 
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {expense.approvedBy || <Typography variant="body2" color="text.secondary">Pending</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Revenue Analytics Tab */}
      {tabValue === 2 && summary && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📊 REVENUE ANALYTICS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Today's Performance</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  ₹{summary.revenue.today.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main', mt: 1 }}>
                  ₹{summary.expenses.today.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expenses
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ₹{summary.profit.today.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Net Profit
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>This Month</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  ₹{(summary.revenue.thisMonth / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue (+{(((summary.revenue.thisMonth - summary.revenue.lastMonth) / summary.revenue.lastMonth) * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main', mt: 1 }}>
                  ₹{(summary.expenses.thisMonth / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expenses (+{(((summary.expenses.thisMonth - summary.expenses.lastMonth) / summary.expenses.lastMonth) * 100).toFixed(1)}%)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  ₹{(summary.profit.thisMonth / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Net Profit ({((summary.profit.thisMonth / summary.revenue.thisMonth) * 100).toFixed(1)}% margin)
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Cash Flow</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                  ₹{(summary.cashFlow / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available Cash
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main', mt: 1 }}>
                  ₹{(summary.outstanding / 1000).toFixed(0)}K
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Outstanding Receivables
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Yearly Performance</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  ₹{(summary.revenue.thisYear / 100000).toFixed(1)}L
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Annual Revenue
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>
                  ₹{(summary.profit.thisYear / 100000).toFixed(1)}L
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Annual Profit ({((summary.profit.thisYear / summary.revenue.thisYear) * 100).toFixed(1)}% margin)
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            💡 <strong>Insights:</strong> Revenue growth is 5.9% month-over-month. Consider optimizing fuel costs 
            which account for 35% of total expenses. Outstanding receivables need attention - 3 invoices are overdue.
          </Alert>
        </Card>
      )}

      {/* Financial Reports Tab */}
      {tabValue === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📈 FINANCIAL REPORTS
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Expense Breakdown</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><FuelIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Fuel Costs" 
                      secondary="₹2,85,000 (35% of total)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Driver Salaries" 
                      secondary="₹2,25,000 (28% of total)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MaintenanceIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Maintenance" 
                      secondary="₹1,80,000 (22% of total)"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><BankIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Insurance & Others" 
                      secondary="₹1,20,000 (15% of total)"
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Revenue per Trip</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹18,750</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Cost per KM</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>₹12.50</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Profit Margin</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>37.6%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Invoice Collection Rate</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>85.2%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Average Collection Days</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>18 days</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<DownloadIcon />}>
              Download P&L Report
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Cash Flow
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download Tax Report
            </Button>
          </Box>
        </Card>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Invoice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newInvoice.customerName}
                onChange={e => setNewInvoice(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Customer Email"
                type="email"
                value={newInvoice.customerEmail}
                onChange={e => setNewInvoice(prev => ({ ...prev, customerEmail: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={newInvoice.dueDate}
                onChange={e => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Rate (%)"
                type="number"
                value={newInvoice.tax}
                onChange={e => setNewInvoice(prev => ({ ...prev, tax: Number(e.target.value) }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Invoice Items</Typography>
              {newInvoice.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description}
                      onChange={e => updateInvoiceItem(index, 'description', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4} md={2}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      value={item.quantity}
                      onChange={e => updateInvoiceItem(index, 'quantity', Number(e.target.value))}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <TextField
                      fullWidth
                      label="Rate (₹)"
                      type="number"
                      value={item.rate}
                      onChange={e => updateInvoiceItem(index, 'rate', Number(e.target.value))}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <TextField
                      fullWidth
                      label="Amount (₹)"
                      value={item.amount}
                      disabled
                      size="small"
                    />
                  </Grid>
                </Grid>
              ))}
              <Button onClick={addInvoiceItem} startIcon={<AddIcon />}>
                Add Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ textAlign: 'right', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2">
                  Subtotal: ₹{calculateInvoiceItems().amount.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2">
                  Tax ({newInvoice.tax}%): ₹{calculateInvoiceItems().tax.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total: ₹{calculateInvoiceItems().totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={createInvoice}
            disabled={!newInvoice.customerName || !newInvoice.customerEmail || !newInvoice.dueDate}
          >
            Create Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newExpense.date}
                onChange={e => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newExpense.category}
                  onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  label="Category"
                >
                  <MenuItem value="fuel">Fuel</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="salary">Salary</MenuItem>
                  <MenuItem value="insurance">Insurance</MenuItem>
                  <MenuItem value="misc">Miscellaneous</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newExpense.description}
                onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={newExpense.amount}
                onChange={e => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vehicle ID (Optional)"
                value={newExpense.vehicleId}
                onChange={e => setNewExpense(prev => ({ ...prev, vehicleId: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={addExpense}
            disabled={!newExpense.description || !newExpense.amount}
          >
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
