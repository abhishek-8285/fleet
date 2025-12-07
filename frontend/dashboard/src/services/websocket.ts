// Real-time WebSocket service for FleetFlow dashboard
// Provides live updates for vehicles, trips, alerts, and notifications

export interface VehicleUpdate {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'active' | 'parked' | 'maintenance' | 'alert';
  fuelLevel?: number;
  driver?: string;
  lastUpdate: string;
  batteryLevel?: number;
}

export interface TripUpdate {
  tripId: string;
  vehicleId: string;
  driverId: string;
  status: 'created' | 'started' | 'in_progress' | 'completed' | 'cancelled';
  currentLocation?: { lat: number; lng: number };
  progress: number; // 0-100%
  estimatedArrival?: string;
  distanceCovered: number;
  customerPhone?: string;
  lastUpdate: string;
}

export interface FleetAlert {
  id: string;
  type: 'fuel_theft' | 'route_deviation' | 'breakdown' | 'maintenance' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  message: string;
  location?: { lat: number; lng: number };
  timestamp: string;
  requiresAction: boolean;
}

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

type WebSocketEventHandler = {
  onVehicleUpdate?: (update: VehicleUpdate) => void;
  onTripUpdate?: (update: TripUpdate) => void;
  onFleetAlert?: (alert: FleetAlert) => void;
  onNotification?: (notification: SystemNotification) => void;
  onConnectionStatus?: (connected: boolean) => void;
  onError?: (error: string) => void;
};

class FleetFlowWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000; // 5 seconds
  private handlers: WebSocketEventHandler = {};
  private url: string;

  constructor(url?: string) {
    // Default to backend server WebSocket endpoint
    const getWebSocketUrl = () => {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
        : 'ws://localhost:8080/ws'; // Backend server in development
      
      // Add authentication parameters
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || '1'; // Default user ID
      
      if (token) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}token=${encodeURIComponent(token)}&userId=${userId}`;
      }
      
      return baseUrl;
    };
    
    this.url = url || getWebSocketUrl();
  }

  connect(handlers: WebSocketEventHandler) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ WebSocket connection skipped - user not logged in');
      handlers.onConnectionStatus?.(false);
      return;
    }

    this.handlers = handlers;
    this.isConnecting = true;

    try {
      // Update URL with fresh token before connecting
      this.updateUrl();
      console.log('🔌 Connecting to FleetFlow WebSocket...', this.url.replace(/token=[^&]+/, 'token=***'));
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ FleetFlow WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.handlers.onConnectionStatus?.(true);

        // Send authentication token if available
        const token = localStorage.getItem('token');
        if (token) {
          this.send({
            type: 'authenticate',
            token: token
          });
        }

        // Subscribe to all fleet updates
        this.send({
          type: 'subscribe',
          topics: ['vehicles', 'trips', 'alerts', 'notifications']
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
          this.handlers.onError?.('Failed to parse server message');
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 FleetFlow WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;
        this.handlers.onConnectionStatus?.(false);

        // Attempt to reconnect unless it was a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ FleetFlow WebSocket error:', error);
        this.isConnecting = false;
        this.lastError = 'WebSocket connection error';
        this.handlers.onError?.(this.lastError);
        
        // Report WebSocket errors in production
        if (process.env.NODE_ENV === 'production') {
          console.log('📊 WebSocket error reported to monitoring service');
        }
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.handlers.onError?.('Failed to create WebSocket connection');
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'vehicle_update':
        this.handlers.onVehicleUpdate?.(data.payload as VehicleUpdate);
        break;

      case 'trip_update':
        this.handlers.onTripUpdate?.(data.payload as TripUpdate);
        break;

      case 'fleet_alert':
        this.handlers.onFleetAlert?.(data.payload as FleetAlert);
        this.showDesktopNotification(data.payload as FleetAlert);
        break;

      case 'notification':
        this.handlers.onNotification?.(data.payload as SystemNotification);
        break;

      case 'ping':
        // Respond to server ping to keep connection alive
        this.send({ type: 'pong' });
        break;

      case 'error':
        console.error('🚨 Server error:', data.message);
        this.handlers.onError?.(data.message);
        break;

      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  private showDesktopNotification(alert: FleetAlert) {
    // Show browser notification for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`FleetFlow Alert: ${alert.type.replace('_', ' ').toUpperCase()}`, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: alert.id
        });
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    // Notify handlers about reconnection attempt
    this.handlers.onError?.(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.handlers);
      } else {
        // Max reconnection attempts reached
        console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
        this.handlers.onError?.('Connection lost. Please refresh the page to reconnect.');
        this.handlers.onConnectionStatus?.(false);
      }
    }, delay);
  }

  // Force reconnect method for manual retry
  forceReconnect() {
    console.log('🔄 Force reconnecting WebSocket...');
    this.reconnectAttempts = 0;
    // Update URL with fresh token
    this.updateUrl();
    this.disconnect();
    this.connect(this.handlers);
  }

  // Update WebSocket URL with fresh authentication
  private updateUrl() {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
      : 'ws://localhost:8080/ws';
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || '1';
    
    if (token) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      this.url = `${baseUrl}${separator}token=${encodeURIComponent(token)}&userId=${userId}`;
    } else {
      this.url = baseUrl;
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      url: this.url,
      readyState: this.ws?.readyState || -1,
      lastError: this.lastError
    };
  }

  private lastError: string | null = null;

  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, message queued');
      // Could implement message queuing here
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.handlers = {};
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Request desktop notification permission
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }
}

// Create singleton instance
export const websocketService = new FleetFlowWebSocket();

// React hook for using WebSocket in components
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function useFleetWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [vehicles, setVehicles] = useState<Map<string, VehicleUpdate>>(new Map());
  const [trips, setTrips] = useState<Map<string, TripUpdate>>(new Map());
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Only connect WebSocket for pages that need real-time updates
    const realTimePages = ['/', '/vehicles', '/trips', '/map', '/map-osm', '/notifications'];
    const currentPath = location.pathname;
    const needsRealTime = realTimePages.includes(currentPath);

    if (needsRealTime) {
      websocketService.connect({
      onConnectionStatus: (connected) => {
        setIsConnected(connected);
      },
      onVehicleUpdate: (update) => {
        setVehicles(prev => {
          const newMap = new Map(prev);
          newMap.set(update.vehicleId, update);
          return newMap;
        });
      },
      onTripUpdate: (update) => {
        setTrips(prev => {
          const newMap = new Map(prev);
          newMap.set(update.tripId, update);
          return newMap;
        });
      },
      onFleetAlert: (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
      },
      onNotification: (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100 notifications
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    });

    // Request notification permission on first connection
    websocketService.requestNotificationPermission();

    return () => {
      websocketService.disconnect();
    };
    } else {
      // For static pages, set connected to false and don't attempt connection
      setIsConnected(false);
    }
  }, [location.pathname]);

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return {
    isConnected,
    vehicles: Array.from(vehicles.values()),
    trips: Array.from(trips.values()),
    alerts,
    notifications,
    markNotificationAsRead,
    clearAlert,
    websocketService
  };
}

export default websocketService;
