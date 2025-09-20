import AsyncStorage from '@react-native-async-storage/async-storage'

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export interface TripUpdate {
  tripId: number
  status: string
  message: string
  timestamp: string
  data?: any
}

export interface LocationUpdate {
  driverId: number
  vehicleId: number
  latitude: number
  longitude: number
  timestamp: string
}

export interface NotificationMessage {
  id: string
  type: 'NEW_TRIP' | 'TRIP_UPDATE' | 'FUEL_ALERT' | 'EMERGENCY' | 'SYSTEM'
  title: string
  message: string
  data?: any
  timestamp: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

type EventHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private isConnected = false
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 5000
  private eventHandlers: Map<string, EventHandler[]> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []

  private async getWebSocketUrl(): Promise<string> {
    const wsBase = process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://10.108.107.17:8080/api/v1/ws'
    const token = await AsyncStorage.getItem('token')
    const user = await AsyncStorage.getItem('user')
    
    if (!token || !user) {
      return wsBase
    }
    
    const userData = JSON.parse(user)
    const userId = userData.id || 1
    
    return `${wsBase}?token=${token}&userId=${userId}&userType=driver`
  }

  async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      return this.isConnected
    }

    try {
      this.isConnecting = true
      const token = await AsyncStorage.getItem('token')
      const user = await AsyncStorage.getItem('user')
      
      if (!token || !user) {
        console.log('No authentication token found')
        this.isConnecting = false
        return false
      }

      const parsedUser = JSON.parse(user)
      const wsUrl = `${this.getWebSocketUrl()}?token=${encodeURIComponent(token)}&userId=${parsedUser.id}&userType=driver`
      
      console.log('Connecting to WebSocket:', wsUrl)
      this.ws = new WebSocket(wsUrl)

      return new Promise((resolve) => {
        if (!this.ws) {
          resolve(false)
          return
        }

        this.ws.onopen = () => {
          console.log('WebSocket connected successfully')
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.emit('connected', { connected: true })
          resolve(true)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.handleDisconnection()
          resolve(false)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.handleDisconnection()
          resolve(false)
        }

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false
            this.ws?.close()
            resolve(false)
          }
        }, 10000)
      })
    } catch (error) {
      console.error('WebSocket connection error:', error)
      this.isConnecting = false
      return false
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
    this.emit('disconnected', { connected: false })
  }

  private handleDisconnection(): void {
    this.isConnected = false
    this.isConnecting = false

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.emit('disconnected', { connected: false })

    // Auto reconnect with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts)
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
      
      setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    } else {
      console.log('Max reconnection attempts reached')
      this.emit('reconnection_failed', { attempts: this.reconnectAttempts })
    }
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data)
      console.log('WebSocket message received:', message.type)

      switch (message.type) {
        case 'trip_assignment':
          this.emit('trip_assigned', message.data)
          break
        case 'trip_update':
          this.emit('trip_updated', message.data)
          break
        case 'trip_cancelled':
          this.emit('trip_cancelled', message.data)
          break
        case 'notification':
          this.emit('notification', message.data)
          break
        case 'location_request':
          this.emit('location_request', message.data)
          break
        case 'fuel_alert':
          this.emit('fuel_alert', message.data)
          break
        case 'emergency_response':
          this.emit('emergency_response', message.data)
          break
        case 'system_message':
          this.emit('system_message', message.data)
          break
        case 'pong':
          // Heartbeat response
          break
        default:
          console.log('Unknown message type:', message.type)
          this.emit('unknown_message', message)
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send('ping', { timestamp: new Date().toISOString() })
      }
    }, 30000) // Send ping every 30 seconds
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  send(type: string, data: any): void {
    const message: WebSocketMessage = {
      type,
      data,
      timestamp: new Date().toISOString()
    }

    if (this.isConnected) {
      this.sendMessage(message)
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
      
      // Attempt to connect if not already connecting
      if (!this.isConnecting) {
        this.connect()
      }
    }
  }

  private sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
        this.messageQueue.unshift(message) // Put back in queue
      }
    }
  }

  // Event handling
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)?.push(handler)
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // Driver-specific methods
  sendLocationUpdate(location: LocationUpdate): void {
    this.send('location_update', location)
  }

  sendTripStatusUpdate(tripId: number, status: string, data?: any): void {
    this.send('trip_status_update', {
      tripId,
      status,
      timestamp: new Date().toISOString(),
      ...data
    })
  }

  sendDriverStatusUpdate(status: string): void {
    this.send('driver_status_update', {
      status,
      timestamp: new Date().toISOString()
    })
  }

  sendEmergencyAlert(location: { latitude: number, longitude: number }): void {
    this.send('emergency_alert', {
      ...location,
      timestamp: new Date().toISOString(),
      type: 'PANIC_BUTTON'
    })
  }

  // Utility methods
  isWebSocketConnected(): boolean {
    return this.isConnected
  }

  getConnectionStatus(): {
    connected: boolean
    connecting: boolean
    reconnectAttempts: number
    queuedMessages: number
  } {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    }
  }

  // Subscribe to specific trip updates
  subscribeToTrip(tripId: number): void {
    this.send('subscribe_trip', { tripId })
  }

  unsubscribeFromTrip(tripId: number): void {
    this.send('unsubscribe_trip', { tripId })
  }

  // Request immediate location update from fleet manager
  requestLocationUpdate(): void {
    this.send('location_update_request', {
      timestamp: new Date().toISOString()
    })
  }
}

export const webSocketService = new WebSocketService()
export default webSocketService
