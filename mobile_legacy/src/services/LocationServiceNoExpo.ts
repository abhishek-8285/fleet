import { Platform, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService } from './api'

// Location service WITHOUT any expo-location dependency
export interface LocationData {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
  speed?: number
  heading?: number
}

class LocationServiceNoExpo {
  private static instance: LocationServiceNoExpo
  private isTracking: boolean = false
  private listeners: Array<(isTracking: boolean) => void> = []
  private lastKnownLocation: LocationData | null = null
  private mockTrackingInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Pure JavaScript implementation - no expo dependencies
  }

  public static getInstance(): LocationServiceNoExpo {
    if (!LocationServiceNoExpo.instance) {
      LocationServiceNoExpo.instance = new LocationServiceNoExpo()
    }
    return LocationServiceNoExpo.instance
  }

  public async getCurrentLocation(): Promise<LocationData | null> {
    try {
      console.log('📍 Getting current location (mock mode)...')
      
      // Try browser geolocation API if available (for web)
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: Date.now(),
                accuracy: position.coords.accuracy || undefined,
                speed: position.coords.speed || undefined,
                heading: position.coords.heading || undefined
              }
              this.lastKnownLocation = locationData
              console.log('✅ Browser location obtained:', locationData)
              resolve(locationData)
            },
            (error) => {
              console.log('🔴 Browser geolocation failed:', error)
              const mockLocation = this.getMockLocation()
              resolve(mockLocation)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          )
        })
      }

      // Fallback to mock location
      const mockLocation = this.getMockLocation()
      this.lastKnownLocation = mockLocation
      console.log('✅ Mock location provided:', mockLocation)
      return mockLocation
    } catch (error) {
      console.log('🔴 Failed to get current location:', error)
      return this.getMockLocation()
    }
  }

  public async startSimpleTracking(): Promise<boolean> {
    try {
      if (this.isTracking) {
        console.log('📍 Location tracking already active')
        return true
      }

      console.log('📍 Starting location tracking (mock mode for permissions compliance)...')

      // Start mock tracking with periodic updates
      this.mockTrackingInterval = setInterval(async () => {
        if (!this.isTracking) return

        const location = await this.getCurrentLocation()
        if (location) {
          await this.handleLocationUpdate(location)
        }
      }, 30000) // Every 30 seconds

      this.isTracking = true
      this.notifyListeners()
      
      // Send initial location
      const initialLocation = await this.getCurrentLocation()
      if (initialLocation) {
        await this.handleLocationUpdate(initialLocation)
      }

      console.log('✅ Mock location tracking started')
      return true
    } catch (error) {
      console.error('🔴 Failed to start location tracking:', error)
      console.error('🔴 Error details:', error.message || error)
      this.isTracking = false
      this.notifyListeners()
      return false
    }
  }

  private getMockLocation(): LocationData {
    // Generate realistic mock coordinates that move slightly
    const baseLatitude = 37.7749  // San Francisco
    const baseLongitude = -122.4194
    
    // Add small random movement to simulate driving
    const latOffset = (Math.random() - 0.5) * 0.001 // ~100m movement
    const lngOffset = (Math.random() - 0.5) * 0.001
    
    return {
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      timestamp: Date.now(),
      accuracy: 5 + Math.random() * 10, // 5-15 meter accuracy
      speed: Math.random() * 20, // 0-20 m/s (0-72 km/h)
      heading: Math.random() * 360 // 0-360 degrees
    }
  }

  private async handleLocationUpdate(location: LocationData) {
    try {
      this.lastKnownLocation = location
      
      console.log('📍 Location update:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy
      })
      
      // Store offline
      await this.storeLocationOffline(location)
      
      // Try to sync to server
      await this.syncLocationToServer(location)
    } catch (error) {
      console.log('🔴 Location update handling failed:', error)
    }
  }

  private async storeLocationOffline(location: LocationData) {
    try {
      const stored = await AsyncStorage.getItem('offlineLocations')
      const locations = stored ? JSON.parse(stored) : []
      locations.push(location)
      
      // Keep only last 50 locations to prevent storage bloat
      if (locations.length > 50) {
        locations.splice(0, locations.length - 50)
      }
      
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(locations))
      console.log('💾 Location stored offline')
    } catch (error) {
      console.log('🔴 Failed to store location offline:', error)
    }
  }

  private async syncLocationToServer(location: LocationData) {
    try {
      const result = await apiService.updateLocation(location)
      if (result.success) {
        console.log('📡 Location synced to server')
      } else {
        console.log('🔴 Failed to sync location:', result.error)
      }
    } catch (error) {
      console.log('🔴 Failed to sync location to server:', error)
    }
  }

  public async stopTracking(): Promise<boolean> {
    try {
      console.log('📍 Stopping location tracking...')

      if (this.mockTrackingInterval) {
        clearInterval(this.mockTrackingInterval)
        this.mockTrackingInterval = null
      }

      this.isTracking = false
      this.notifyListeners()
      
      console.log('✅ Location tracking stopped')
      return true
    } catch (error) {
      console.log('🔴 Failed to stop location tracking:', error)
      this.isTracking = false
      this.notifyListeners()
      return false
    }
  }

  public isTrackingActive(): boolean {
    return this.isTracking
  }

  public getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation
  }

  public addListener(callback: (isTracking: boolean) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isTracking))
  }

  public async cleanup(): Promise<void> {
    try {
      await this.stopTracking()
      this.listeners = []
      console.log('✅ Location service cleaned up')
    } catch (error) {
      console.log('🔴 Location service cleanup failed:', error)
    }
  }

  // Sync offline locations to server
  public async syncOfflineLocations(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offlineLocations')
      if (!stored) return

      const locations: LocationData[] = JSON.parse(stored)
      if (locations.length === 0) return

      console.log(`📡 Syncing ${locations.length} offline locations...`)
      
      let syncedCount = 0
      for (const location of locations) {
        try {
          const result = await apiService.updateLocation(location)
          if (result.success) {
            syncedCount++
          } else {
            break // Stop on first failure to preserve order
          }
        } catch (error) {
          console.log('🔴 Failed to sync location:', error)
          break
        }
      }

      if (syncedCount > 0) {
        // Remove synced locations
        const remaining = locations.slice(syncedCount)
        if (remaining.length > 0) {
          await AsyncStorage.setItem('offlineLocations', JSON.stringify(remaining))
        } else {
          await AsyncStorage.removeItem('offlineLocations')
        }
        console.log(`✅ ${syncedCount} locations synced, ${remaining.length} remaining`)
      }
    } catch (error) {
      console.log('🔴 Failed to sync offline locations:', error)
    }
  }

  // Request user to enable location manually
  public showLocationInstructions(): void {
    Alert.alert(
      'Location Access',
      'This app uses mock locations for development. In production, you can:\n\n' +
      '• Grant location permissions in device settings\n' +
      '• Use browser location on web platform\n' +
      '• Mock locations are used for testing',
      [
        { text: 'OK' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            console.log('📍 User should manually enable location in device settings')
          }
        }
      ]
    )
  }
}

export const locationServiceNoExpo = LocationServiceNoExpo.getInstance()





