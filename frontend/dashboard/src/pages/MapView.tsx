import { useState, useMemo } from 'react'
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  Polyline
} from '@react-google-maps/api'
import {
  Box,
  Typography,
  Card,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  useTheme,
  InputBase,
  Fab
} from '@mui/material'
import {
  Search,
  DirectionsCar,
  LocalShipping,
  Speed,
  MyLocation,
  Layers,
  ZoomIn,
  ZoomOut
} from '@mui/icons-material'

// Dark Mode Map Style
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
]

const containerStyle = {
  width: '100%',
  height: '100vh'
}

const center = {
  lat: 20.5937,
  lng: 78.9629 // India center
}

// Dummy data for vehicles
const vehicles = [
  { id: 1, plate: 'MH-12-AB-1234', status: 'Moving', lat: 19.0760, lng: 72.8777, type: 'Truck', speed: 65, driver: 'Rajesh K.' },
  { id: 2, plate: 'GJ-01-XY-5678', status: 'Stopped', lat: 23.0225, lng: 72.5714, type: 'Van', speed: 0, driver: 'Vikram S.' },
  { id: 3, plate: 'KA-01-CD-9012', status: 'Moving', lat: 12.9716, lng: 77.5946, type: 'Truck', speed: 58, driver: 'Amit P.' },
  { id: 4, plate: 'DL-01-EF-3456', status: 'Idle', lat: 28.7041, lng: 77.1025, type: 'Truck', speed: 0, driver: 'Suresh M.' },
]

export default function MapView() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  })
  const theme = useTheme()
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const [search, setSearch] = useState('')

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v =>
      v.plate.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  if (!isLoaded) return <Box>Loading Map...</Box>

  return (
    <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={5}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false,
        }}
        onClick={() => setSelectedVehicle(null)}
      >
        {vehicles.map(vehicle => (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat, lng: vehicle.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: vehicle.status === 'Moving' ? theme.palette.success.main :
                vehicle.status === 'Stopped' ? theme.palette.error.main : theme.palette.warning.main,
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            onClick={() => setSelectedVehicle(vehicle)}
          />
        ))}

        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'black' }}>{selectedVehicle.plate}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Driver: {selectedVehicle.driver}</Typography>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating Glass Sidebar */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          bottom: 20,
          width: 340,
          bgcolor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Live Fleet</Typography>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.05)',
            borderRadius: 2,
            px: 2,
            py: 1
          }}>
            <Search sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search vehicle or driver..."
              sx={{ color: 'white', fontSize: '0.9rem', width: '100%' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
        </Box>

        <List sx={{ flex: 1, overflowY: 'auto' }}>
          {filteredVehicles.map((vehicle) => (
            <ListItem
              button
              key={vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
              selected={selectedVehicle?.id === vehicle.id}
              sx={{
                borderLeft: '3px solid transparent',
                '&.Mui-selected': {
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderLeftColor: theme.palette.success.main
                },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.03)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: vehicle.status === 'Moving' ? theme.palette.success.main :
                    vehicle.status === 'Stopped' ? theme.palette.error.main : theme.palette.warning.main
                }}>
                  <LocalShipping fontSize="small" />
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={600}>{vehicle.plate}</Typography>
                    <Typography variant="caption" sx={{
                      color: vehicle.status === 'Moving' ? 'success.main' :
                        vehicle.status === 'Stopped' ? 'error.main' : 'warning.main'
                    }}>{vehicle.status}</Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Speed sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{vehicle.speed} km/h</Typography>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" color="text.secondary">{vehicle.driver}</Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Fab size="medium" sx={{ bgcolor: 'glass.card', color: 'white' }}>
          <Layers />
        </Fab>
        <Fab size="medium" sx={{ bgcolor: 'glass.card', color: 'white' }}>
          <MyLocation />
        </Fab>
      </Box>

    </Box>
  )
}
