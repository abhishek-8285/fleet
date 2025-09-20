import { useState } from 'react'
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
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material'
import { 
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Language as LanguageIcon,
  Backup as BackupIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'

export default function Settings() {
  const [tabValue, setTabValue] = useState(0)
  const [profileData, setProfileData] = useState({
    companyName: 'Rajesh Transport Co.',
    ownerName: 'Rajesh Kumar',
    email: 'rajesh@rttransport.com',
    phone: '+91-98765-43210',
    address: 'Transport Nagar, Mumbai',
    gstNumber: 'GST123456789',
    panNumber: 'ABCDE1234F'
  })
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    pushNotifications: true,
    fuelAlerts: true,
    maintenanceReminders: true,
    tripUpdates: true,
    paymentReminders: false
  })
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAlerts: true
  })
  const [editing, setEditing] = useState(false)

  const handleSaveProfile = () => {
    setEditing(false)
    // API call to save profile
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          ⚙️ SYSTEM SETTINGS & CONFIGURATION
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage system preferences, security settings, and business configuration
        </Typography>
      </Box>

      {/* Tabs Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Company Profile" icon={<BusinessIcon />} />
          <Tab label="Notifications" icon={<NotificationIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
          <Tab label="System Preferences" icon={<SettingsIcon />} />
        </Tabs>
      </Paper>

      {/* Company Profile Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🏢 COMPANY INFORMATION
                </Typography>
                <Button
                  startIcon={editing ? <SaveIcon /> : <EditIcon />}
                  variant={editing ? "contained" : "outlined"}
                  onClick={editing ? handleSaveProfile : () => setEditing(true)}
                >
                  {editing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: 'primary.main', mx: 'auto', mb: 2, fontSize: 40 }}>
                    🚛
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {profileData.companyName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fleet Management Company
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={profileData.companyName}
                    onChange={e => setProfileData(prev => ({ ...prev, companyName: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Owner Name"
                    value={profileData.ownerName}
                    onChange={e => setProfileData(prev => ({ ...prev, ownerName: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={profileData.email}
                    onChange={e => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={profileData.phone}
                    onChange={e => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Address"
                    multiline
                    rows={2}
                    value={profileData.address}
                    onChange={e => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    value={profileData.gstNumber}
                    onChange={e => setProfileData(prev => ({ ...prev, gstNumber: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    value={profileData.panNumber}
                    onChange={e => setProfileData(prev => ({ ...prev, panNumber: e.target.value }))}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>

              {editing && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                  <Button variant="outlined" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </Box>
              )}
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  📊 Account Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Account Created</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Mar 2023</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Vehicles</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>24</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Drivers</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>18</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Trips Completed</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>1,247</Typography>
                  </Box>
                </Stack>
              </Card>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  🎯 Subscription Plan
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Professional
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ₹2,999/month • Expires: 15 Mar 2024
                </Typography>
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  Upgrade Plan
                </Button>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* Notifications Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🔔 NOTIFICATION PREFERENCES
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Communication Channels
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.emailAlerts}
                          onChange={e => setNotifications(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.smsAlerts}
                          onChange={e => setNotifications(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                        />
                      }
                      label="SMS Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.pushNotifications}
                          onChange={e => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        />
                      }
                      label="Push Notifications"
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Alert Types
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.fuelAlerts}
                          onChange={e => setNotifications(prev => ({ ...prev, fuelAlerts: e.target.checked }))}
                        />
                      }
                      label="Fuel Level Alerts"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.maintenanceReminders}
                          onChange={e => setNotifications(prev => ({ ...prev, maintenanceReminders: e.target.checked }))}
                        />
                      }
                      label="Maintenance Reminders"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.tripUpdates}
                          onChange={e => setNotifications(prev => ({ ...prev, tripUpdates: e.target.checked }))}
                        />
                      }
                      label="Trip Status Updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={notifications.paymentReminders}
                          onChange={e => setNotifications(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                        />
                      }
                      label="Payment Reminders"
                    />
                  </Stack>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained">
                    Save Notification Settings
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📱 Notification Schedule
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Quiet Hours Start"
                  type="time"
                  defaultValue="22:00"
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="Quiet Hours End"
                  type="time"
                  defaultValue="07:00"
                  InputLabelProps={{ shrink: true }}
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Weekend Notifications"
                />
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🔐 SECURITY & ACCESS CONTROL
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Authentication Settings
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={security.twoFactorAuth}
                          onChange={e => setSecurity(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                        />
                      }
                      label="Two-Factor Authentication"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={security.loginAlerts}
                          onChange={e => setSecurity(prev => ({ ...prev, loginAlerts: e.target.checked }))}
                        />
                      }
                      label="Login Alerts"
                    />
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Session Management
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Session Timeout (minutes)"
                        type="number"
                        value={security.sessionTimeout}
                        onChange={e => setSecurity(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Password Expiry (days)"
                        type="number"
                        value={security.passwordExpiry}
                        onChange={e => setSecurity(prev => ({ ...prev, passwordExpiry: Number(e.target.value) }))}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Password Security
                  </Typography>
                  <Stack spacing={2}>
                    <Button variant="outlined">
                      Change Password
                    </Button>
                    <Button variant="outlined">
                      Download Backup Codes
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained">
                    Save Security Settings
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  🛡️ Security Status
                </Typography>
                <Stack spacing={2}>
                  <Alert severity="success">
                    Password: Strong
                  </Alert>
                  <Alert severity="warning">
                    2FA: Not Enabled
                  </Alert>
                  <Alert severity="info">
                    Last Login: Today, 2:30 PM
                  </Alert>
                </Stack>
              </Card>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  📋 Recent Activity
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Login from Chrome"
                      secondary="Today, 2:30 PM"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Password changed"
                      secondary="2 days ago"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Profile updated"
                      secondary="1 week ago"
                    />
                  </ListItem>
                </List>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* System Preferences Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🌐 LANGUAGE & LOCALIZATION
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  select
                  label="Primary Language"
                  defaultValue="en"
                  SelectProps={{ native: true }}
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Currency"
                  defaultValue="INR"
                  SelectProps={{ native: true }}
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Date Format"
                  defaultValue="DD/MM/YYYY"
                  SelectProps={{ native: true }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Time Zone"
                  defaultValue="Asia/Kolkata"
                  SelectProps={{ native: true }}
                >
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="UTC">UTC</option>
                </TextField>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                💾 DATA & BACKUP
              </Typography>
              <Stack spacing={3}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Automatic Backup"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Data Analytics"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Performance Monitoring"
                />
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Data Retention Period
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    defaultValue="365"
                    SelectProps={{ native: true }}
                  >
                    <option value="90">3 Months</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                    <option value="1095">3 Years</option>
                  </TextField>
                </Box>
                <Button variant="outlined" startIcon={<BackupIcon />}>
                  Download Data Export
                </Button>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🎨 DISPLAY PREFERENCES
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Theme"
                    defaultValue="light"
                    SelectProps={{ native: true }}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="auto">Auto (System)</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Dashboard Layout"
                    defaultValue="default"
                    SelectProps={{ native: true }}
                  >
                    <option value="compact">Compact</option>
                    <option value="default">Default</option>
                    <option value="expanded">Expanded</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Items per Page"
                    defaultValue="20"
                    SelectProps={{ native: true }}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </TextField>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3 }}>
        <Alert severity="info">
          💡 <strong>Settings Tip:</strong> Changes to critical settings may require system restart. 
          All settings are automatically backed up and can be restored if needed.
        </Alert>
      </Box>
    </Box>
  )
}
