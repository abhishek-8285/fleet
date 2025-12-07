import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Stack
} from '@mui/material';
import { 
  BugReport as BugIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFleetWebSocket } from '../services/websocket';
import { checkApiConnection, getApiHealth } from '../api';

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false);
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  
  const { isConnected, websocketService } = useFleetWebSocket();
  
  const checkSystemStatus = async () => {
    setChecking(true);
    try {
      const health = await getApiHealth();
      setApiHealth(health);
      console.log('🏥 System Health Check:', health);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setApiHealth({ error: error.message || 'Health check failed' });
    } finally {
      setChecking(false);
    }
  };

  const wsStats = websocketService?.getConnectionStats();

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide debug panel in production
  }

  return (
    <Card sx={{ 
      position: 'fixed', 
      bottom: 16, 
      right: 16, 
      zIndex: 9999,
      minWidth: 300,
      maxWidth: 500
    }}>
      <Box sx={{ p: 2 }}>
        <Button
          onClick={() => setExpanded(!expanded)}
          startIcon={<BugIcon />}
          endIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
          variant="outlined"
          size="small"
          fullWidth
        >
          Debug Panel
        </Button>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            
            {/* System Status */}
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              System Status
            </Typography>
            
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">API Connection:</Typography>
                <Chip 
                  label={apiHealth?.status || 'Unknown'} 
                  color={apiHealth?.status === 'healthy' ? 'success' : 'error'} 
                  size="small" 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">WebSocket:</Typography>
                <Chip 
                  label={isConnected ? 'Connected' : 'Disconnected'} 
                  color={isConnected ? 'success' : 'error'} 
                  size="small" 
                />
              </Box>
              
              {apiHealth?.responseTime && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Response Time:</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {apiHealth.responseTime}ms
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* WebSocket Stats */}
            {wsStats && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  WebSocket Details
                </Typography>
                <Table size="small" sx={{ mb: 2 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell>Reconnect Attempts</TableCell>
                      <TableCell>{wsStats.reconnectAttempts}/{wsStats.maxReconnectAttempts}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ready State</TableCell>
                      <TableCell>
                        {wsStats.readyState === 0 && 'CONNECTING'}
                        {wsStats.readyState === 1 && 'OPEN'}
                        {wsStats.readyState === 2 && 'CLOSING'}
                        {wsStats.readyState === 3 && 'CLOSED'}
                        {wsStats.readyState === -1 && 'NOT_INITIALIZED'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>URL</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {wsStats.url}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button
                onClick={checkSystemStatus}
                variant="outlined"
                size="small"
                disabled={checking}
                startIcon={<RefreshIcon />}
              >
                {checking ? 'Checking...' : 'Check Health'}
              </Button>
              
              <Button
                onClick={() => websocketService?.forceReconnect()}
                variant="outlined"
                size="small"
                disabled={isConnected}
              >
                Reconnect WS
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="outlined"
                size="small"
                color="warning"
              >
                Reload
              </Button>
            </Stack>

            {/* Error Display */}
            {apiHealth?.error && (
              <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
                API Error: {apiHealth.error}
              </Alert>
            )}
            
            {wsStats?.lastError && (
              <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
                WebSocket Error: {wsStats.lastError}
              </Alert>
            )}

            {/* Performance Hints */}
            <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
              💡 If the app is stuck loading:
              <br />• Check Network tab in DevTools
              <br />• Look for failed API calls 
              <br />• Check Console for errors
              <br />• Try refreshing the page
            </Alert>
          </Box>
        </Collapse>
      </Box>
    </Card>
  );
}

export default DebugPanel;



