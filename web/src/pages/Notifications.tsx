import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Stack,
  Chip,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Button,
  Badge,
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { 
  Notifications as NotificationIcon,
  Warning as WarningIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  ReportProblem as EmergencyIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  VolumeUp as SoundIcon,
  VolumeOff as MuteIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useFleetWebSocket, FleetAlert, SystemNotification } from '../services/websocket';

interface NotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  fuelTheftAlerts: boolean;
  maintenanceReminders: boolean;
  routeDeviations: boolean;
  emergencyAlerts: boolean;
  systemUpdates: boolean;
}

export default function Notifications() {
  const [tabValue, setTabValue] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<SystemNotification | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    desktopNotifications: true,
    fuelTheftAlerts: true,
    maintenanceReminders: true,
    routeDeviations: true,
    emergencyAlerts: true,
    systemUpdates: false
  });
  
  // Get real-time notifications and alerts from WebSocket
  const { 
    notifications, 
    alerts, 
    isConnected, 
    markNotificationAsRead, 
    clearAlert 
  } = useFleetWebSocket();

  // Local state for managing UI
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Calculate notification counts
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highPriorityAlerts = alerts.filter(a => a.severity === 'high').length;

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.isRead) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    return true;
  });

  // Filter alerts based on current filter
  const filteredAlerts = alerts.filter(alert => {
    if (filterType !== 'all' && filterType !== 'alerts') return false;
    return true;
  });

  // Play notification sound
  const playNotificationSound = (severity: 'info' | 'warning' | 'error' | 'critical' = 'info') => {
    if (!settings.soundEnabled) return;
    
    // In a real app, you'd have different sound files for different severities
    const audio = new Audio('/notification-sounds/alert.mp3');
    audio.volume = severity === 'critical' ? 1.0 : severity === 'error' ? 0.8 : 0.5;
    audio.play().catch(() => {
      // Fallback to system beep if audio file not available
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        speechSynthesis.speak(utterance);
      }
    });
  };

  // Handle new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.isRead) {
        playNotificationSound(latestNotification.type as any);
        
        // Show desktop notification if enabled and permission granted
        if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`FleetFlow: ${latestNotification.title}`, {
            body: latestNotification.message,
            icon: '/favicon.ico',
            tag: latestNotification.id
          });
        }
      }
    }
  }, [notifications, settings]);

  // Handle new alerts
  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[0];
      playNotificationSound(latestAlert.severity as any);
    }
  }, [alerts]);

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleClearAlert = (alertId: string) => {
    clearAlert(alertId);
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) markNotificationAsRead(n.id);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'success': return <SuccessIcon color="success" />;
      case 'info': 
      default: return <InfoIcon color="info" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fuel_theft': return <FuelIcon color="error" />;
      case 'maintenance': return <MaintenanceIcon color="warning" />;
      case 'breakdown': return <VehicleIcon color="error" />;
      case 'route_deviation': return <DriverIcon color="warning" />;
      case 'emergency': return <EmergencyIcon color="error" />;
      default: return <WarningIcon color="warning" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={unreadNotifications + criticalAlerts} color="error">
            <NotificationIcon />
          </Badge>
            NOTIFICATIONS & ALERTS
            <Chip 
              label={isConnected ? 'LIVE' : 'OFFLINE'}
              color={isConnected ? 'success' : 'error'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Real-time fleet alerts and system notifications • {unreadNotifications} unread
        </Typography>
      </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<MarkReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={unreadNotifications === 0}
          >
            Mark All Read
          </Button>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </IconButton>
        </Stack>
      </Stack>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Real-time connection lost. Notifications may be delayed. Check your internet connection.
        </Alert>
      )}

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small">
              View Critical Alerts
            </Button>
          }
        >
          <strong>{criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''} Require Immediate Attention!</strong>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ p: 2, flexGrow: 1, textAlign: 'center', bgcolor: unreadNotifications > 0 ? 'warning.light' : 'grey.100' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: unreadNotifications > 0 ? 'white' : 'text.primary' }}>
            {unreadNotifications}
            </Typography>
          <Typography variant="body2" sx={{ color: unreadNotifications > 0 ? 'white' : 'text.secondary' }}>
            Unread Notifications
            </Typography>
          </Card>
        <Card sx={{ p: 2, flexGrow: 1, textAlign: 'center', bgcolor: criticalAlerts > 0 ? 'error.light' : 'grey.100' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: criticalAlerts > 0 ? 'white' : 'text.primary' }}>
            {criticalAlerts}
            </Typography>
          <Typography variant="body2" sx={{ color: criticalAlerts > 0 ? 'white' : 'text.secondary' }}>
            Critical Alerts
            </Typography>
          </Card>
        <Card sx={{ p: 2, flexGrow: 1, textAlign: 'center', bgcolor: highPriorityAlerts > 0 ? 'warning.light' : 'grey.100' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: highPriorityAlerts > 0 ? 'white' : 'text.primary' }}>
            {highPriorityAlerts}
            </Typography>
          <Typography variant="body2" sx={{ color: highPriorityAlerts > 0 ? 'white' : 'text.secondary' }}>
            High Priority
            </Typography>
          </Card>
        <Card sx={{ p: 2, flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {alerts.length}
            </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Active Alerts
            </Typography>
          </Card>
      </Stack>

      {/* Tabs and Filters */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label={`All (${notifications.length + alerts.length})`} />
            <Tab 
              label={
                <Badge badgeContent={criticalAlerts + highPriorityAlerts} color="error">
                  Fleet Alerts
                </Badge>
              }
            />
            <Tab 
              label={
                <Badge badgeContent={unreadNotifications} color="primary">
                  System Notifications
                </Badge>
              }
            />
          </Tabs>
        </Box>
        
        <Stack direction="row" spacing={2} sx={{ p: 2 }} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
              />
            }
            label="Show unread only"
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon />}
            onClick={() => {
              // Cycle through filter types
              const types = ['all', 'info', 'warning', 'error', 'alerts'];
              const currentIndex = types.indexOf(filterType);
              setFilterType(types[(currentIndex + 1) % types.length]);
            }}
          >
            Filter: {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Button>
        </Stack>
      </Card>

      {/* Content based on active tab */}
      {tabValue === 0 && (
          <Card>
            <List>
            {/* Show critical alerts first */}
            {filteredAlerts
              .filter(alert => alert.severity === 'critical')
              .map((alert, index) => (
                <React.Fragment key={`alert-${alert.id}`}>
                  <ListItem
                    sx={{
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                      '&:hover': { bgcolor: 'error.main' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        {getAlertIcon(alert.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            CRITICAL: {alert.type.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Chip label={alert.severity.toUpperCase()} color="error" size="small" />
                          {alert.vehicleId && (
                            <Chip label={`Vehicle ${alert.vehicleId}`} variant="outlined" size="small" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: 'inherit', mb: 1 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.8 }}>
                            {formatTimestamp(alert.timestamp)}
                            {alert.location && (
                              <> • Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</>
                            )}
                        </Typography>
                      </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        {alert.requiresAction && (
                          <Button variant="contained" size="small" color="warning">
                            Take Action
                          </Button>
                        )}
                        <IconButton 
                          onClick={() => handleClearAlert(alert.id)}
                          sx={{ color: 'inherit' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredAlerts.filter(a => a.severity === 'critical').length - 1 && <Divider />}
                </React.Fragment>
              ))}

            {/* Then show other alerts */}
            {filteredAlerts
              .filter(alert => alert.severity !== 'critical')
              .map((alert, index) => (
                <React.Fragment key={`alert-${alert.id}`}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getSeverityColor(alert.severity)}.main` }}>
                        {getAlertIcon(alert.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Chip 
                            label={alert.severity.toUpperCase()} 
                            color={getSeverityColor(alert.severity) as any} 
                            size="small"
                          />
                          {alert.vehicleId && (
                            <Chip label={`Vehicle ${alert.vehicleId}`} variant="outlined" size="small" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {alert.message}
                          </Typography>
                            <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(alert.timestamp)}
                            {alert.location && (
                              <> • Location: {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleClearAlert(alert.id)}>
                        <CloseIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredAlerts.filter(a => a.severity !== 'critical').length - 1 && <Divider />}
                </React.Fragment>
              ))}

            {/* Then show notifications */}
            {filteredNotifications.map((notification, index) => (
              <React.Fragment key={`notification-${notification.id}`}>
                <ListItem
                  sx={{ 
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    opacity: notification.isRead ? 0.7 : 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${notification.type}.main` }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ fontWeight: notification.isRead ? 400 : 600 }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.isRead && (
                          <Chip label="NEW" color="primary" size="small" />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(notification.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1}>
                      {notification.actionUrl && (
                        <Button variant="outlined" size="small">
                          View Details
                        </Button>
                      )}
                      {!notification.isRead && (
                        <IconButton onClick={() => handleMarkAsRead(notification.id)}>
                          <MarkReadIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
              </React.Fragment>
              ))}
            </List>
            
          {filteredAlerts.length === 0 && filteredNotifications.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No notifications found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                You're all caught up! New alerts and notifications will appear here.
                </Typography>
              </Box>
            )}
          </Card>
      )}

      {tabValue === 1 && (
        <Card>
          {/* Fleet Alerts Tab Content - similar structure but filtered for alerts only */}
          <Typography sx={{ p: 2 }}>Fleet Alerts content (filtered alerts)</Typography>
            </Card>
      )}

      {tabValue === 2 && (
        <Card>
          {/* System Notifications Tab Content - similar structure but filtered for notifications only */}
          <Typography sx={{ p: 2 }}>System Notifications content (filtered notifications)</Typography>
            </Card>
      )}

      {/* Notification Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                />
              }
              label="Sound notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.desktopNotifications}
                  onChange={(e) => setSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                />
              }
              label="Desktop notifications"
            />
            <Divider />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Alert Types</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.fuelTheftAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, fuelTheftAlerts: e.target.checked }))}
                />
              }
              label="Fuel theft alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.maintenanceReminders}
                  onChange={(e) => setSettings(prev => ({ ...prev, maintenanceReminders: e.target.checked }))}
                />
              }
              label="Maintenance reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.routeDeviations}
                  onChange={(e) => setSettings(prev => ({ ...prev, routeDeviations: e.target.checked }))}
                />
              }
              label="Route deviation alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emergencyAlerts}
                  onChange={(e) => setSettings(prev => ({ ...prev, emergencyAlerts: e.target.checked }))}
                />
              }
              label="Emergency alerts"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.systemUpdates}
                  onChange={(e) => setSettings(prev => ({ ...prev, systemUpdates: e.target.checked }))}
                />
              }
              label="System updates"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setSettingsOpen(false);
              // Save settings to localStorage
              localStorage.setItem('fleetflow-notification-settings', JSON.stringify(settings));
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}