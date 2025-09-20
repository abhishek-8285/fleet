import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { apiService } from './api'

interface OfflineAction {
  id: string
  type: 'location' | 'photo' | 'trip_status' | 'fuel_record'
  data: any
  timestamp: string
  retryCount: number
  maxRetries: number
}

interface PhotoMetadata {
  uri: string
  type: 'fuel' | 'delivery' | 'qr'
  timestamp: string
  uploaded: boolean
  tripId?: string
}

interface LocationPing {
  tripId?: string
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

class OfflineSyncService {
  private isOnline: boolean = false
  private syncInProgress: boolean = false
  private readonly API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8080'

  constructor() {
    this.initializeNetworkListener()
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline
      this.isOnline = state.isConnected || false
      
      if (wasOffline && this.isOnline) {
        // Just came online, trigger sync
        this.syncOfflineData()
      }
    })

    // Check initial state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected || false
    })
  }

  async addOfflineAction(type: OfflineAction['type'], data: any) {
    const action: OfflineAction = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    }

    const actions = await this.getOfflineActions()
    actions.push(action)
    await AsyncStorage.setItem('offlineActions', JSON.stringify(actions))

    // Try immediate sync if online
    if (this.isOnline) {
      await this.syncOfflineData()
    }
  }

  private async getOfflineActions(): Promise<OfflineAction[]> {
    const actionsString = await AsyncStorage.getItem('offlineActions')
    return actionsString ? JSON.parse(actionsString) : []
  }

  private async saveOfflineActions(actions: OfflineAction[]) {
    await AsyncStorage.setItem('offlineActions', JSON.stringify(actions))
  }

  async syncOfflineData() {
    if (this.syncInProgress || !this.isOnline) return

    this.syncInProgress = true

    try {
      // Sync offline actions
      await this.syncOfflineActions()
      
      // Sync photos
      await this.syncOfflinePhotos()
      
      // Sync locations
      await this.syncOfflineLocations()
      
      console.log('Offline sync completed successfully')
    } catch (error) {
      console.error('Offline sync failed:', error)
    }

    this.syncInProgress = false
  }

  private async syncOfflineActions() {
    const actions = await this.getOfflineActions()
    const token = await AsyncStorage.getItem('token')

    if (!token || actions.length === 0) return

    const successfulActions: string[] = []

    for (const action of actions) {
      try {
        let success = false

        switch (action.type) {
          case 'trip_status':
            success = await this.syncTripStatus(action.data, token)
            break
          case 'fuel_record':
            success = await this.syncFuelRecord(action.data, token)
            break
        }

        if (success) {
          successfulActions.push(action.id)
        } else {
          action.retryCount++
        }
      } catch (error) {
        action.retryCount++
        console.error(`Failed to sync action ${action.id}:`, error)
      }
    }

    // Remove successful actions and failed actions that exceeded max retries
    const remainingActions = actions.filter(action => 
      !successfulActions.includes(action.id) && action.retryCount < action.maxRetries
    )

    await this.saveOfflineActions(remainingActions)
  }

  private async syncTripStatus(data: any, token: string): Promise<boolean> {
    try {
      let result
      
      switch (data.status) {
        case 'started':
          result = await apiService.startTrip(data.tripId)
          break
        case 'completed':
          result = await apiService.completeTrip(data.tripId, {
            deliveredAt: data.timestamp,
            proofOfDelivery: data.deliveryPhoto ? [data.deliveryPhoto] : [],
            deliveryNotes: data.notes || ''
          })
          break
        case 'paused':
          result = await apiService.pauseTrip(data.tripId)
          break
        case 'resumed':
          result = await apiService.resumeTrip(data.tripId)
          break
        default:
          return false
      }
      
      return result?.success || false
    } catch (error) {
      console.error('Error syncing trip status:', error)
      return false
    }
  }

  private async syncFuelRecord(data: any, token: string): Promise<boolean> {
    try {
      const fuelEvent = {
        liters: data.liters,
        amountINR: data.amount,
        odometerKm: data.odometer,
        fuelType: 'DIESEL',
        location: data.location,
        stationName: data.stationName || 'Unknown Station',
        receiptPhotoURL: data.receiptPhoto,
        vehicleId: parseInt(data.vehicleId),
        tripId: data.tripId ? parseInt(data.tripId) : undefined
      }
      
      const result = await apiService.createFuelEvent(fuelEvent)
      return result?.success || false
    } catch (error) {
      console.error('Error syncing fuel record:', error)
      return false
    }
  }

  private async syncOfflinePhotos() {
    const photosString = await AsyncStorage.getItem('offlinePhotos')
    if (!photosString) return

    const photos: PhotoMetadata[] = JSON.parse(photosString)
    const token = await AsyncStorage.getItem('token')

    if (!token) return

    const syncedPhotos: string[] = []

    for (const photo of photos) {
      if (photo.uploaded) continue

      try {
        const success = await this.uploadPhoto(photo, token)
        if (success) {
          photo.uploaded = true
          syncedPhotos.push(photo.uri)
        }
      } catch (error) {
        console.error(`Failed to upload photo ${photo.uri}:`, error)
      }
    }

    if (syncedPhotos.length > 0) {
      await AsyncStorage.setItem('offlinePhotos', JSON.stringify(photos))
    }
  }

  private async uploadPhoto(photo: PhotoMetadata, token: string): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('photo', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: photo.uri.split('/').pop()
      } as any)
      formData.append('type', photo.type)
      formData.append('tripId', photo.tripId || '')
      formData.append('timestamp', photo.timestamp)

      const response = await fetch(`${this.API_BASE}/api/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  private async syncOfflineLocations() {
    const locationsString = await AsyncStorage.getItem('offlineLocations')
    if (!locationsString) return

    const locations: LocationPing[] = JSON.parse(locationsString)
    const token = await AsyncStorage.getItem('token')

    if (!token || locations.length === 0) return

    try {
      // Convert to API format
      const apiLocations = locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        timestamp: loc.timestamp,
        tripId: loc.tripId ? parseInt(loc.tripId) : undefined
      }))

      const result = await apiService.sendLocationBatch(apiLocations)

      if (result.success) {
        // Clear synced locations
        await AsyncStorage.setItem('offlineLocations', '[]')
        console.log(`Synced ${locations.length} locations successfully`)
      } else {
        console.error('Failed to sync locations:', result.error)
      }
    } catch (error) {
      console.error('Failed to sync locations:', error)
    }
  }

  // Trip management methods
  async startTrip(tripId: string, location: { lat: number, lng: number }) {
    const tripData = {
      tripId,
      status: 'started',
      timestamp: new Date().toISOString(),
      location
    }

    await this.addOfflineAction('trip_status', tripData)
  }

  async completeTrip(tripId: string, location: { lat: number, lng: number }, deliveryPhoto?: string) {
    const tripData = {
      tripId,
      status: 'completed',
      timestamp: new Date().toISOString(),
      location,
      deliveryPhoto
    }

    await this.addOfflineAction('trip_status', tripData)
  }

  async recordFuelPurchase(data: {
    vehicleId: string
    liters: number
    amount: number
    location: string
    receiptPhoto?: string
    odometer: number
  }) {
    const fuelData = {
      ...data,
      timestamp: new Date().toISOString()
    }

    await this.addOfflineAction('fuel_record', fuelData)
  }

  // Storage management
  async getStorageUsage() {
    try {
      const [actions, photos, locations] = await Promise.all([
        AsyncStorage.getItem('offlineActions'),
        AsyncStorage.getItem('offlinePhotos'),
        AsyncStorage.getItem('offlineLocations')
      ])

      const actionSize = actions ? actions.length : 0
      const photoSize = photos ? photos.length : 0
      const locationSize = locations ? locations.length : 0

      const photoCount = photos ? JSON.parse(photos).length : 0
      const locationCount = locations ? JSON.parse(locations).length : 0
      const actionCount = actions ? JSON.parse(actions).length : 0

      return {
        totalSize: actionSize + photoSize + locationSize,
        photos: { count: photoCount, size: photoSize },
        locations: { count: locationCount, size: locationSize },
        actions: { count: actionCount, size: actionSize }
      }
    } catch (error) {
      return { totalSize: 0, photos: { count: 0, size: 0 }, locations: { count: 0, size: 0 }, actions: { count: 0, size: 0 } }
    }
  }

  async clearOldData(daysOld: number = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Clear old actions
    const actions = await this.getOfflineActions()
    const recentActions = actions.filter(action => 
      new Date(action.timestamp) > cutoffDate
    )
    await this.saveOfflineActions(recentActions)

    // Clear old locations
    const locationsString = await AsyncStorage.getItem('offlineLocations')
    if (locationsString) {
      const locations = JSON.parse(locationsString)
      const recentLocations = locations.filter((location: LocationPing) =>
        new Date(location.timestamp) > cutoffDate
      )
      await AsyncStorage.setItem('offlineLocations', JSON.stringify(recentLocations))
    }
  }

  isConnected(): boolean {
    return this.isOnline
  }

  async forcSync() {
    await this.syncOfflineData()
  }
}

export default new OfflineSyncService()
