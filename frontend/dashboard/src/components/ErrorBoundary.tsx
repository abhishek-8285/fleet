import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { trace } from '@opentelemetry/api';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    // Log to OpenTelemetry
    const span = trace.getTracer('react-error-boundary').startSpan('ui.error');
    span.recordException(error);
    span.setAttribute('component.stack', errorInfo.componentStack);
    if (this.props.componentName) {
      span.setAttribute('component.name', this.props.componentName);
    }
    span.end();
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback message if provided, else use default localized message
      const title = this.props.componentName
        ? `Error in ${this.props.componentName}`
        : 'Something went wrong / कुछ गलत हो गया';

      const message = this.props.fallbackMessage
        ? this.props.fallbackMessage
        : 'We successfully logged this error. Please try reloading.\nहमने इस त्रुटि को लॉग कर लिया है। कृपया पुनः लोड करने का प्रयास करें।';

      return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <WarningIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {message.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.location.reload()}
              >
                Reload / पुनः लोड करें
              </Button>
            </Box>
            {import.meta.env.DEV && this.state.error && (
              <Box sx={{ mt: 4, textAlign: 'left', bgcolor: '#f5f5f5', p: 2, overflow: 'auto' }}>
                <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

// Named export alias for backward compatibility
export const ComponentErrorBoundary = ErrorBoundary;

// Default export
export default ErrorBoundary;
