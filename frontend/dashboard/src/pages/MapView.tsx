import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Chip, 
  Avatar, 
  IconButton,
  Stack,
  Alert,
  Button
} from '@mui/material'
// Using native WebSocket for Go backend connection
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { useEffect, useState } from 'react'
import { 
  Map as MapIcon,
  DirectionsCar as VehicleIcon,
  LocalGasStation as FuelIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

type VehiclePosition = {
  lat: number;
  lng: number;
  vehicleId?: string;
  status?: 'active' | 'fuel' | 'parked' | 'alert';
  driver?: string;
  lastUpdate?: string;
  speed?: number;
  heading?: number;
  fuelLevel?: number | null;
  engineStatus?: string;
}

export default function MapView() {
  // const apiKey = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  //   ? undefined // Force demo mode in development
  //   : undefined // Set your actual API key here
  // Enable Google Maps - you'll see the actual map interface
  const apiKey = "AIzaSyB_QNXpGFl5naLPosEE_vzp3PgxblTk6Go"
  const [positions, setPositions] = useState<VehiclePosition[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isGoogleMapsAlreadyLoaded, setIsGoogleMapsAlreadyLoaded] = useState(false)
  const [isMapLoading, setIsMapLoading] = useState(false)

  // Sample vehicle positions for demonstration
  const samplePositions: VehiclePosition[] = [
    { lat: 19.0760, lng: 72.8777, vehicleId: 'MH-12-AB-1234', status: 'active', driver: 'Rajesh Kumar', lastUpdate: '2 min ago' }, // Mumbai
    { lat: 18.5204, lng: 73.8567, vehicleId: 'MH-14-CD-5678', status: 'fuel', driver: 'Suresh Patil', lastUpdate: '5 min ago' }, // Pune
    { lat: 23.0225, lng: 72.5714, vehicleId: 'GJ-01-EF-9012', status: 'active', driver: 'Amit Singh', lastUpdate: '1 min ago' }, // Ahmedabad
    { lat: 12.9716, lng: 77.5946, vehicleId: 'KA-03-GH-3456', status: 'parked', driver: 'Ram Prakash', lastUpdate: '15 min ago' }, // Bangalore
    { lat: 28.7041, lng: 77.1025, vehicleId: 'DL-05-IJ-7890', status: 'alert', driver: 'Vikash Yadav', lastUpdate: '3 min ago' }, // Delhi
  ]

  useEffect(() => {
    // Set sample data immediately
    setPositions(samplePositions)
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleMapsAlreadyLoaded(true)
      setIsMapLoaded(true)
      setIsMapLoading(false)
      console.log('Google Maps already loaded')
    } else {
      // Reset map loaded state if not loaded
      setIsMapLoaded(false)
      setIsGoogleMapsAlreadyLoaded(false)
      if (apiKey) {
        setIsMapLoading(true)
        console.log('Starting to load Google Maps...')
      }
    }

    // Try to connect to Go backend WebSocket for real-time updates
    const connectToGoBackend = () => {
      const ws = new WebSocket('ws://localhost:8080/ws')
      
      ws.onopen = () => {
        console.log('✅ Connected to FleetFlow Go backend - Live tracking active!')
        setIsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const vehicleUpdate = JSON.parse(event.data)
          console.log('📍 Vehicle update received from Go backend:', vehicleUpdate)
          
          // Handle Go backend message format
          if (vehicleUpdate.latitude && vehicleUpdate.longitude && vehicleUpdate.vehicleId) {
            setPositions(prev => {
              const existingIndex = prev.findIndex(p => p.vehicleId === vehicleUpdate.vehicleId)
              const newPosition = {
                lat: vehicleUpdate.latitude,
                lng: vehicleUpdate.longitude,
                vehicleId: vehicleUpdate.vehicleId,
                status: vehicleUpdate.status || 'active',
                driver: vehicleUpdate.driver || 'Unknown Driver',
                lastUpdate: 'Just now',
                speed: vehicleUpdate.speed || 0,
                heading: vehicleUpdate.heading || 0,
                fuelLevel: vehicleUpdate.fuelLevel || null,
                engineStatus: vehicleUpdate.engineStatus || 'unknown'
              }
              
              if (existingIndex >= 0) {
                // Update existing vehicle
                const updated = [...prev]
                updated[existingIndex] = newPosition
                console.log(`🔄 Updated vehicle ${vehicleUpdate.vehicleId}`)
                return updated
              } else {
                // Add new vehicle to tracking
                console.log(`➕ New vehicle ${vehicleUpdate.vehicleId} added to tracking`)
                return [...prev, newPosition]
              }
            })
            
            // Store in localStorage for persistence
            localStorage.setItem(`vehicle_${vehicleUpdate.vehicleId}_last_location`, JSON.stringify(vehicleUpdate))
          }
        } catch (error) {
          console.error('❌ Error parsing Go backend message:', error)
        }
      }
      
      ws.onclose = () => {
        console.log('📡 Disconnected from Go backend')
        setIsConnected(false)
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('🔄 Attempting to reconnect to Go backend...')
          connectToGoBackend()
        }, 5000)
      }
      
      ws.onerror = (error) => {
        console.error('❌ Go backend WebSocket error:', error)
        setIsConnected(false)
      }
      
      return ws
    }
    
    // Connect to Go backend
    const websocket = connectToGoBackend()

    // Demo: Simulate real-time updates when backend is unavailable
    const simulateUpdates = setInterval(() => {
      if (!isConnected) {
        setPositions(prev => prev.map(position => {
          // Randomly update some vehicles
          if (Math.random() < 0.3) { // 30% chance to update
            const timeOptions = ['Just now', '1 min ago', '2 min ago', '3 min ago']
            const statusOptions = ['active', 'fuel', 'parked', 'alert']
            
            return {
              ...position,
              lastUpdate: timeOptions[Math.floor(Math.random() * timeOptions.length)],
              // Occasionally change status
              status: Math.random() < 0.1 ? (statusOptions[Math.floor(Math.random() * statusOptions.length)] as VehiclePosition['status']) : position.status,
              // Slightly move position for realistic simulation
              lat: position.lat + (Math.random() - 0.5) * 0.01,
              lng: position.lng + (Math.random() - 0.5) * 0.01,
            }
          }
          return position
        }))
      }
    }, 5000) // Update every 5 seconds
    
    // Cleanup function
    return () => {
      if (websocket) {
        websocket.close()
      }
      clearInterval(simulateUpdates)
    }
  }, [isConnected, apiKey])

  const getMarkerColor = (status?: string) => {
    switch (status) {
      case 'active': return '#4CAF50' // Green
      case 'fuel': return '#FF9800' // Orange
      case 'parked': return '#2196F3' // Blue
      case 'alert': return '#F44336' // Red
      default: return '#9E9E9E' // Grey
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'fuel': return '🟡'
      case 'parked': return '🔵'
      case 'alert': return '🚨'
      default: return '⚪'
    }
  }

  const activeVehicles = positions.filter(p => p.status === 'active').length
  const fuelStops = positions.filter(p => p.status === 'fuel').length
  const parkedVehicles = positions.filter(p => p.status === 'parked').length
  const alertVehicles = positions.filter(p => p.status === 'alert').length

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🗺️ LIVE MAP
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time vehicle tracking and fleet monitoring
        </Typography>
      </Box>

      {/* Map Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'success.dark', margin: '0 auto', mb: 1 }}>
              <VehicleIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{activeVehicles}</Typography>
            <Typography variant="body2">🟢 Active Trips</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'warning.dark', margin: '0 auto', mb: 1 }}>
              <FuelIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{fuelStops}</Typography>
            <Typography variant="body2">🟡 Fuel Stops</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'info.dark', margin: '0 auto', mb: 1 }}>
              <LocationIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{parkedVehicles}</Typography>
            <Typography variant="body2">🔵 Parked</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'error.dark', margin: '0 auto', mb: 1 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{alertVehicles}</Typography>
            <Typography variant="body2">🚨 Alert Issues</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={isConnected ? '🔴 LIVE TRACKING ACTIVE' : 'Demo Mode (Simulated Updates)'} 
            color={isConnected ? 'success' : 'info'}
            icon={isConnected ? <NavigationIcon /> : <RefreshIcon />}
            sx={isConnected ? { 
              bgcolor: 'success.main', 
              color: 'white',
              fontWeight: 700,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 }
              }
            } : {}}
          />
          <Typography variant="body2" color="text.secondary">
            Last updated: {positions[0]?.lastUpdate || 'Just now'}
          </Typography>
          {!isConnected && (
            <Typography variant="caption" color="info.main" sx={{ fontStyle: 'italic' }}>
              Updates every 5 seconds
            </Typography>
          )}
        </Box>
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {/* Map Container */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Card sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: !apiKey ? 'info.main' : (mapError ? 'error.main' : (isMapLoading ? 'warning.main' : 'primary.main')), color: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🗺️ {!apiKey ? 'Fleet Dashboard - Live Grid View' : (mapError ? 'Fleet View (Fallback Mode)' : (isMapLoading ? 'Loading Google Maps...' : 'India Map with Vehicle Markers'))}
                {!apiKey && (
                  <Chip 
                    label="Demo Mode" 
                    size="small" 
                    sx={{ ml: 1, bgcolor: 'success.main', color: 'white' }}
                  />
                )}
                {isMapLoading && apiKey && (
                  <Chip 
                    label="Loading..." 
                    size="small" 
                    sx={{ ml: 1, bgcolor: 'info.main', color: 'white' }}
                  />
                )}
                {isGoogleMapsAlreadyLoaded && !mapError && apiKey && !isMapLoading && (
                  <Chip 
                    label="Maps Ready" 
                    size="small" 
                    sx={{ ml: 1, bgcolor: 'success.main', color: 'white' }}
                  />
                )}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {!apiKey 
                  ? '🚛 Real-time vehicle tracking with interactive grid layout'
                  : (mapError 
                    ? '⚠️ Google Maps unavailable - Showing vehicle grid view' 
                    : '📍 Green: Active • 🟡 Orange: Fuel • 🔵 Blue: Parked • 🔴 Red: Alert'
                  )
                }
              </Typography>
            </Box>
            <Box sx={{ height: 500 }}>
              {!apiKey && (
                <Alert severity="info" sx={{ m: 2 }}>
                  💡 <strong>Interactive Demo:</strong> Showing vehicles in grid layout with real-time simulation. 
                  For Google Maps integration, add VITE_GOOGLE_MAPS_API_KEY to your .env file.
                </Alert>
              )}
              {isMapLoading && apiKey && (
                <Alert severity="info" sx={{ m: 2 }}>
                  🔄 <strong>Loading Google Maps:</strong> Attempting to load the interactive map view. 
                  If this fails, you'll see the enhanced grid view instead.
                </Alert>
              )}
              {apiKey && !mapError ? (
                isGoogleMapsAlreadyLoaded ? (
                  // Google Maps already loaded, render map directly
                  <GoogleMap 
                    mapContainerStyle={{height: '100%', width: '100%'}} 
                    center={positions[0] || { lat: 19.0760, lng: 72.8777 }} // Default to Mumbai
                    zoom={6}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: true,
                      fullscreenControl: true,
                    }}
                    onLoad={() => {
                      console.log('Google Maps loaded successfully (already available)')
                      setIsMapLoaded(true)
                    }}
                  >
                    {isMapLoaded && positions.map((position, idx) => (
                      <Marker 
                        key={idx} 
                        position={position}
                        icon={{
                          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="${getMarkerColor(position.status)}" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          `)}`,
                          scaledSize: (window.google && window.google.maps && window.google.maps.Size) 
                            ? new window.google.maps.Size(32, 32) 
                            : undefined,
                          anchor: (window.google && window.google.maps && window.google.maps.Point) 
                            ? new window.google.maps.Point(16, 32) 
                            : undefined,
                        }}
                        title={`${position.vehicleId} - ${position.driver} (${position.status})`}
                      />
                    ))}
                  </GoogleMap>
                ) : (
                  // Load Google Maps for the first time
                  <LoadScript 
                    googleMapsApiKey={apiKey}
                    id="google-maps-script"
                    preventGoogleFontsLoading={true}
                    onLoad={() => {
                      console.log('Google Maps LoadScript completed')
                      setIsGoogleMapsAlreadyLoaded(true)
                      setIsMapLoading(false)
                    }}
                    onError={() => {
                      console.error('Google Maps failed to load - API key may have restrictions')
                      setMapError(true)
                      setIsMapLoaded(false)
                      setIsMapLoading(false)
                      alert('Google Maps failed to load. This may be due to:\n\n1. API key restrictions (domain/referrer limits)\n2. Billing issues\n3. API not enabled\n\nSwitching to enhanced demo mode...')
                    }}
                  >
                    <GoogleMap 
                      mapContainerStyle={{height: '100%', width: '100%'}} 
                      center={positions[0] || { lat: 19.0760, lng: 72.8777 }} // Default to Mumbai
                      zoom={6}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: true,
                        fullscreenControl: true,
                      }}
                      onLoad={() => {
                        console.log('Google Maps loaded successfully (first time)')
                        setIsMapLoaded(true)
                      }}
                    >
                      {isMapLoaded && positions.map((position, idx) => (
                        <Marker 
                          key={idx} 
                          position={position}
                          icon={{
                            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="${getMarkerColor(position.status)}" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            `)}`,
                            scaledSize: (window.google && window.google.maps && window.google.maps.Size) 
                              ? new window.google.maps.Size(32, 32) 
                              : undefined,
                            anchor: (window.google && window.google.maps && window.google.maps.Point) 
                              ? new window.google.maps.Point(16, 32) 
                              : undefined,
                          }}
                          title={`${position.vehicleId} - ${position.driver} (${position.status})`}
                        />
                      ))}
                    </GoogleMap>
                  </LoadScript>
                )
              ) : (
                <Box sx={{ height: '100%', bgcolor: 'grey.50', position: 'relative', overflow: 'hidden' }}>
                  {/* India Map Background */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    fontSize: '300px',
                    opacity: 0.08,
                    color: 'primary.main',
                    zIndex: 0
                  }}>
                    🇮🇳
                  </Box>
                  
                  {/* Decorative Route Lines */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                    background: 'linear-gradient(45deg, transparent 48%, rgba(25, 118, 210, 0.1) 49%, rgba(25, 118, 210, 0.1) 51%, transparent 52%)',
                    zIndex: 0
                  }} />
                  
                  {/* Vehicle Positions Grid */}
                  <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 600 }}>
                      🚛 Fleet Locations Across India
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                      {positions.map((position, idx) => (
                        <Grid item xs={6} md={4} key={idx}>
                          <Card sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            bgcolor: position.status === 'alert' ? 'error.light' : 'background.paper',
                            border: 2,
                            borderColor: getMarkerColor(position.status),
                            borderRadius: 2,
                            boxShadow: 3,
                            position: 'relative',
                            zIndex: 1,
                            '&:hover': { 
                              transform: 'scale(1.05)', 
                              transition: 'all 0.3s ease-in-out',
                              boxShadow: 6,
                              zIndex: 2
                            }
                          }}>
                            <Typography variant="h4" sx={{ mb: 1 }}>
                              {getStatusIcon(position.status)}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {position.vehicleId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {position.driver}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                              📍 {position.lat.toFixed(2)}, {position.lng.toFixed(2)}
                            </Typography>
                            {position.speed !== undefined && position.speed > 0 && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', color: 'info.main' }}>
                                🚗 {position.speed.toFixed(0)} km/h
                              </Typography>
                            )}
                            {position.fuelLevel && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem', color: position.fuelLevel < 20 ? 'error.main' : 'success.main' }}>
                                ⛽ {position.fuelLevel}%
                              </Typography>
                            )}
                            <Chip 
                              label={position.status} 
                              size="small" 
                              sx={{ 
                                mt: 1,
                                fontSize: '0.7rem',
                                textTransform: 'capitalize',
                                bgcolor: getMarkerColor(position.status),
                                color: 'white'
                              }} 
                            />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Alert severity="success" sx={{ mt: 2 }}>
                      ✨ <strong>Interactive Fleet Dashboard:</strong> This grid view provides comprehensive vehicle tracking 
                      with real-time updates, status monitoring, and detailed information. Perfect for fleet management operations!
                    </Alert>
                    
                    {!isConnected && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        🔄 <strong>Real-time Demo:</strong> Vehicle data is being simulated with automatic updates. 
                        To get real-time data, start the FleetFlow backend server on localhost:8080 with WebSocket support.
                      </Alert>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
          
          {/* Real-time Demo Notice */}
          {!isConnected && !apiKey && (
            <Alert severity="info" sx={{ mt: 2 }}>
              🔄 <strong>Demo Mode Active:</strong> Vehicle positions are being simulated with automatic updates every 5 seconds. 
              This interactive dashboard provides full fleet management capabilities without requiring external services.
            </Alert>
          )}
        </Grid>

        {/* Vehicle List */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚛 Vehicle Status
            </Typography>
            <Stack spacing={2}>
              {positions.map((position, idx) => (
                <Box key={idx} sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: position.status === 'alert' ? 'error.light' : 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">{getStatusIcon(position.status)}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {position.vehicleId}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Driver: {position.driver}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last update: {position.lastUpdate}
                  </Typography>
                  <Chip 
                    label={position.status} 
                    size="small" 
                    sx={{ 
                      mt: 1, 
                      textTransform: 'capitalize',
                      bgcolor: getMarkerColor(position.status),
                      color: 'white'
                    }} 
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

