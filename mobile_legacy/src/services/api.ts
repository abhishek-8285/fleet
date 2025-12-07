import AsyncStorage from '@react-native-async-storage/async-storage'

// API Configuration
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://10.236.156.17:8080'
const GRPC_BASE = process.env.EXPO_PUBLIC_GRPC_BASE || 'http://10.236.156.17:9090'

console.log('🔧 API Configuration:')
console.log('API_BASE:', API_BASE)
console.log('GRPC_BASE:', GRPC_BASE)

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoginData {
  phone: string
  code: string
}

export interface DriverProfile {
  id: number
  name: string
  phone: string
  email?: string
  licenseNumber?: string
  licenseExpiry?: string
  aadharNumber?: string
  address?: string
  photo?: string
  status: 'AVAILABLE' | 'ON_TRIP' | 'ON_BREAK' | 'OFFLINE' | 'active' | 'inactive' | 'suspended'
  rating?: number
  totalTrips?: number
  completedTrips?: number
  totalDistance?: number
  experience?: number
  joiningDate?: string
  isActive: boolean
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  bankDetails?: {
    accountNumber: string
    ifscCode: string
    bankName: string
    accountHolderName: string
  }
  documents: {
    [key: string]: {
      url: string
      documentNumber?: string
      expiryDate?: string
      uploadedAt: string
      type: string
    }
  }
  profileCompletion?: number
}

export interface Trip {
  id: number
  trackingId: string
  originAddress: string
  destinationAddress: string
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  estimatedDuration: number
  estimatedDistance: number
  customerName?: string
  customerPhone?: string
  paymentAmount?: number
  startedAt?: string
  completedAt?: string
  driverId?: number
  vehicleId?: number
}

export interface LocationPing {
  vehicle_id: number
  driver_id?: number
  latitude: number
  longitude: number
  accuracy: number
  speed?: number
  heading?: number
  timestamp: string
  tripId?: number
}

export interface FuelEvent {
  id?: number
  liters: number
  amountINR: number
  odometerKm: number
  fuelType: string
  location: string
  stationName: string
  receiptPhotoURL?: string
  vehicleId: number
  tripId?: number
}

export interface DriverStats {
  rating: number
  totalTrips: number
  completedTrips: number
  todayEarnings: number
  fuelEfficiency: number
  onTimeDeliveries: number
  customerRatingCount: number
}

class ApiService {
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders()
      const requestConfig = {
        ...options,
        headers: { ...headers, ...options.headers }
      }
      const url = `${API_BASE}${endpoint}`

      // 📝 LOG REQUEST DETAILS
      console.log('🚀 API REQUEST:')
      console.log('   URL:', url)
      console.log('   Method:', requestConfig.method || 'GET')
      console.log('   Headers:', JSON.stringify(requestConfig.headers, null, 2))
      if (requestConfig.body) {
        console.log('   Body:', requestConfig.body)
      }

      const response = await fetch(url, requestConfig)

      // 📝 LOG RESPONSE STATUS
      console.log('📥 API RESPONSE:')
      console.log('   Status:', response.status, response.statusText)
      console.log('   URL:', response.url)
      
      const data = await response.json()
      
      // 📝 LOG RESPONSE DATA
      console.log('   Response Data:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        console.log('❌ API ERROR:', endpoint, 'Status:', response.status)
        return {
          success: false,
          error: data.message || data.error || 'Request failed'
        }
      }

      console.log('✅ API SUCCESS:', endpoint)
      
      // Transform response data for verifyOTP to match expected format
      if (endpoint === '/api/v1/auth/otp/verify' && data.access_token) {
        const transformedData = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          user: data.user
        }
        return {
          success: true,
          data: transformedData
        }
      }
      
      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('🔥 API NETWORK ERROR:')
      console.error('   API_BASE:', API_BASE)
      console.error('   Endpoint:', endpoint)
      console.error('   Full URL:', `${API_BASE}${endpoint}`)
      console.error('   Error:', error)
      console.error('   Error Type:', typeof error === 'object' ? error.constructor.name : typeof error)
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      }
    }
  }

  // Authentication APIs
  async sendOTP(phone: string): Promise<ApiResponse> {
    return this.request('/api/v1/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone })
    })
  }

  async verifyOTP(loginData: LoginData): Promise<ApiResponse<{
    accessToken: string
    refreshToken: string
    expiresIn: number
    user: DriverProfile
  }>> {
    return this.request('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({
        phone: loginData.phone,
        otp: loginData.code
      })
    })
  }

  async refreshToken(): Promise<ApiResponse<{
    accessToken: string
    expiresIn: number
  }>> {
    const refreshToken = await AsyncStorage.getItem('refreshToken')
    return this.request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    })
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request('/api/v1/auth/logout', {
      method: 'POST'
    })
    // Clear local storage
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user', 'currentTrip'])
    return result
  }

  // Driver APIs
  async getDriverProfile(): Promise<ApiResponse<DriverProfile>> {
    return this.request('/api/v1/driver/profile')
  }

  async updateDriverProfile(driverId: string, profile: Partial<DriverProfile>): Promise<ApiResponse<DriverProfile>> {
    // Create a change request that goes to admin for approval
    return this.submitDriverChangeRequest(driverId, profile)
  }

  async submitDriverChangeRequest(driverId: string, changes: Partial<DriverProfile>): Promise<ApiResponse<any>> {
    const changeRequest = {
      driver_id: parseInt(driverId),
      requested_changes: changes,
      request_type: 'PROFILE_UPDATE',
      reason: 'Driver profile information update',
      priority: 'NORMAL',
      submitted_at: new Date().toISOString()
    }

    return this.request('/api/v1/driver/change-request', {
      method: 'POST',
      body: JSON.stringify(changeRequest)
    })
  }

  async getDriverChangeRequests(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/driver/change-requests')
  }

  async cancelChangeRequest(requestId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/driver/change-request/${requestId}/cancel`, {
      method: 'PUT'
    })
  }

  async getDriverStats(): Promise<ApiResponse<DriverStats>> {
    // Temporary mock data while backend endpoint is being debugged
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            rating: 4.8,
            totalTrips: 127,
            completedTrips: 115,
            todayEarnings: 850.0,
            fuelEfficiency: 12.5,
            onTimeDeliveries: 95,
            customerRating: 4.7
          }
        })
      }, 500) // Simulate network delay
    })
  }

  async updateDriverStatus(status: string): Promise<ApiResponse> {
    return this.request('/api/v1/driver/status', {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }

  // Trip APIs
  async getAssignedTrips(): Promise<ApiResponse<Trip[]>> {
    return this.request('/api/v1/driver/trips/assigned')
  }

  async getCurrentTrip(): Promise<ApiResponse<Trip>> {
    return this.request('/api/v1/driver/trips/current')
  }

  async getTripHistory(page: number = 1, limit: number = 20): Promise<ApiResponse<{
    trips: Trip[]
    total: number
    page: number
    totalPages: number
  }>> {
    return this.request(`/api/v1/driver/trips/history?page=${page}&limit=${limit}`)
  }

  async acceptTrip(tripId: number): Promise<ApiResponse<Trip>> {
    return this.request(`/api/v1/trips/${tripId}/accept`, {
      method: 'POST'
    })
  }

  async rejectTrip(tripId: number, reason?: string): Promise<ApiResponse> {
    return this.request(`/api/v1/trips/${tripId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    })
  }

  async startTrip(tripId: number): Promise<ApiResponse<Trip>> {
    return this.request(`/api/v1/trips/${tripId}/start`, {
      method: 'POST'
    })
  }

  async pauseTrip(tripId: number): Promise<ApiResponse<Trip>> {
    return this.request(`/api/v1/trips/${tripId}/pause`, {
      method: 'POST'
    })
  }

  async resumeTrip(tripId: number): Promise<ApiResponse<Trip>> {
    return this.request(`/api/v1/trips/${tripId}/resume`, {
      method: 'POST'
    })
  }

  async completeTrip(tripId: number, completionData: {
    proofOfDelivery?: string[]
    customerSignature?: string
    deliveryNotes?: string
    deliveredAt: string
  }): Promise<ApiResponse<Trip>> {
    return this.request(`/api/v1/trips/${tripId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completionData)
    })
  }

  // Location APIs
  async sendLocationPing(location: LocationPing): Promise<ApiResponse> {
    return this.request('/api/v1/location/ping', {
      method: 'POST',
      body: JSON.stringify(location)
    })
  }

  async sendLocationBatch(locations: LocationPing[]): Promise<ApiResponse> {
    return this.request('/api/v1/location/batch', {
      method: 'POST',
      body: JSON.stringify({ locations })
    })
  }

  // Fuel APIs
  async createFuelEvent(fuelEvent: FuelEvent): Promise<ApiResponse<FuelEvent>> {
    return this.request('/api/v1/fuel/events', {
      method: 'POST',
      body: JSON.stringify(fuelEvent)
    })
  }

  async getFuelEvents(page: number = 1): Promise<ApiResponse<{
    events: FuelEvent[]
    total: number
    page: number
  }>> {
    return this.request(`/api/v1/fuel/events?page=${page}`)
  }

  async getNearbyFuelStations(latitude: number, longitude: number, radius: number = 5): Promise<ApiResponse<{
    stations: Array<{
      id: string
      name: string
      brand: string
      address: string
      latitude: number
      longitude: number
      distance: number
    }>
  }>> {
    return this.request(`/api/v1/fuel/stations/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`)
  }

  // File Upload APIs
  async uploadPhoto(photoUri: string, type: 'fuel' | 'delivery' | 'document' | 'profile', metadata: any = {}): Promise<ApiResponse<{
    url: string
    filename: string
  }>> {
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: photoUri,
        type: 'image/jpeg',
        name: `${type}_${Date.now()}.jpg`
      } as any)
      formData.append('type', type)
      formData.append('metadata', JSON.stringify(metadata))

      const token = await AsyncStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/v1/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Upload failed'
        }
      }

      return {
        success: true,
        data: data
      }
    } catch (error) {
      console.error('Upload Error:', error)
      return {
        success: false,
        error: 'Failed to upload file'
      }
    }
  }

  // Document Management APIs
  async updateDocumentMetadata(driverId: string, documentType: string, metadata: {
    documentNumber?: string
    expiryDate?: string
  }): Promise<ApiResponse> {
    return this.request(`/api/v1/driver/${driverId}/documents/${documentType}`, {
      method: 'PUT',
      body: JSON.stringify(metadata)
    })
  }

  async deleteDocument(driverId: string, documentType: string): Promise<ApiResponse> {
    return this.request(`/api/v1/driver/${driverId}/documents/${documentType}`, {
      method: 'DELETE'
    })
  }

  async getDocuments(driverId: string): Promise<ApiResponse<{
    [key: string]: {
      url: string
      documentNumber?: string
      expiryDate?: string
      uploadedAt: string
      type: string
    }
  }>> {
    return this.request(`/api/v1/driver/${driverId}/documents`)
  }

  // Emergency API
  async sendEmergencyAlert(location: { latitude: number, longitude: number }): Promise<ApiResponse> {
    return this.request('/api/v1/emergency/alert', {
      method: 'POST',
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
        type: 'PANIC_BUTTON'
      })
    })
  }

  // Offline sync
  async syncOfflineData(): Promise<ApiResponse> {
    try {
      // Sync offline locations
      const offlineLocations = await AsyncStorage.getItem('offlineLocations')
      if (offlineLocations) {
        const locations = JSON.parse(offlineLocations)
        if (locations.length > 0) {
          const result = await this.sendLocationBatch(locations)
          if (result.success) {
            await AsyncStorage.removeItem('offlineLocations')
          }
        }
      }

      // Sync offline photos
      const offlinePhotos = await AsyncStorage.getItem('offlinePhotos')
      if (offlinePhotos) {
        const photos = JSON.parse(offlinePhotos)
        const unuploadedPhotos = photos.filter((p: any) => !p.uploaded)
        
        for (const photo of unuploadedPhotos) {
          const result = await this.uploadPhoto(photo.uri, photo.type, {
            tripId: photo.tripId,
            timestamp: photo.timestamp
          })
          
          if (result.success) {
            photo.uploaded = true
          }
        }
        
        await AsyncStorage.setItem('offlinePhotos', JSON.stringify(photos))
      }

      return { success: true, message: 'Offline data synced successfully' }
    } catch (error) {
      console.error('Offline sync error:', error)
      return { success: false, error: 'Failed to sync offline data' }
    }
  }

  // Update driver location
  async updateLocation(location: {
    latitude: number
    longitude: number
    timestamp: number
    accuracy?: number
    speed?: number
    heading?: number
  }): Promise<ApiResponse<void>> {
    return this.request<void>('/api/v1/location/ping', {
      method: 'POST',
      body: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading
      }
    })
  }
}

export const apiService = new ApiService()
export default apiService
