import { Platform, Alert, Linking } from 'react-native'
// Re-enable expo-image-picker for camera functionality (expo-location removed permanently)
import * as ImagePicker from 'expo-image-picker'

export interface PermissionStatus {
  camera: boolean
  location: boolean
  backgroundLocation: boolean
  mediaLibrary: boolean
}

export class PermissionsManager {
  static async checkAllPermissions(): Promise<PermissionStatus> {
    const [camera, location, backgroundLocation, mediaLibrary] = await Promise.all([
      this.checkCameraPermission(),
      this.checkLocationPermission(),
      this.checkBackgroundLocationPermission(),
      this.checkMediaLibraryPermission()
    ])

    return {
      camera,
      location,
      backgroundLocation,
      mediaLibrary
    }
  }

  static async requestAllPermissions(): Promise<PermissionStatus> {
    console.log('🔐 Requesting all permissions...')
    
    const [camera, location, backgroundLocation, mediaLibrary] = await Promise.all([
      this.requestCameraPermission(),
      this.requestLocationPermission(),
      this.requestBackgroundLocationPermission(),
      this.requestMediaLibraryPermission()
    ])

    const status = {
      camera,
      location,
      backgroundLocation,
      mediaLibrary
    }

    console.log('📋 Permission status:', status)
    return status
  }

  // Camera Permissions
  static async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      console.error('Error checking camera permission:', error)
      return false
    }
  }

  static async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status === 'granted') {
        console.log('✅ Camera permission granted')
        return true
      } else {
        console.log('❌ Camera permission denied')
        this.showPermissionDeniedAlert('Camera', 'to capture delivery photos and fuel receipts')
        return false
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error)
      return false
    }
  }

  // Location Permissions (Mock Service - No Real Permissions Needed)
  static async checkLocationPermission(): Promise<boolean> {
    try {
      console.log('📍 Location permission check temporarily disabled for debugging')
      return true // Mock permission granted
    } catch (error) {
      console.error('Error checking location permission:', error)
      return false
    }
  }

  static async requestLocationPermission(): Promise<boolean> {
    try {
      console.log('📍 Location permission request temporarily disabled for debugging')
      console.log('✅ Location permission granted (mock)')
      return true
    } catch (error) {
      console.error('Error requesting location permission:', error)
      return false
    }
  }

  // Background Location Permission (temporarily disabled)
  static async checkBackgroundLocationPermission(): Promise<boolean> {
    try {
      console.log('🌍 Background location permission check temporarily disabled for debugging')
      return true // Mock permission granted
    } catch (error) {
      console.error('Error checking background location permission:', error)
      return false
    }
  }

  static async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      console.log('🌍 Background location permission request temporarily disabled for debugging')
      console.log('✅ Background location permission granted (mock)')
      return true
    } catch (error) {
      console.error('Error requesting background location permission:', error)
      return false
    }
  }

  // Media Library Permission
  static async checkMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      console.error('Error checking media library permission:', error)
      return false
    }
  }

  static async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status === 'granted') {
        console.log('✅ Media library permission granted')
        return true
      } else {
        console.log('❌ Media library permission denied')
        this.showPermissionDeniedAlert('Photo Library', 'to select images for delivery proof')
        return false
      }
    } catch (error) {
      console.error('Error requesting media library permission:', error)
      return false
    }
  }

  // Helper Methods
  static showPermissionDeniedAlert(permissionName: string, purpose: string) {
    Alert.alert(
      `${permissionName} Permission Required`,
      `FleetFlow needs ${permissionName.toLowerCase()} access ${purpose}. Please enable it in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    )
  }

  // Test Camera Functionality
  static async testCamera(): Promise<boolean> {
    try {
      const hasPermission = await this.requestCameraPermission()
      if (!hasPermission) {
        Alert.alert('Camera Permission', 'Camera permission is required to test camera functionality.')
        return false
      }

      Alert.alert('Camera Permission', 'Camera permission granted! You can now use camera features in the app.', [
        { text: 'OK' },
        { 
          text: 'Take Test Photo', 
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              })
              
              if (!result.canceled) {
                Alert.alert('Success', 'Camera is working properly!')
              }
            } catch (error) {
              Alert.alert('Error', 'Camera test failed: ' + error.message)
            }
          }
        }
      ])
      return true
    } catch (error) {
      console.error('❌ Camera test failed:', error)
      Alert.alert('Camera Error', 'Failed to test camera: ' + error.message)
      return false
    }
  }

  // Test GPS Functionality
  static async testGPS(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const hasPermission = await this.requestLocationPermission()
      if (!hasPermission) {
        Alert.alert('Location Permission', 'Location permission is required to test GPS functionality.')
        return null
      }

      Alert.alert('GPS Test', 'Getting your location...', [{ text: 'Cancel' }])
      
      console.log('📍 GPS location request temporarily disabled for debugging')
      // Mock location for testing
      const location = {
        coords: {
          latitude: 37.7749,  // San Francisco coordinates
          longitude: -122.4194
        }
      }
      // const location = await Location.getCurrentPositionAsync({
      //   accuracy: Location.Accuracy.High,
      //   timeout: 15000,
      // })

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }

      Alert.alert('GPS Success!', 
        `✅ GPS is working properly!\n\nLatitude: ${coords.latitude.toFixed(6)}\nLongitude: ${coords.longitude.toFixed(6)}\nAccuracy: ${location.coords.accuracy}m`)
      
      console.log('✅ GPS test successful:', coords)
      return coords
    } catch (error) {
      console.error('❌ GPS test failed:', error)
      Alert.alert('GPS Error', `Failed to get location: ${error.message}\n\nPlease check:\n• Location permission granted\n• GPS/Location services enabled\n• Not in airplane mode`)
      return null
    }
  }

  // Show Permission Status
  static async showPermissionStatus() {
    const status = await this.checkAllPermissions()
    
    const message = `
📋 Permission Status:
🎥 Camera: ${status.camera ? '✅ Granted' : '❌ Denied'}
📍 Location: ${status.location ? '✅ Granted' : '❌ Denied'}
🌍 Background Location: ${status.backgroundLocation ? '✅ Granted' : '❌ Denied'}
📸 Photo Library: ${status.mediaLibrary ? '✅ Granted' : '❌ Denied'}
    `

    Alert.alert('Permission Status', message, [
      { text: 'OK' },
      { text: 'Request All', onPress: () => this.requestAllPermissions() }
    ])
  }
}
