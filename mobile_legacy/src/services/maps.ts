import { Linking, Platform } from 'react-native'

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface RoutePoint extends Coordinates {
  address?: string
  name?: string
}

export interface NavigationOptions {
  mode?: 'driving' | 'walking' | 'transit'
  avoid?: 'tolls' | 'highways' | 'ferries'
  language?: 'en' | 'hi'
}

export interface RouteData {
  distance: number // in meters
  duration: number // in seconds
  polyline: string
  steps: RouteStep[]
}

export interface RouteStep {
  instruction: string
  distance: number
  duration: number
  startLocation: Coordinates
  endLocation: Coordinates
  maneuver?: string
}

export interface FuelStation {
  id: string
  name: string
  brand: string
  address: string
  location: Coordinates
  distance: number // in meters
  pricePerLiter?: number
  amenities?: string[]
  isOpen?: boolean
  rating?: number
}

class MapsService {
  private readonly GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyB_QNXpGFl5naLPosEE_vzp3PgxblTk6Go'
  private readonly GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || ''

  constructor() {
    if (!this.GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not found in environment variables')
    }
  }

  // Navigation functions
  async openNavigationApp(
    destination: RoutePoint, 
    origin?: RoutePoint,
    options: NavigationOptions = {}
  ): Promise<boolean> {
    try {
      const { mode = 'driving' } = options
      const originStr = origin 
        ? `${origin.latitude},${origin.longitude}`
        : 'current+location'
      
      const destinationStr = `${destination.latitude},${destination.longitude}`

      // Try Google Maps first
      const googleMapsUrl = Platform.select({
        ios: `comgooglemaps://?saddr=${originStr}&daddr=${destinationStr}&directionsmode=${mode}`,
        android: `google.navigation:q=${destinationStr}&mode=${mode}`
      })

      if (googleMapsUrl) {
        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl)
        if (canOpenGoogleMaps) {
          await Linking.openURL(googleMapsUrl)
          return true
        }
      }

      // Fallback to default maps app
      const fallbackUrl = Platform.select({
        ios: `maps://app?saddr=${originStr}&daddr=${destinationStr}`,
        android: `geo:${destination.latitude},${destination.longitude}?q=${destinationStr}`
      })

      if (fallbackUrl) {
        const canOpenFallback = await Linking.canOpenURL(fallbackUrl)
        if (canOpenFallback) {
          await Linking.openURL(fallbackUrl)
          return true
        }
      }

      // Final fallback to web URL
      const webUrl = `https://www.google.com/maps/dir/${originStr}/${destinationStr}`
      await Linking.openURL(webUrl)
      return true

    } catch (error) {
      console.error('Error opening navigation app:', error)
      return false
    }
  }

  async getCurrentLocation(): Promise<Coordinates | null> {
    try {
      console.log('📍 MapsService: Getting current location (mock mode)...')
      
      // Try browser geolocation API if available (for web)
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData: Coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }
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
      console.log('✅ Mock location provided:', mockLocation)
      return mockLocation
    } catch (error) {
      console.error('Error getting current location:', error)
      return this.getMockLocation()
    }
  }

  private getMockLocation(): Coordinates {
    // Generate realistic mock coordinates in Mumbai for Indian fleet management
    const baseLatitude = 19.0760  // Mumbai
    const baseLongitude = 72.8777
    
    // Add small random movement to simulate driving
    const latOffset = (Math.random() - 0.5) * 0.001 // ~100m movement
    const lngOffset = (Math.random() - 0.5) * 0.001
    
    return {
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
    }
  }

  // Route calculation
  async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[],
    options: NavigationOptions = {}
  ): Promise<RouteData | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const { mode = 'driving', avoid, language = 'en' } = options
      
      let url = `https://maps.googleapis.com/maps/api/directions/json?`
      url += `origin=${origin.latitude},${origin.longitude}`
      url += `&destination=${destination.latitude},${destination.longitude}`
      url += `&mode=${mode}`
      url += `&language=${language}`
      url += `&key=${this.GOOGLE_MAPS_API_KEY}`

      if (waypoints && waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join('|')
        url += `&waypoints=${waypointsStr}`
      }

      if (avoid) {
        url += `&avoid=${avoid}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        console.error('No routes found:', data.status)
        return null
      }

      const route = data.routes[0]
      const leg = route.legs[0]

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance.value,
          duration: step.duration.value,
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
          maneuver: step.maneuver,
        })),
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      return null
    }
  }

  // Geocoding
  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_MAPS_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location
        return {
          latitude: location.lat,
          longitude: location.lng,
        }
      }

      return null
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${this.GOOGLE_MAPS_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address
      }

      return null
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      return null
    }
  }

  // Distance and ETA calculations
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180
    const φ2 = point2.latitude * Math.PI / 180
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  async getDistanceMatrix(
    origins: Coordinates[],
    destinations: Coordinates[],
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<{ distance: number; duration: number }[][] | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const originsStr = origins.map(o => `${o.latitude},${o.longitude}`).join('|')
      const destinationsStr = destinations.map(d => `${d.latitude},${d.longitude}`).join('|')

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${this.GOOGLE_MAPS_API_KEY}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK') {
        return data.rows.map((row: any) =>
          row.elements.map((element: any) => ({
            distance: element.distance?.value || 0,
            duration: element.duration?.value || 0,
          }))
        )
      }

      return null
    } catch (error) {
      console.error('Error getting distance matrix:', error)
      return null
    }
  }

  // Fuel station finder
  async findNearbyFuelStations(
    location: Coordinates,
    radius: number = 5000, // 5km default
    language: 'en' | 'hi' = 'en'
  ): Promise<FuelStation[]> {
    try {
      if (!this.GOOGLE_PLACES_API_KEY) {
        console.error('Google Places API key not configured')
        return []
      }

      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&type=gas_station&language=${language}&key=${this.GOOGLE_PLACES_API_KEY}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.results) {
        return data.results.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          brand: this.extractFuelBrand(place.name),
          address: place.vicinity || place.formatted_address,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          distance: this.calculateDistance(location, {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }),
          isOpen: place.opening_hours?.open_now,
          rating: place.rating,
        })).sort((a: FuelStation, b: FuelStation) => a.distance - b.distance)
      }

      return []
    } catch (error) {
      console.error('Error finding fuel stations:', error)
      return []
    }
  }

  private extractFuelBrand(name: string): string {
    const brands = ['HP', 'BPCL', 'IOC', 'Reliance', 'Shell', 'Essar', 'HPCL', 'Bharat Petroleum']
    const upperName = name.toUpperCase()
    
    for (const brand of brands) {
      if (upperName.includes(brand.toUpperCase())) {
        return brand
      }
    }
    
    return 'Other'
  }

  // Route optimization for multiple stops
  async optimizeRoute(
    origin: Coordinates,
    destination: Coordinates,
    waypoints: Coordinates[]
  ): Promise<{ optimizedOrder: number[]; route: RouteData } | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const waypointsStr = waypoints
        .map(wp => `${wp.latitude},${wp.longitude}`)
        .join('|')

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=optimize:true|${waypointsStr}&key=${this.GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0]
        
        return {
          optimizedOrder: data.routes[0].waypoint_order || [],
          route: {
            distance: route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0),
            duration: route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0),
            polyline: route.overview_polyline.points,
            steps: route.legs.flatMap((leg: any) =>
              leg.steps.map((step: any) => ({
                instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                distance: step.distance.value,
                duration: step.duration.value,
                startLocation: {
                  latitude: step.start_location.lat,
                  longitude: step.start_location.lng,
                },
                endLocation: {
                  latitude: step.end_location.lat,
                  longitude: step.end_location.lng,
                },
                maneuver: step.maneuver,
              }))
            ),
          },
        }
      }

      return null
    } catch (error) {
      console.error('Error optimizing route:', error)
      return null
    }
  }

  // Traffic information
  async getTrafficInfo(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<{ duration: number; durationInTraffic: number } | null> {
    try {
      if (!this.GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not configured')
        return null
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&departure_time=now&key=${this.GOOGLE_MAPS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status === 'OK' && data.routes.length > 0) {
        const leg = data.routes[0].legs[0]
        return {
          duration: leg.duration.value,
          durationInTraffic: leg.duration_in_traffic?.value || leg.duration.value,
        }
      }

      return null
    } catch (error) {
      console.error('Error getting traffic info:', error)
      return null
    }
  }

  // Format distance for display
  formatDistance(meters: number, language: 'en' | 'hi' = 'en'): string {
    if (meters < 1000) {
      return language === 'hi' 
        ? `${Math.round(meters)} मीटर`
        : `${Math.round(meters)} m`
    } else {
      const km = (meters / 1000).toFixed(1)
      return language === 'hi'
        ? `${km} किमी`
        : `${km} km`
    }
  }

  // Format duration for display
  formatDuration(seconds: number, language: 'en' | 'hi' = 'en'): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (language === 'hi') {
      if (hours > 0) {
        return minutes > 0 
          ? `${hours} घंटे ${minutes} मिनट`
          : `${hours} घंटे`
      }
      return `${minutes} मिनट`
    } else {
      if (hours > 0) {
        return minutes > 0 
          ? `${hours}h ${minutes}m`
          : `${hours}h`
      }
      return `${minutes}m`
    }
  }

  // Check if location is within geofence
  isWithinGeofence(
    location: Coordinates,
    center: Coordinates,
    radius: number
  ): boolean {
    const distance = this.calculateDistance(location, center)
    return distance <= radius
  }

  // Get map style for different themes
  getMapStyle(theme: 'light' | 'dark' | 'satellite' = 'light'): any[] {
    switch (theme) {
      case 'dark':
        return [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          // Add more dark theme styles
        ]
      case 'satellite':
        return [] // Satellite view doesn't need custom styling
      default:
        return [] // Default light theme
    }
  }
}

export const mapsService = new MapsService()
export default mapsService
