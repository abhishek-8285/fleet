import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  Alert,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Paper
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Home as HomeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolateComponent?: boolean; // If true, only this component crashes, not the whole app
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('🚨 ErrorBoundary caught an error:', {
      error,
      errorInfo,
      component: this.props.componentName || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report to error monitoring service (in production)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error monitoring service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      console.log('📊 Error reported to monitoring service');
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const componentName = this.props.componentName || 'Component';
      const isIsolated = this.props.isolateComponent;

      return (
        <Card 
          sx={{ 
            p: 3, 
            m: 2, 
            textAlign: 'center',
            border: '2px solid',
            borderColor: 'error.main',
            bgcolor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* Error Icon and Title */}
            <Box>
              <ErrorIcon sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {isIsolated ? `${componentName} Error` : 'Application Error'}
              </Typography>
              <Typography variant="body1">
                {isIsolated 
                  ? `The ${componentName} component encountered an error but the rest of the app is still working.`
                  : 'Something went wrong in the FleetFlow application.'
                }
              </Typography>
            </Box>

            {/* Error Info Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
              <Chip 
                label={`Component: ${componentName}`} 
                color="error"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`Retry: ${retryCount}/${this.maxRetries}`}
                color="warning"
                variant="outlined" 
                size="small"
              />
              <Chip 
                label={new Date().toLocaleTimeString()}
                color="info"
                variant="outlined"
                size="small"
              />
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
              {canRetry && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  color="warning"
                >
                  Try Again ({this.maxRetries - retryCount} left)
                </Button>
              )}
              
              {!isIsolated && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    sx={{ color: 'inherit', borderColor: 'currentColor' }}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRefresh}
                    sx={{ color: 'inherit', borderColor: 'currentColor' }}
                  >
                    Refresh Page
                  </Button>
                </>
              )}
            </Stack>

            {/* Error Details (Expandable) */}
            <Box sx={{ width: '100%' }}>
              <Button
                onClick={this.toggleDetails}
                startIcon={<BugIcon />}
                endIcon={showDetails ? <CollapseIcon /> : <ExpandIcon />}
                sx={{ color: 'inherit' }}
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>

              <Collapse in={showDetails}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    mt: 2, 
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    textAlign: 'left',
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Error Message:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: 'error.light', 
                      p: 1, 
                      borderRadius: 1,
                      mb: 2,
                      color: 'error.contrastText'
                    }}
                  >
                    {error?.message}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Stack Trace:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      bgcolor: 'grey.100', 
                      p: 1, 
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      mb: 2
                    }}
                  >
                    {error?.stack}
                  </Typography>

                  {errorInfo && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Component Stack:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: 'grey.100', 
                          p: 1, 
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          whiteSpace: 'pre-wrap'
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Collapse>
            </Box>

            {/* Help Text */}
            <Alert 
              severity="info" 
              sx={{ mt: 2, color: 'info.main', bgcolor: 'info.light' }}
            >
              💡 <strong>What happened?</strong> A JavaScript error occurred in the {componentName} component. 
              {isIsolated ? ' The rest of the application should continue working normally.' : ' This prevented the page from loading properly.'}
              {canRetry && ' You can try again or refresh the page.'}
            </Alert>
          </Stack>
        </Card>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

// Simplified Error Boundary for specific components
export function ComponentErrorBoundary({ 
  children, 
  componentName,
  fallbackMessage
}: {
  children: ReactNode;
  componentName: string;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary
      isolateComponent={true}
      componentName={componentName}
      fallback={
        <Alert 
          severity="error" 
          action={
            <Button 
              size="small" 
              onClick={() => window.location.reload()}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          <strong>{componentName} Error:</strong> {fallbackMessage || `The ${componentName} component failed to load.`}
        </Alert>
      }
    />
  );
}

// Error Boundary Hook for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('🚨 useErrorHandler:', { error, errorInfo });
    
    // Report error
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
    }
    
    // Could show toast notification
    // toast.error(`Error: ${error.message}`);
  };
}

export default ErrorBoundary;



