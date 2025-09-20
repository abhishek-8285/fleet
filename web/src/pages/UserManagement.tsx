import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Tab,
  Tabs,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import { 
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  AccountCircle as UserIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Key as KeyIcon,
  Shield as ShieldIcon
} from '@mui/icons-material'

type User = {
  id: number
  username: string
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'manager' | 'operator' | 'viewer'
  status: 'active' | 'inactive' | 'blocked'
  lastLogin?: string
  createdDate: string
  permissions: string[]
  avatar?: string
}

type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
}

export default function UserManagement() {
  const [tabValue, setTabValue] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'operator',
    password: ''
  })

  const allPermissions = [
    'view_dashboard',
    'manage_vehicles',
    'manage_drivers',
    'manage_trips',
    'view_financial',
    'manage_financial',
    'view_analytics',
    'manage_users',
    'system_settings',
    'compliance_management',
    'customer_management',
    'maintenance_management'
  ]

  useEffect(() => {
    // Sample users
    setUsers([
      {
        id: 1,
        username: 'admin',
        fullName: 'Rajesh Kumar (Owner)',
        email: 'rajesh@rttransport.com',
        phone: '+91-98765-43210',
        role: 'admin',
        status: 'active',
        lastLogin: '2024-01-21T14:30:00',
        createdDate: '2023-03-15',
        permissions: allPermissions
      },
      {
        id: 2,
        username: 'manager1',
        fullName: 'Priya Sharma',
        email: 'priya@rttransport.com',
        phone: '+91-87654-32109',
        role: 'manager',
        status: 'active',
        lastLogin: '2024-01-21T10:15:00',
        createdDate: '2023-06-20',
        permissions: [
          'view_dashboard',
          'manage_vehicles',
          'manage_drivers',
          'manage_trips',
          'view_financial',
          'view_analytics',
          'compliance_management',
          'customer_management',
          'maintenance_management'
        ]
      },
      {
        id: 3,
        username: 'operator1',
        fullName: 'Amit Patel',
        email: 'amit@rttransport.com',
        phone: '+91-76543-21098',
        role: 'operator',
        status: 'active',
        lastLogin: '2024-01-21T08:45:00',
        createdDate: '2023-09-10',
        permissions: [
          'view_dashboard',
          'manage_vehicles',
          'manage_drivers',
          'manage_trips',
          'compliance_management'
        ]
      },
      {
        id: 4,
        username: 'viewer1',
        fullName: 'Sunita Joshi',
        email: 'sunita@rttransport.com',
        phone: '+91-65432-10987',
        role: 'viewer',
        status: 'active',
        lastLogin: '2024-01-20T16:20:00',
        createdDate: '2023-11-05',
        permissions: [
          'view_dashboard',
          'view_financial',
          'view_analytics'
        ]
      },
      {
        id: 5,
        username: 'temp_user',
        fullName: 'Vikash Singh',
        email: 'vikash@rttransport.com',
        phone: '+91-54321-09876',
        role: 'operator',
        status: 'inactive',
        lastLogin: '2024-01-10T12:30:00',
        createdDate: '2023-12-01',
        permissions: [
          'view_dashboard',
          'manage_trips'
        ]
      }
    ])

    // Sample roles
    setRoles([
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access with all permissions',
        permissions: allPermissions,
        userCount: 1
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Operational management with limited system settings access',
        permissions: [
          'view_dashboard',
          'manage_vehicles',
          'manage_drivers',
          'manage_trips',
          'view_financial',
          'view_analytics',
          'compliance_management',
          'customer_management',
          'maintenance_management'
        ],
        userCount: 1
      },
      {
        id: 'operator',
        name: 'Operator',
        description: 'Day-to-day operations management',
        permissions: [
          'view_dashboard',
          'manage_vehicles',
          'manage_drivers',
          'manage_trips',
          'compliance_management'
        ],
        userCount: 2
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to dashboards and reports',
        permissions: [
          'view_dashboard',
          'view_financial',
          'view_analytics'
        ],
        userCount: 1
      }
    ])
  }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon />
      case 'manager': return <ManagerIcon />
      case 'operator': return <PersonIcon />
      case 'viewer': return <UserIcon />
      default: return <PersonIcon />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error'
      case 'manager': return 'warning'
      case 'operator': return 'primary'
      case 'viewer': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'
      case 'blocked': return 'error'
      default: return 'default'
    }
  }

  const addUser = () => {
    const user: User = {
      id: Date.now(),
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role as any,
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0],
      permissions: roles.find(r => r.id === newUser.role)?.permissions || []
    }
    setUsers(prev => [user, ...prev])
    setDialogOpen(false)
    setNewUser({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'operator',
      password: ''
    })
  }

  const toggleUserStatus = (userId: number) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ))
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          👥 USER MANAGEMENT & ACCESS CONTROL
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage user accounts, roles, permissions, and system access
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
            <PersonIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {users.length}
            </Typography>
            <Typography variant="body2">Total Users</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {users.filter(u => u.status === 'active').length} active
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <AdminIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {users.filter(u => u.role === 'admin').length}
            </Typography>
            <Typography variant="body2">Administrators</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Full access
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <SecurityIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {roles.length}
            </Typography>
            <Typography variant="body2">Active Roles</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Permission groups
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <ShieldIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {allPermissions.length}
            </Typography>
            <Typography variant="body2">Permissions</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              System modules
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="User Accounts" icon={<PersonIcon />} />
          <Tab label="Roles & Permissions" icon={<SecurityIcon />} />
          <Tab label="Access Logs" icon={<KeyIcon />} />
        </Tabs>
      </Paper>

      {/* User Accounts Tab */}
      {tabValue === 0 && (
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              👤 USER ACCOUNTS
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add User
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: getRoleColor(user.role) + '.main' }}>
                          {getRoleIcon(user.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.fullName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            @{user.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role.toUpperCase()} 
                        color={getRoleColor(user.role)}
                        size="small"
                        icon={getRoleIcon(user.role)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <Typography variant="body2">
                          {new Date(user.lastLogin).toLocaleString('en-IN')}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Never</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status.toUpperCase()} 
                        color={getStatusColor(user.status)}
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
                        <IconButton 
                          size="small" 
                          color={user.status === 'active' ? 'warning' : 'success'}
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          <BlockIcon />
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

      {/* Roles & Permissions Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🔐 ROLES & PERMISSIONS
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setRoleDialogOpen(true)}
                >
                  Create Role
                </Button>
              </Box>

              <Grid container spacing={3}>
                {roles.map((role) => (
                  <Grid item xs={12} md={6} key={role.id}>
                    <Card sx={{ p: 3, border: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {role.name}
                        </Typography>
                        <Chip 
                          label={`${role.userCount} users`} 
                          color="primary"
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {role.description}
                      </Typography>

                      <Typography variant="subtitle2" gutterBottom>
                        Permissions ({role.permissions.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {role.permissions.slice(0, 4).map((permission) => (
                          <Chip 
                            key={permission}
                            label={permission.replace('_', ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {role.permissions.length > 4 && (
                          <Chip 
                            label={`+${role.permissions.length - 4} more`}
                            size="small"
                            variant="outlined"
                            color="info"
                          />
                        )}
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined">
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" color="error">
                          Delete
                        </Button>
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📋 All System Permissions
              </Typography>
              <List dense>
                {allPermissions.map((permission) => (
                  <ListItem key={permission}>
                    <ListItemIcon>
                      <SecurityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={permission.replace('_', ' ').toUpperCase()}
                      secondary={`Used in ${roles.filter(r => r.permissions.includes(permission)).length} roles`}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Access Logs Tab */}
      {tabValue === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            🔍 USER ACCESS LOGS
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>2024-01-21 14:30:25</TableCell>
                  <TableCell>Rajesh Kumar (@admin)</TableCell>
                  <TableCell>Login</TableCell>
                  <TableCell>192.168.1.100</TableCell>
                  <TableCell><Chip label="SUCCESS" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-01-21 10:15:12</TableCell>
                  <TableCell>Priya Sharma (@manager1)</TableCell>
                  <TableCell>Login</TableCell>
                  <TableCell>192.168.1.105</TableCell>
                  <TableCell><Chip label="SUCCESS" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-01-21 08:45:33</TableCell>
                  <TableCell>Amit Patel (@operator1)</TableCell>
                  <TableCell>Login</TableCell>
                  <TableCell>192.168.1.110</TableCell>
                  <TableCell><Chip label="SUCCESS" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-01-21 02:15:44</TableCell>
                  <TableCell>Unknown User</TableCell>
                  <TableCell>Failed Login Attempt</TableCell>
                  <TableCell>203.45.67.89</TableCell>
                  <TableCell><Chip label="FAILED" color="error" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2024-01-20 16:20:18</TableCell>
                  <TableCell>Sunita Joshi (@viewer1)</TableCell>
                  <TableCell>Logout</TableCell>
                  <TableCell>192.168.1.115</TableCell>
                  <TableCell><Chip label="SUCCESS" color="success" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={newUser.fullName}
                onChange={e => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Username"
                value={newUser.username}
                onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newUser.email}
                onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newUser.phone}
                onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  label="Role"
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="operator">Operator</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={newUser.password}
                onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={addUser}
            disabled={!newUser.username || !newUser.fullName || !newUser.email || !newUser.password}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      <Alert severity="warning" sx={{ mt: 3 }}>
        🔐 <strong>Security Notice:</strong> Administrator access should be limited to trusted personnel only. 
        Regular security audits are recommended. All user activities are logged for compliance.
      </Alert>
    </Box>
  )
}
