import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
// Temporarily disable expo-location to isolate prototype error
// import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService, Trip } from '../services/api'
import { mapsService, RouteData, Coordinates } from '../services/maps'
import { webSocketService } from '../services/websocket'
import offlineSyncService from '../services/OfflineSync'
import ProofOfDeliveryScreen from './ProofOfDeliveryScreen'

interface TripManagementScreenProps {
  language: 'en' | 'hi'
}

interface LocationState {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

const { width, height } = Dimensions.get('window')

const translations = {
  en: {
    title: 'Trip Management',
    currentTrip: 'Current Trip',
    noActiveTrip: 'No Active Trip',
    startTrip: 'Start Trip',
    pauseTrip: 'Pause Trip',
    resumeTrip: 'Resume Trip',
    completeTrip: 'Complete Trip',
    navigateToDestination: 'Navigate to Destination',
    callCustomer: 'Call Customer',
    emergencyAlert: 'Emergency Alert',
    tripStatus: 'Trip Status',
    distance: 'Distance',
    duration: 'Duration',
    eta: 'ETA',
    pickup: 'Pickup',
    destination: 'Destination',
    customer: 'Customer',
    vehicleNumber: 'Vehicle',
    started: 'Started',
    paused: 'Paused',
    inProgress: 'In Progress',
    nearDestination: 'Near Destination',
    loading: 'Loading...',
    gettingLocation: 'Getting current location...',
    calculateRoute: 'Calculate Route',
    routeCalculated: 'Route calculated successfully',
    tripStarted: 'Trip started successfully',
    tripPaused: 'Trip paused',
    tripResumed: 'Trip resumed',
    tripCompleted: 'Trip completed successfully',
    confirmStart: 'Confirm Start Trip',
    confirmPause: 'Pause this trip?',
    confirmComplete: 'Complete this trip?',
    yes: 'Yes',
    no: 'No',
    offline: 'Working Offline',
    syncPending: 'Sync Pending',
    connected: 'Connected'
  },
  hi: {
    title: 'यात्रा प्रबंधन',
    currentTrip: 'वर्तमान यात्रा',
    noActiveTrip: 'कोई सक्रिय यात्रा नहीं',
    startTrip: 'यात्रा शुरू करें',
    pauseTrip: 'यात्रा रोकें',
    resumeTrip: 'यात्रा फिर शुरू करें',
    completeTrip: 'यात्रा पूरी करें',
    navigateToDestination: 'गंतव्य तक नेवीगेट करें',
    callCustomer: 'ग्राहक को कॉल करें',
    emergencyAlert: 'आपातकालीन अलर्ट',
    tripStatus: 'यात्रा स्थिति',
    distance: 'दूरी',
    duration: 'अवधि',
    eta: 'पहुंचने का समय',
    pickup: 'पिकअप',
    destination: 'गंतव्य',
    customer: 'ग्राहक',
    vehicleNumber: 'वाहन',
    started: 'शुरू',
    paused: 'रोका गया',
    inProgress: 'प्रगति में',
    nearDestination: 'गंतव्य के पास',
    loading: 'लोड हो रहा है...',
    gettingLocation: 'वर्तमान स्थान प्राप्त कर रहे हैं...',
    calculateRoute: 'रूट कैलकुलेट करें',
    routeCalculated: 'रूट सफलतापूर्वक कैलकुलेट किया गया',
    tripStarted: 'यात्रा सफलतापूर्वक शुरू',
    tripPaused: 'यात्रा रोकी गई',
    tripResumed: 'यात्रा फिर शुरू',
    tripCompleted: 'यात्रा सफलतापूर्वक पूरी',
    confirmStart: 'यात्रा शुरू करने की पुष्टि',
    confirmPause: 'यह यात्रा रोकें?',
    confirmComplete: 'यह यात्रा पूरी करें?',
    yes: 'हां',
    no: 'नहीं',
    offline: 'ऑफलाइन काम कर रहे हैं',
    syncPending: 'सिंक पेंडिंग',
    connected: 'जुड़ा हुआ'
  }
}

export default function TripManagementScreen({ language }: TripManagementScreenProps) {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null)
  const [mapRegion, setMapRegion] = useState<LocationState>({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  })
  const [route, setRoute] = useState<RouteData | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([])
  const [tripStatus, setTripStatus] = useState<string>('ASSIGNED')
  const [eta, setEta] = useState<string>('')
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0)
  const [isOnline, setIsOnline] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [showPOD, setShowPOD] = useState(false)

  const t = translations[language]

  useEffect(() => {
    initializeTrip()
    setupWebSocketListeners()
    
    // Monitor offline status
    const checkOnlineStatus = () => {
      setIsOnline(offlineSyncService.isConnected())
    }
    
    const interval = setInterval(checkOnlineStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const initializeTrip = async () => {
    try {
      // Load current trip from storage
      const tripData = await AsyncStorage.getItem('currentTrip')
      if (tripData) {
        const trip = JSON.parse(tripData)
        setCurrentTrip(trip)
        setTripStatus(trip.status)
      } else {
        // Try to fetch from API
        const result = await apiService.getCurrentTrip()
        if (result.success && result.data) {
          setCurrentTrip(result.data)
          setTripStatus(result.data.status)
          await AsyncStorage.setItem('currentTrip', JSON.stringify(result.data))
        }
      }

      await getCurrentLocation()
    } catch (error) {
      console.error('Error initializing trip:', error)
    }
    setLoading(false)
  }

  const setupWebSocketListeners = () => {
    webSocketService.on('trip_updated', (tripData) => {
      if (tripData.tripId === currentTrip?.id) {
        setCurrentTrip(tripData.trip)
        setTripStatus(tripData.trip.status)
        Alert.alert('Trip Update', tripData.message)
      }
    })

    webSocketService.on('location_request', () => {
      sendLocationUpdate()
    })
  }

  const getCurrentLocation = async () => {
    try {
      const location = await mapsService.getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        })

        if (currentTrip) {
          await calculateRouteToDestination(location)
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      Alert.alert('Error', t.gettingLocation)
    }
  }

  const calculateRouteToDestination = async (currentLoc: Coordinates) => {
    if (!currentTrip || !currentLoc) return

    try {
      const destination = {
        latitude: currentTrip.destinationLat || 0,
        longitude: currentTrip.destinationLng || 0
      }

      const routeData = await mapsService.calculateRoute(currentLoc, destination)
      if (routeData) {
        setRoute(routeData)
        setDistanceRemaining(routeData.distance)
        
        // Decode polyline for map display
        const coordinates = decodePolyline(routeData.polyline)
        setRouteCoordinates(coordinates)

        // Calculate ETA
        const etaTime = new Date(Date.now() + routeData.duration * 1000)
        setEta(etaTime.toLocaleTimeString())

        Alert.alert('Success', t.routeCalculated)
      }
    } catch (error) {
      console.error('Error calculating route:', error)
    }
  }

  const decodePolyline = (encoded: string): Coordinates[] => {
    // Simplified polyline decoder - you might want to use a library like @mapbox/polyline
    const coordinates: Coordinates[] = []
    // Implementation would go here - for now return empty array
    return coordinates
  }

  const sendLocationUpdate = async () => {
    if (!currentLocation || !currentTrip) return

    try {
      // Send via API
      await apiService.sendLocationPing({
        vehicle_id: currentTrip.vehicleId || 1,
        driver_id: currentTrip.driverId || 1,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        tripId: currentTrip.id
      })

      // Send via WebSocket
      webSocketService.sendLocationUpdate({
        driverId: currentTrip.driverId || 0,
        vehicleId: currentTrip.vehicleId || 0,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      // Store offline
      await offlineSyncService.addOfflineAction('location', {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: 10,
        timestamp: new Date().toISOString(),
        tripId: currentTrip.id
      })
    }
  }

  const startTrip = async () => {
    if (!currentTrip) return

    Alert.alert(
      t.confirmStart,
      `${t.pickup}: ${currentTrip.originAddress}\n${t.destination}: ${currentTrip.destinationAddress}`,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          onPress: async () => {
            setLoading(true)
            try {
              const result = await apiService.startTrip(currentTrip.id)
              if (result.success) {
                setTripStatus('IN_PROGRESS')
                await AsyncStorage.setItem('currentTrip', JSON.stringify({ ...currentTrip, status: 'IN_PROGRESS' }))
                
                // Send WebSocket update
                webSocketService.sendTripStatusUpdate(currentTrip.id, 'IN_PROGRESS')
                
                Alert.alert('Success', t.tripStarted)
                
                // Start location tracking
                sendLocationUpdate()
              } else {
                // Store offline
                await offlineSyncService.startTrip(
                  currentTrip.id.toString(),
                  { lat: currentLocation?.latitude || 0, lng: currentLocation?.longitude || 0 }
                )
                Alert.alert('Info', t.offline)
              }
            } catch (error) {
              await offlineSyncService.startTrip(
                currentTrip.id.toString(),
                { lat: currentLocation?.latitude || 0, lng: currentLocation?.longitude || 0 }
              )
              Alert.alert('Info', t.offline)
            }
            setLoading(false)
          }
        }
      ]
    )
  }

  const pauseTrip = async () => {
    if (!currentTrip) return

    Alert.alert(t.confirmPause, '', [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes,
        onPress: async () => {
          try {
            const result = await apiService.pauseTrip(currentTrip.id)
            if (result.success) {
              setTripStatus('PAUSED')
              Alert.alert('Success', t.tripPaused)
            }
          } catch (error) {
            console.error('Error pausing trip:', error)
          }
        }
      }
    ])
  }

  const resumeTrip = async () => {
    if (!currentTrip) return

    try {
      const result = await apiService.resumeTrip(currentTrip.id)
      if (result.success) {
        setTripStatus('IN_PROGRESS')
        Alert.alert('Success', t.tripResumed)
      }
    } catch (error) {
      console.error('Error resuming trip:', error)
    }
  }

  const completeTrip = async () => {
    if (!currentTrip) return
    
    // Show Proof of Delivery screen instead of directly completing
    setShowPOD(true)
  }

  const handlePODComplete = async (podData: any) => {
    try {
      setTripStatus('COMPLETED')
      setCurrentTrip(null)
      setShowPOD(false)
      await AsyncStorage.removeItem('currentTrip')
      Alert.alert('Success', t.tripCompleted)
    } catch (error) {
      console.error('Error handling POD completion:', error)
    }
  }

  const handlePODCancel = () => {
    setShowPOD(false)
  }

  const openNavigation = async () => {
    if (!currentTrip) return

    const destination = {
      latitude: currentTrip.destinationLat || 0,
      longitude: currentTrip.destinationLng || 0,
      address: currentTrip.destinationAddress
    }

    const opened = await mapsService.openNavigationApp(destination, currentLocation)
    if (!opened) {
      Alert.alert('Error', 'Unable to open navigation app')
    }
  }

  const sendEmergencyAlert = async () => {
    Alert.alert(
      t.emergencyAlert,
      'Send emergency alert to control center?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            if (currentLocation) {
              try {
                await apiService.sendEmergencyAlert(currentLocation)
                webSocketService.sendEmergencyAlert(currentLocation)
                Alert.alert('Alert Sent', 'Emergency alert sent to control center')
              } catch (error) {
                Alert.alert('Error', 'Failed to send emergency alert')
              }
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ASSIGNED': return '#FF9800'
      case 'IN_PROGRESS': return '#4CAF50'
      case 'PAUSED': return '#2196F3'
      case 'COMPLETED': return '#9C27B0'
      default: return '#666'
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentTrip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.noTripText}>{t.noActiveTrip}</Text>
          <Text style={styles.noTripSubtext}>
            New trips will appear here when assigned
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚛 {t.title}</Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>
            {isOnline ? t.connected : t.offline}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Trip Info Card */}
        <View style={styles.card}>
          <View style={styles.tripHeader}>
            <Text style={styles.cardTitle}>{t.currentTrip}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tripStatus) }]}>
              <Text style={styles.statusBadgeText}>{tripStatus}</Text>
            </View>
          </View>

          <View style={styles.tripDetails}>
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>📍 {t.pickup}</Text>
              <Text style={styles.addressText}>{currentTrip.originAddress}</Text>
            </View>
            <View style={styles.routeIndicator}>
              <Text style={styles.routeArrow}>↓</Text>
            </View>
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>🎯 {t.destination}</Text>
              <Text style={styles.addressText}>{currentTrip.destinationAddress}</Text>
            </View>
          </View>

          {currentTrip.customerName && (
            <View style={styles.customerInfo}>
              <Text style={styles.customerLabel}>{t.customer}:</Text>
              <Text style={styles.customerName}>{currentTrip.customerName}</Text>
              {currentTrip.customerPhone && (
                <TouchableOpacity style={styles.callButton}>
                  <Text style={styles.callButtonText}>📞 {t.callCustomer}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Trip Stats */}
        {route && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 {t.tripStatus}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {mapsService.formatDistance(distanceRemaining, language)}
                </Text>
                <Text style={styles.statLabel}>{t.distance}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {mapsService.formatDuration(route.duration, language)}
                </Text>
                <Text style={styles.statLabel}>{t.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{eta}</Text>
                <Text style={styles.statLabel}>{t.eta}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Map Card */}
        <View style={styles.card}>
          <View style={styles.mapHeader}>
            <Text style={styles.cardTitle}>🗺️ Route Map</Text>
            <TouchableOpacity
              style={styles.mapToggle}
              onPress={() => setShowMap(!showMap)}
            >
              <Text style={styles.mapToggleText}>
                {showMap ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showMap && (
            <View style={styles.mapContainer}>
              {Platform.OS !== 'web' && MapView ? (
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  provider={PROVIDER_GOOGLE}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {currentLocation && (
                    <Marker
                      coordinate={currentLocation}
                      title="Your Location"
                      pinColor="blue"
                    />
                  )}
                  
                  {currentTrip.destinationLat && currentTrip.destinationLng && (
                    <Marker
                      coordinate={{
                        latitude: currentTrip.destinationLat,
                        longitude: currentTrip.destinationLng
                      }}
                      title="Destination"
                      pinColor="red"
                    />
                  )}
                  
                  {routeCoordinates.length > 0 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeColor="#2196F3"
                      strokeWidth={4}
                    />
                  )}
                </MapView>
              ) : (
                <View style={[styles.map, styles.webMapPlaceholder]}>
                  <Text style={styles.webMapText}>🗺️</Text>
                  <Text style={styles.webMapTitle}>Map View</Text>
                  <Text style={styles.webMapSubtext}>
                    Maps are available on mobile devices only
                  </Text>
                  <View style={styles.webLocationInfo}>
                    {currentTrip && (
                      <>
                        <Text style={styles.webLocationText}>
                          📍 From: {currentTrip.originAddress}
                        </Text>
                        <Text style={styles.webLocationText}>
                          🎯 To: {currentTrip.destinationAddress}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.actionRow}>
          {tripStatus === 'ASSIGNED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={startTrip}
            >
              <Text style={styles.actionButtonText}>🚀 {t.startTrip}</Text>
            </TouchableOpacity>
          )}

          {tripStatus === 'IN_PROGRESS' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.pauseButton]}
                onPress={pauseTrip}
              >
                <Text style={styles.actionButtonText}>⏸️ {t.pauseTrip}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={completeTrip}
              >
                <Text style={styles.actionButtonText}>✅ {t.completeTrip}</Text>
              </TouchableOpacity>
            </>
          )}

          {tripStatus === 'PAUSED' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.resumeButton]}
              onPress={resumeTrip}
            >
              <Text style={styles.actionButtonText}>▶️ {t.resumeTrip}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.navigateButton]}
            onPress={openNavigation}
          >
            <Text style={styles.actionButtonText}>🗺️ {t.navigateToDestination}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={sendEmergencyAlert}
          >
            <Text style={styles.actionButtonText}>🚨 {t.emergencyAlert}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Proof of Delivery Modal */}
      {showPOD && currentTrip && (
        <Modal visible={showPOD} animationType="slide">
          <ProofOfDeliveryScreen
            trip={currentTrip}
            language={language}
            onComplete={handlePODComplete}
            onCancel={handlePODCancel}
          />
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5
  },
  statusText: {
    fontSize: 12,
    color: '#666'
  },
  scrollContainer: {
    flex: 1,
    padding: 16
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  noTripText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10
  },
  noTripSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  tripDetails: {
    marginBottom: 15
  },
  addressContainer: {
    marginBottom: 10
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  routeIndicator: {
    alignItems: 'center',
    marginVertical: 10
  },
  routeArrow: {
    fontSize: 20,
    color: '#2196F3'
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10
  },
  customerLabel: {
    fontSize: 14,
    color: '#666'
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: '#666'
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  mapToggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#2196F3',
    borderRadius: 20
  },
  mapToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden'
  },
  map: {
    flex: 1
  },
  actionContainer: {
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  startButton: {
    backgroundColor: '#4CAF50'
  },
  pauseButton: {
    backgroundColor: '#FF9800'
  },
  resumeButton: {
    backgroundColor: '#2196F3'
  },
  completeButton: {
    backgroundColor: '#9C27B0'
  },
  navigateButton: {
    backgroundColor: '#2196F3'
  },
  emergencyButton: {
    backgroundColor: '#F44336'
  },
  webMapPlaceholder: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  webMapText: {
    fontSize: 40,
    marginBottom: 10,
  },
  webMapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  webLocationInfo: {
    width: '100%',
    paddingHorizontal: 20,
  },
  webLocationText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
})
