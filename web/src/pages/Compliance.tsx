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
  ListItemSecondaryAction
} from '@mui/material'
import { 
  Assignment as DocumentIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  Person as PersonIcon,
  DirectionsCar as VehicleIcon,
  Security as SecurityIcon,
  Gavel as LegalIcon,
  LocalPolice as PoliceIcon,
  FileDownload as DownloadIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  Notifications as NotificationIcon,
  VerifiedUser as VerifiedIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'

type Document = {
  id: number
  type: 'license' | 'insurance' | 'permit' | 'fitness' | 'pollution' | 'registration' | 'medical' | 'other'
  title: string
  description: string
  entityType: 'driver' | 'vehicle' | 'company'
  entityId: string
  entityName: string
  issueDate: string
  expiryDate: string
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'rejected'
  documentNumber: string
  issuedBy: string
  filename?: string
  uploadDate: string
  reminders: boolean
  complianceScore?: number
}

type ComplianceAlert = {
  id: number
  type: 'expiry' | 'missing' | 'renewal' | 'violation'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  entityType: 'driver' | 'vehicle' | 'company'
  entityId: string
  entityName: string
  dueDate?: string
  actionRequired: string
  resolved: boolean
}

type ComplianceReport = {
  overall: number
  drivers: number
  vehicles: number
  company: number
  expiringThisMonth: number
  expiredDocuments: number
  pendingRenewals: number
}

export default function Compliance() {
  const [tabValue, setTabValue] = useState(0)
  const [documents, setDocuments] = useState<Document[]>([])
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [newDocument, setNewDocument] = useState({
    type: 'license',
    title: '',
    description: '',
    entityType: 'driver',
    entityId: '',
    entityName: '',
    issueDate: '',
    expiryDate: '',
    documentNumber: '',
    issuedBy: '',
    reminders: true
  })

  // Sample data
  useEffect(() => {
    // Compliance Report
    setReport({
      overall: 87,
      drivers: 92,
      vehicles: 85,
      company: 83,
      expiringThisMonth: 8,
      expiredDocuments: 3,
      pendingRenewals: 5
    })

    // Sample Documents
    setDocuments([
      {
        id: 1,
        type: 'license',
        title: 'Commercial Driving License',
        description: 'Heavy Vehicle License',
        entityType: 'driver',
        entityId: 'DRV001',
        entityName: 'Rajesh Kumar',
        issueDate: '2020-03-15',
        expiryDate: '2025-03-15',
        status: 'valid',
        documentNumber: 'DL-MH-20200315001',
        issuedBy: 'Transport Department, Maharashtra',
        filename: 'rajesh_license.pdf',
        uploadDate: '2024-01-10',
        reminders: true,
        complianceScore: 95
      },
      {
        id: 2,
        type: 'fitness',
        title: 'Vehicle Fitness Certificate',
        description: 'Annual Fitness Test Certificate',
        entityType: 'vehicle',
        entityId: 'VEH001',
        entityName: 'MH-12-AB-1234',
        issueDate: '2024-01-01',
        expiryDate: '2024-12-31',
        status: 'valid',
        documentNumber: 'FC-2024-001234',
        issuedBy: 'RTO Mumbai',
        filename: 'vehicle_fitness.pdf',
        uploadDate: '2024-01-05',
        reminders: true,
        complianceScore: 90
      },
      {
        id: 3,
        type: 'insurance',
        title: 'Vehicle Insurance',
        description: 'Comprehensive Motor Insurance',
        entityType: 'vehicle',
        entityId: 'VEH002',
        entityName: 'MH-14-CD-5678',
        issueDate: '2023-06-01',
        expiryDate: '2024-05-31',
        status: 'expiring_soon',
        documentNumber: 'INS-2023-567890',
        issuedBy: 'ICICI Lombard',
        filename: 'insurance_policy.pdf',
        uploadDate: '2023-06-01',
        reminders: true,
        complianceScore: 75
      },
      {
        id: 4,
        type: 'pollution',
        title: 'Pollution Under Control Certificate',
        description: 'PUC Certificate',
        entityType: 'vehicle',
        entityId: 'VEH003',
        entityName: 'GJ-01-EF-9012',
        issueDate: '2023-12-15',
        expiryDate: '2024-06-15',
        status: 'valid',
        documentNumber: 'PUC-2023-012345',
        issuedBy: 'Authorized Testing Center',
        filename: 'puc_certificate.pdf',
        uploadDate: '2023-12-15',
        reminders: true,
        complianceScore: 88
      },
      {
        id: 5,
        type: 'medical',
        title: 'Medical Certificate',
        description: 'Driver Medical Fitness Certificate',
        entityType: 'driver',
        entityId: 'DRV002',
        entityName: 'Suresh Patil',
        issueDate: '2023-09-01',
        expiryDate: '2024-09-01',
        status: 'expiring_soon',
        documentNumber: 'MED-2023-002',
        issuedBy: 'Apollo Hospital, Pune',
        filename: 'medical_cert.pdf',
        uploadDate: '2023-09-01',
        reminders: true,
        complianceScore: 82
      },
      {
        id: 6,
        type: 'permit',
        title: 'Inter-State Permit',
        description: 'National Permit for Goods Carriage',
        entityType: 'vehicle',
        entityId: 'VEH001',
        entityName: 'MH-12-AB-1234',
        issueDate: '2023-04-01',
        expiryDate: '2024-03-31',
        status: 'expired',
        documentNumber: 'NP-2023-001234',
        issuedBy: 'Transport Commissioner, Maharashtra',
        filename: 'national_permit.pdf',
        uploadDate: '2023-04-01',
        reminders: true,
        complianceScore: 60
      }
    ])

    // Sample Alerts
    setAlerts([
      {
        id: 1,
        type: 'expiry',
        severity: 'high',
        title: 'Inter-State Permit Expired',
        description: 'National permit for MH-12-AB-1234 has expired',
        entityType: 'vehicle',
        entityId: 'VEH001',
        entityName: 'MH-12-AB-1234',
        dueDate: '2024-03-31',
        actionRequired: 'Renew permit immediately to avoid penalties',
        resolved: false
      },
      {
        id: 2,
        type: 'expiry',
        severity: 'medium',
        title: 'Insurance Expiring Soon',
        description: 'Vehicle insurance for MH-14-CD-5678 expires in 15 days',
        entityType: 'vehicle',
        entityId: 'VEH002',
        entityName: 'MH-14-CD-5678',
        dueDate: '2024-05-31',
        actionRequired: 'Contact insurance provider for renewal',
        resolved: false
      },
      {
        id: 3,
        type: 'expiry',
        severity: 'medium',
        title: 'Medical Certificate Expiring',
        description: 'Driver medical certificate expires in 45 days',
        entityType: 'driver',
        entityId: 'DRV002',
        entityName: 'Suresh Patil',
        dueDate: '2024-09-01',
        actionRequired: 'Schedule medical examination',
        resolved: false
      },
      {
        id: 4,
        type: 'missing',
        severity: 'high',
        title: 'Missing Driver License',
        description: 'No valid license uploaded for new driver',
        entityType: 'driver',
        entityId: 'DRV003',
        entityName: 'Ram Prakash',
        actionRequired: 'Upload valid driving license',
        resolved: false
      },
      {
        id: 5,
        type: 'renewal',
        severity: 'low',
        title: 'PUC Renewal Due',
        description: 'Pollution certificate renewal due in 2 months',
        entityType: 'vehicle',
        entityId: 'VEH003',
        entityName: 'GJ-01-EF-9012',
        dueDate: '2024-06-15',
        actionRequired: 'Schedule PUC test',
        resolved: false
      }
    ])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success'
      case 'expiring_soon': return 'warning'
      case 'expired': return 'error'
      case 'pending_renewal': return 'info'
      case 'rejected': return 'error'
      default: return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'license': return <PersonIcon />
      case 'insurance': return <SecurityIcon />
      case 'permit': return <LegalIcon />
      case 'fitness': return <VehicleIcon />
      case 'pollution': return <VerifiedIcon />
      case 'registration': return <DocumentIcon />
      case 'medical': return <PersonIcon />
      default: return <FileIcon />
    }
  }

  const addDocument = () => {
    const document: Document = {
      id: Date.now(),
      type: newDocument.type as any,
      title: newDocument.title,
      description: newDocument.description,
      entityType: newDocument.entityType as any,
      entityId: newDocument.entityId,
      entityName: newDocument.entityName,
      issueDate: newDocument.issueDate,
      expiryDate: newDocument.expiryDate,
      status: 'valid',
      documentNumber: newDocument.documentNumber,
      issuedBy: newDocument.issuedBy,
      uploadDate: new Date().toISOString().split('T')[0],
      reminders: newDocument.reminders,
      complianceScore: 85
    }
    setDocuments(prev => [document, ...prev])
    setDialogOpen(false)
    setNewDocument({
      type: 'license',
      title: '',
      description: '',
      entityType: 'driver',
      entityId: '',
      entityName: '',
      issueDate: '',
      expiryDate: '',
      documentNumber: '',
      issuedBy: '',
      reminders: true
    })
  }

  const markAlertResolved = (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success'
    if (score >= 75) return 'warning'
    return 'error'
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          📋 COMPLIANCE & DOCUMENT CENTER
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete document management, compliance tracking, and regulatory oversight
        </Typography>
      </Box>

      {/* Compliance Summary Cards */}
      {report && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: getComplianceColor(report.overall) + '.light', color: 'white' }}>
              <VerifiedIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {report.overall}%
              </Typography>
              <Typography variant="body2">Overall Compliance</Typography>
              <LinearProgress 
                variant="determinate" 
                value={report.overall} 
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.3)' }}
              />
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {report.expiringThisMonth}
              </Typography>
              <Typography variant="body2">Expiring This Month</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Requires immediate attention
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
              <ErrorIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {report.expiredDocuments}
              </Typography>
              <Typography variant="body2">Expired Documents</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Critical compliance risk
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
              <ScheduleIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {report.pendingRenewals}
              </Typography>
              <Typography variant="body2">Pending Renewals</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                In process or waiting
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Documents" icon={<DocumentIcon />} />
          <Tab label="Compliance Alerts" icon={<NotificationIcon />} />
          <Tab label="Compliance Report" icon={<VerifiedIcon />} />
          <Tab label="Renewal Calendar" icon={<CalendarIcon />} />
        </Tabs>
      </Paper>

      {/* Documents Tab */}
      {tabValue === 0 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📄 DOCUMENT REPOSITORY
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Upload Document
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Document Number</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getDocumentTypeIcon(doc.type)}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {doc.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {doc.entityName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.entityType.toUpperCase()}: {doc.entityId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {doc.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Issued by: {doc.issuedBy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.issueDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{
                        color: doc.status === 'expired' ? 'error.main' : 
                               doc.status === 'expiring_soon' ? 'warning.main' : 'text.primary'
                      }}>
                        {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                      </Typography>
                      {doc.status === 'expiring_soon' && (
                        <Typography variant="caption" color="warning.main">
                          Expires in {Math.ceil((new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.status.replace('_', ' ').toUpperCase()} 
                        color={getStatusColor(doc.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {doc.complianceScore && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600,
                            color: getComplianceColor(doc.complianceScore) + '.main'
                          }}>
                            {doc.complianceScore}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={doc.complianceScore} 
                            sx={{ width: 50, height: 6, borderRadius: 3 }}
                            color={getComplianceColor(doc.complianceScore)}
                          />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <DownloadIcon />
                        </IconButton>
                        {doc.status === 'expired' || doc.status === 'expiring_soon' ? (
                          <IconButton size="small" color="warning">
                            <UploadIcon />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Compliance Alerts Tab */}
      {tabValue === 1 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🚨 COMPLIANCE ALERTS & NOTIFICATIONS
          </Typography>

          <Grid container spacing={3}>
            {alerts.filter(alert => !alert.resolved).map((alert) => (
              <Grid item xs={12} md={6} key={alert.id}>
                <Alert 
                  severity={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                  sx={{ borderRadius: 2 }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => markAlertResolved(alert.id)}
                      startIcon={<CheckIcon />}
                    >
                      Resolve
                    </Button>
                  }
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {alert.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {alert.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption">
                      {alert.entityType.toUpperCase()}: {alert.entityName}
                    </Typography>
                    {alert.dueDate && (
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Due: {new Date(alert.dueDate).toLocaleDateString('en-IN')}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 1, 
                    fontStyle: 'italic',
                    color: 'text.secondary'
                  }}>
                    Action Required: {alert.actionRequired}
                  </Typography>
                </Alert>
              </Grid>
            ))}
          </Grid>

          {alerts.filter(alert => alert.resolved).length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                ✅ Resolved Alerts
              </Typography>
              <List>
                {alerts.filter(alert => alert.resolved).map((alert) => (
                  <ListItem key={alert.id}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={alert.title}
                      secondary={`${alert.entityName} - Resolved`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Card>
      )}

      {/* Compliance Report Tab */}
      {tabValue === 2 && report && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📊 COMPREHENSIVE COMPLIANCE REPORT
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Driver Compliance</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: getComplianceColor(report.drivers) + '.main', mb: 1 }}>
                  {report.drivers}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={report.drivers} 
                  color={getComplianceColor(report.drivers)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  License, Medical certificates, and training records
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Vehicle Compliance</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: getComplianceColor(report.vehicles) + '.main', mb: 1 }}>
                  {report.vehicles}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={report.vehicles} 
                  color={getComplianceColor(report.vehicles)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Registration, Insurance, Fitness, and Permits
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Company Compliance</Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: getComplianceColor(report.company) + '.main', mb: 1 }}>
                  {report.company}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={report.company} 
                  color={getComplianceColor(report.company)}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Trade licenses, Tax certificates, and Regulatory approvals
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Document Status Breakdown</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Valid Documents</Typography>
                    <Chip label={`${documents.filter(d => d.status === 'valid').length}`} color="success" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Expiring Soon</Typography>
                    <Chip label={`${documents.filter(d => d.status === 'expiring_soon').length}`} color="warning" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Expired</Typography>
                    <Chip label={`${documents.filter(d => d.status === 'expired').length}`} color="error" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Pending Renewal</Typography>
                    <Chip label={`${documents.filter(d => d.status === 'pending_renewal').length}`} color="info" />
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>Critical Actions Required</Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><ErrorIcon color="error" /></ListItemIcon>
                    <ListItemText 
                      primary="Renew expired permits" 
                      secondary="3 vehicles with expired permits"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                    <ListItemText 
                      primary="Schedule medical checkups" 
                      secondary="2 drivers due for medical renewal"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><ScheduleIcon color="info" /></ListItemIcon>
                    <ListItemText 
                      primary="Insurance renewals" 
                      secondary="4 policies expiring this quarter"
                    />
                  </ListItem>
                </List>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            📋 <strong>Compliance Summary:</strong> Overall compliance is good at 87%. Focus on renewing expired permits 
            and scheduling upcoming medical examinations. All vehicle fitness certificates are current.
          </Alert>
        </Card>
      )}

      {/* Renewal Calendar Tab */}
      {tabValue === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            📅 RENEWAL CALENDAR & SCHEDULE
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom color="error.main">
                  🚨 Immediate Action Required (Overdue)
                </Typography>
                <List>
                  {documents.filter(d => d.status === 'expired').map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${doc.title} - ${doc.entityName}`}
                        secondary={`Expired: ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="contained" color="error">
                          Renew Now
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚠️ Expiring Soon (Next 60 Days)
                </Typography>
                <List>
                  {documents.filter(d => d.status === 'expiring_soon').map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${doc.title} - ${doc.entityName}`}
                        secondary={`Expires: ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" variant="outlined" color="warning">
                          Schedule
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  📋 Complete Renewal Schedule
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Document</TableCell>
                        <TableCell>Entity</TableCell>
                        <TableCell>Current Expiry</TableCell>
                        <TableCell>Renewal Window</TableCell>
                        <TableCell>Estimated Cost</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {documents
                        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                        .map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{doc.title}</TableCell>
                          <TableCell>{doc.entityName}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{
                              color: doc.status === 'expired' ? 'error.main' : 
                                     doc.status === 'expiring_soon' ? 'warning.main' : 'text.primary'
                            }}>
                              {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(new Date(doc.expiryDate).getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')} - {new Date(doc.expiryDate).toLocaleDateString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ₹{(Math.random() * 5000 + 1000).toFixed(0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant={doc.status === 'expired' ? 'contained' : 'outlined'}
                              color={doc.status === 'expired' ? 'error' : 'primary'}
                            >
                              {doc.status === 'expired' ? 'Renew' : 'Schedule'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Upload Document Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload New Document</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={newDocument.type}
                  onChange={e => setNewDocument(prev => ({ ...prev, type: e.target.value }))}
                  label="Document Type"
                >
                  <MenuItem value="license">Driving License</MenuItem>
                  <MenuItem value="insurance">Insurance Policy</MenuItem>
                  <MenuItem value="permit">Transport Permit</MenuItem>
                  <MenuItem value="fitness">Fitness Certificate</MenuItem>
                  <MenuItem value="pollution">PUC Certificate</MenuItem>
                  <MenuItem value="registration">Registration Certificate</MenuItem>
                  <MenuItem value="medical">Medical Certificate</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Entity Type</InputLabel>
                <Select
                  value={newDocument.entityType}
                  onChange={e => setNewDocument(prev => ({ ...prev, entityType: e.target.value }))}
                  label="Entity Type"
                >
                  <MenuItem value="driver">Driver</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entity ID"
                value={newDocument.entityId}
                onChange={e => setNewDocument(prev => ({ ...prev, entityId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entity Name"
                value={newDocument.entityName}
                onChange={e => setNewDocument(prev => ({ ...prev, entityName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Document Title"
                value={newDocument.title}
                onChange={e => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newDocument.description}
                onChange={e => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Number"
                value={newDocument.documentNumber}
                onChange={e => setNewDocument(prev => ({ ...prev, documentNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Issued By"
                value={newDocument.issuedBy}
                onChange={e => setNewDocument(prev => ({ ...prev, issuedBy: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Issue Date"
                type="date"
                value={newDocument.issueDate}
                onChange={e => setNewDocument(prev => ({ ...prev, issueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={newDocument.expiryDate}
                onChange={e => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ py: 3 }}
              >
                Click to Upload Document File (PDF, JPG, PNG)
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={addDocument}
            disabled={!newDocument.title || !newDocument.entityName || !newDocument.documentNumber}
          >
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}