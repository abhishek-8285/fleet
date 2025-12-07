import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Card,
  Stack,
  Alert,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  WifiOff as OfflineIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';

// Generic Loading Spinner
export function LoadingSpinner({ 
  size = 40, 
  message = 'Loading...', 
  variant = 'indeterminate' 
}: { 
  size?: number;
  message?: string;
  variant?: 'determinate' | 'indeterminate';
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4 
      }}
    >
      <CircularProgress size={size} variant={variant} />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

// Page Loading with FleetFlow Branding
export function PageLoading({ message = 'Loading FleetFlow Dashboard...' }: { message?: string }) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '50vh',
        textAlign: 'center'
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 700, 
          mb: 2,
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent'
        }}
      >
        🚛 FleetFlow India
      </Typography>
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mt: 3, maxWidth: 400 }}
      >
        {message}
      </Typography>
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ mt: 1 }}
      >
        Setting up real-time connections...
      </Typography>
    </Box>
  );
}

// Linear Progress for Operations
export function OperationProgress({ 
  message = 'Processing...', 
  value, 
  showPercentage = false 
}: { 
  message?: string; 
  value?: number;
  showPercentage?: boolean;
}) {
  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        {showPercentage && value !== undefined && (
          <Typography variant="body2" color="text.secondary">
            {Math.round(value)}%
          </Typography>
        )}
      </Stack>
      <LinearProgress 
        variant={value !== undefined ? 'determinate' : 'indeterminate'} 
        value={value}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

// Table Loading Skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
}) {
  return (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={`header-${index}`}>
                  <Skeleton variant="text" width="80%" height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  {colIndex === 0 ? (
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton variant="text" width={120} height={20} />
                        <Skeleton variant="text" width={80} height={16} />
                      </Box>
                    </Stack>
                  ) : (
                    <Skeleton variant="text" width={`${60 + Math.random() * 40}%`} height={20} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Card Loading Skeleton
export function CardSkeleton({ 
  count = 1,
  height = 200,
  showAvatar = true 
}: { 
  count?: number;
  height?: number;
  showAvatar?: boolean;
}) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ p: 3, height }}>
            <Stack spacing={2}>
              {showAvatar && (
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                </Stack>
              )}
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="rectangular" width="100%" height={60} />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Error State with Retry
export function ErrorState({ 
  title = 'Something went wrong',
  message = 'We encountered an error while loading your data.',
  onRetry,
  showRetry = true,
  icon
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 6,
        textAlign: 'center'
      }}
    >
      {icon || <WarningIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {message}
      </Typography>
      {showRetry && onRetry && (
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}

// Connection Status Indicator
export function ConnectionStatus({ 
  isConnected, 
  message,
  onReconnect
}: { 
  isConnected: boolean;
  message?: string;
  onReconnect?: () => void;
}) {
  // In development, only show if backend server should be running
  // In production, always show connection issues
  if (isConnected) return null;
  
  // Less intrusive in development - backend might not be running
  const severity = process.env.NODE_ENV === 'development' ? 'info' : 'warning';

  return (
    <Alert 
      severity={severity}
      icon={<OfflineIcon />}
      action={
        <Button 
          color="inherit" 
          size="small"
          onClick={onReconnect}
        >
          Reconnect
        </Button>
      }
      sx={{ mb: 2 }}
    >
      <strong>Backend Disconnected</strong>
      {message && (
        <>
          <br />
          {message}
        </>
      )}
      {process.env.NODE_ENV === 'development' && (
        <>
          <br />
          <small>💡 Start the Go backend server for real-time features</small>
        </>
      )}
    </Alert>
  );
}

// Empty State
export function EmptyState({ 
  title = 'No data found',
  message = 'There\'s nothing to show here yet.',
  action,
  icon,
  illustration
}: { 
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  illustration?: string;
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 6,
        textAlign: 'center'
      }}
    >
      {illustration ? (
        <Box 
          component="img"
          src={illustration}
          alt="Empty state"
          sx={{ width: 200, height: 200, mb: 2, opacity: 0.6 }}
        />
      ) : (
        icon || <Box sx={{ fontSize: 60, mb: 2, opacity: 0.3 }}>📭</Box>
      )}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {message}
      </Typography>
      {action}
    </Box>
  );
}

// Success State
export function SuccessState({ 
  title = 'Success!',
  message = 'Operation completed successfully.',
  onContinue,
  continueLabel = 'Continue'
}: { 
  title?: string;
  message?: string;
  onContinue?: () => void;
  continueLabel?: string;
}) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        py: 4,
        textAlign: 'center'
      }}
    >
      <SuccessIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ mb: 3, maxWidth: 400 }}
      >
        {message}
      </Typography>
      {onContinue && (
        <Button 
          variant="contained" 
          onClick={onContinue}
          color="success"
        >
          {continueLabel}
        </Button>
      )}
    </Box>
  );
}

// Dashboard Stats Loading
export function StatsLoading({ count = 4 }: { count?: number }) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Skeleton variant="circular" width={50} height={50} sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" width="80%" height={32} sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="60%" height={20} sx={{ mx: 'auto' }} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Map Loading
export function MapLoading({ height = 400 }: { height?: number }) {
  return (
    <Card sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Loading map...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Initializing GPS tracking system
        </Typography>
      </Stack>
    </Card>
  );
}

// Chart Loading
export function ChartLoading({ height = 300 }: { height?: number }) {
  return (
    <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading analytics...
        </Typography>
      </Stack>
    </Box>
  );
}

// Form Loading Overlay
export function FormLoading({ message = 'Saving...', isVisible }: { message?: string; isVisible: boolean }) {
  if (!isVisible) return null;
  
  return (
    <Box 
      sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        borderRadius: 1
      }}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
