// Platform-safe imports for location services
let Location: any = null;
let TaskManager: any = null;
try {
  Location = require('expo-location');
  TaskManager = require('expo-task-manager');
} catch (error) {
  console.warn('Location services not available in this environment');
}
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LOCATION_TASK_NAME = 'fleetflow-location-v2'

interface LocationUpdateData {
  tripId: string | null
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

export class LocationService {
  private static instance: LocationService
  private isInitialized = false
  private isTracking = false
  private listeners: Set<(isTracking: boolean) => void> = new Set()

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  private constructor() {
    this.initialize()
  }

  private async initialize() {
    if (this.isInitialized) return

    try {
      if (!Location) {
        console.log('📍 Location services not available in Expo Go - using mock mode')
        this.isTracking = false
        this.isInitialized = true
        return
      }

      console.log('📍 Initializing location service...')
      this.isTracking = false
      this.isInitialized = true
    } catch (error) {
      console.log('🔴 Failed to initialize location service:', error)
    }
  }

  private async handleLocationUpdate({ data, error }: any) {
    try {
      if (error) {
        console.log('🔴 Location task error:', error)
        return
      }

      const { locations } = data
      if (!locations || locations.length === 0) {
        console.log('📍 No location data received')
        return
      }

      const token = await AsyncStorage.getItem('token')
      const tripId = await AsyncStorage.getItem('currentTripId')
      
      const location = locations[0]
      const locationData: LocationUpdateData = {
        tripId: tripId || null,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date().toISOString()
      }

      console.log('📍 Location update:', locationData)

      // Store offline
      await this.storeLocationOffline(locationData)

      // Send to server
      if (token) {
        await this.sendLocationToServer(locationData, token)
      }
    } catch (taskError) {
      console.log('🔴 Critical error in location task:', taskError)
    }
  }

  private async storeLocationOffline(locationData: LocationUpdateData) {
    try {
      const stored = await AsyncStorage.getItem('offlineLocations') || '[]'
      const locations: LocationUpdateData[] = JSON.parse(stored)
      
      locations.push(locationData)
      
      // Keep only last 100 locations to prevent storage overflow
      if (locations.length > 100) {
        locations.splice(0, locations.length - 100)
      }
      
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations))
    } catch (error) {
      console.log('🔴 Failed to store location offline:', error)
    }
  }

  private async sendLocationToServer(locationData: LocationUpdateData, token: string) {
    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://10.236.156.17:8080'
      
      const response = await fetch(`${API_BASE}/api/v1/location/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(locationData)
      })

      if (response.ok) {
        console.log('✅ Location synced to server')
      } else {
        console.log('⚠️ Server rejected location:', response.status)
      }
    } catch (error) {
      console.log('🔴 Failed to sync location to server:', error)
    }
  }

  public async startTracking(): Promise<boolean> {
    try {
      console.log('📍 Location tracking temporarily disabled for debugging')
      this.isTracking = true
      this.notifyListeners()
      return true
    } catch (error) {
      console.log('🔴 Failed to start location tracking:', error)
      this.isTracking = false
      this.notifyListeners()
      return false
    }
  }

  public async stopTracking(): Promise<boolean> {
    try {
      console.log('🛑 Location tracking temporarily disabled for debugging')
      this.isTracking = false
      this.notifyListeners()
      return true
    } catch (error) {
      console.log('🔴 Failed to stop location tracking:', error)
      return false
    }
  }

  public async isTrackingActive(): Promise<boolean> {
    try {
      console.log('📍 Location tracking check temporarily disabled for debugging')
      return this.isTracking
    } catch (error) {
      console.log('🔴 Failed to check tracking status:', error)
      return false
    }
  }

  public getTrackingStatus(): boolean {
    return this.isTracking
  }

  public addTrackingListener(listener: (isTracking: boolean) => void) {
    this.listeners.add(listener)
    // Immediately notify with current status
    listener(this.isTracking)
  }

  public removeTrackingListener(listener: (isTracking: boolean) => void) {
    this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isTracking))
  }

  public async cleanup() {
    try {
      console.log('🧹 Cleaning up location service...')
      await this.stopTracking()
      this.listeners.clear()
    } catch (error) {
      console.log('🔴 Cleanup error:', error)
    }
  }

  // Test location functionality (temporarily disabled)
  public async testLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      console.log('📍 Location test temporarily disabled for debugging')
      // Return mock coordinates for testing
      const coords = {
        latitude: 37.7749,
        longitude: -122.4194
      }
      console.log('✅ Location test (mock) successful:', coords)
      return coords
    } catch (error) {
      console.log('🔴 Location test failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance()
