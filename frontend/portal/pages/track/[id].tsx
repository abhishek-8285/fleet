import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Typography,
  Grid,
  Card,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  CircularProgress,
  Button,
  useTheme,
  Stack,
  IconButton
} from '@mui/material'
import {
  LocalShipping,
  CheckCircle,
  Place,
  Person,
  Phone,
  ArrowBack,
  Share,
  ContentCopy,
  Map as MapIcon
} from '@mui/icons-material'
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api'
import { motion } from 'framer-motion'

// Dark Mode Map Style (Same as Dashboard)
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
]

export default function TrackingPage() {
  const router = useRouter()
  const { id } = router.query
  const { t } = useTranslation()
  const theme = useTheme()
  const [loading, setLoading] = useState(true)

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  // Simulated Trip Data
  const tripData = {
    id: id,
    status: 'In Transit',
    origin: 'Mumbai, MH',
    destination: 'Delhi, DL',
    eta: 'Today, 6:30 PM',
    driver: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      rating: 4.8,
      image: '/driver-avatar.png'
    },
    vehicle: 'MH-12-AB-1234',
    timeline: [
      { label: 'Order Placed', time: 'Aug 24, 10:00 AM', completed: true },
      { label: 'Picked Up', time: 'Aug 24, 02:30 PM', completed: true, location: 'Mumbai Hub' },
      { label: 'In Transit', time: 'Processing...', completed: true, status: 'active', subtext: 'Vehicle is moving towards Surat' },
      { label: 'Out for Delivery', time: 'Estimated Aug 26', completed: false },
      { label: 'Delivered', time: 'Estimated Aug 26', completed: false },
    ],
    currentLocation: { lat: 19.0760, lng: 72.8777 },
    path: [
      { lat: 19.0760, lng: 72.8777 },
      { lat: 19.5, lng: 72.9 },
      // ... more points would be here
    ]
  }

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => setLoading(false), 1500)
    }
  }, [id])

  if (loading || !isLoaded) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress color="primary" size={60} thickness={4} />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Tracking {id} | FleetFlow</title>
      </Head>

      {/* Header */}
      <Box sx={{
        p: 2,
        bgcolor: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.push('/')} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h6" color="white" fontWeight={700}>{id}</Typography>
            <Typography variant="caption" color="primary.light">● {tripData.status}</Typography>
          </Box>
        </Box>
        <Button variant="contained" size="small" startIcon={<Share />}>Share</Button>
      </Box>

      <Grid container sx={{ flex: 1, mt: { xs: 8, md: 0 } }}>
        {/* Map Section (Mobile: Top, Desktop: Left) */}
        <Grid item xs={12} md={8} sx={{ position: 'relative', minHeight: { xs: '40vh', md: '100vh' } }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={tripData.currentLocation}
            zoom={8}
            options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true }}
          >
            <Marker
              position={tripData.currentLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: theme.palette.primary.main,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
            />
            {/* Add Path Polyline */}
          </GoogleMap>

          {/* Floating Driver Card */}
          <Card sx={{
            position: 'absolute',
            bottom: 30,
            left: 30,
            p: 2,
            minWidth: 300,
            display: { xs: 'none', md: 'block' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>RK</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{tripData.driver.name}</Typography>
                <Typography variant="caption" color="text.secondary">Vehicle: {tripData.vehicle}</Typography>
              </Box>
              <IconButton sx={{ ml: 'auto', bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                <Phone fontSize="small" />
              </IconButton>
            </Box>
          </Card>
        </Grid>

        {/* Sidebar / Bottom Sheet */}
        <Grid item xs={12} md={4} sx={{
          bgcolor: 'background.paper',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          p: { xs: 3, md: 4 },
          overflowY: 'auto',
          maxHeight: { md: '100vh' }
        }}>
          <Box sx={{ mt: { md: 8 } }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>Shipment Timeline</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Estimated Arrival: <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{tripData.eta}</Box>
            </Typography>

            <Stepper orientation="vertical" activeStep={2}>
              {tripData.timeline.map((step, index) => (
                <Step key={index} active={step.completed}>
                  <StepLabel StepIconComponent={() => (
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: step.completed ? 'primary.main' : (step.status === 'active' ? 'secondary.main' : 'grey.700'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: step.status === 'active' ? `3px solid ${theme.palette.secondary.main}50` : 'none'
                    }}>
                      {step.completed && <CheckCircle sx={{ fontSize: 16, color: 'white' }} />}
                    </Box>
                  )}>
                    <Typography variant="subtitle2" fontWeight={600} color={step.completed || step.status === 'active' ? 'text.primary' : 'text.secondary'}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.time}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ mb: 2 }}>
                      {step.subtext && (
                        <Typography variant="body2" color="text.secondary">{step.subtext}</Typography>
                      )}
                      {step.location && (
                        <Chip icon={<Place fontSize="small" />} label={step.location} size="small" sx={{ mt: 1 }} />
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {/* Mobile Driver Card (hidden on desktop) */}
            <Card sx={{ mt: 4, p: 2, display: { xs: 'block', md: 'none' }, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>RK</Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{tripData.driver.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Vehicle: {tripData.vehicle}</Typography>
                </Box>
                <IconButton sx={{ ml: 'auto', bgcolor: 'primary.main', color: 'white' }}>
                  <Phone />
                </IconButton>
              </Box>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}
