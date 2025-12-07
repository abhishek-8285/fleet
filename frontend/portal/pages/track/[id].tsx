import React, { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Grid,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  LocalShipping as TruckIcon,
  CheckCircle as CheckIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Map as MapIcon,
  Person as DriverIcon,
  ExpandMore as ExpandMoreIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api'
import { useTranslation } from 'react-i18next'
import moment from 'moment'
import QRCode from 'qrcode.react'

interface TripStatus {
  id: string
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered'
  timestamp: string
  location?: string
  description: string
}

interface Driver {
  name: string
  phone: string
  photo?: string
  rating: number
  experience: string
}

interface Vehicle {
  licensePlate: string
  make: string
  model: string
  photo?: string
}

interface TrackingData {
  trackingId: string
  customerName: string
  customerPhone: string
  pickupAddress: string
  deliveryAddress: string
  currentStatus: string
  estimatedDelivery: string
  progress: number
  currentLocation?: {
    lat: number
    lng: number
    address: string
    timestamp: string
  }
  driver: Driver
  vehicle: Vehicle
  statusHistory: TripStatus[]
  route?: {
    lat: number
    lng: number
  }[]
  documents?: {
    name: string
    url: string
    type: 'pickup' | 'delivery' | 'invoice'
  }[]
  charges: {
    baseRate: number
    distance: number
    fuelSurcharge: number
    total: number
    currency: 'INR'
  }
  companyInfo: {
    name: string
    phone: string
    email: string
    logo?: string
  }
}

export default function TrackingPage({ initialData }: { initialData: TrackingData | null }) {
  const router = useRouter()
  const { id } = router.query
  const { t, i18n } = useTranslation()
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    if (!initialData && id) {
      fetchTrackingData()
    }
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (trackingData && trackingData.currentStatus !== 'delivered') {
        refreshData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [id, initialData])

  const fetchTrackingData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/track/${id}`)
      
      if (response.ok) {
        const data = await response.json()
        setTrackingData(data)
        setError(null)
      } else if (response.status === 404) {
        setError(t('tracking.notFound'))
      } else {
        setError(t('tracking.error'))
      }
    } catch (err) {
      setError(t('tracking.networkError'))
    }
    setLoading(false)
  }

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/track/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTrackingData(data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Failed to refresh data:', err)
    }
  }

  const getStatusSteps = () => [
    { key: 'pending', label: t('status.pending'), icon: '📦' },
    { key: 'picked_up', label: t('status.pickedUp'), icon: '🚛' },
    { key: 'in_transit', label: t('status.inTransit'), icon: '🛣️' },
    { key: 'out_for_delivery', label: t('status.outForDelivery'), icon: '🚚' },
    { key: 'delivered', label: t('status.delivered'), icon: '✅' }
  ]

  const getCurrentStepIndex = () => {
    if (!trackingData) return 0
    const steps = getStatusSteps()
    return steps.findIndex(step => step.key === trackingData.currentStatus)
  }

  const shareTracking = async () => {
    const url = window.location.href
    const text = t('share.text', { trackingId: trackingData?.trackingId })
    
    if (navigator.share) {
      try {
        await navigator.share({ title: t('share.title'), text, url })
      } catch (error) {
        // Fallback to clipboard if share fails or is cancelled
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url)
          alert(t('share.copied'))
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea')
          textArea.value = url
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          alert(t('share.copied'))
        }
      }
    } else {
      // Fallback to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert(t('share.copied'))
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert(t('share.copied'))
      }
    }
  }

  const callDriver = () => {
    if (trackingData?.driver.phone) {
      window.open(`tel:${trackingData.driver.phone}`)
    }
  }

  const sendWhatsApp = () => {
    if (trackingData?.driver.phone) {
      const message = t('whatsapp.message', { trackingId: trackingData.trackingId })
      const url = `https://wa.me/${trackingData.driver.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {t('tracking.loading')}
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Paper>
      </Container>
    )
  }

  if (error || !trackingData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || t('tracking.notFound')}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/')}
            sx={{ mt: 2 }}
          >
            {t('common.backHome')}
          </Button>
        </Paper>
      </Container>
    )
  }

  return (
    <>
      <Head>
        <title>{t('tracking.title', { id: trackingData.trackingId })} | FleetFlow</title>
        <meta name="description" content={t('tracking.metaDescription', { id: trackingData.trackingId })} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" gutterBottom>
                🚛 FleetFlow Tracking
              </Typography>
              <Typography variant="h6">
                {t('tracking.id')}: {trackingData.trackingId}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('tracking.lastUpdated')}: {moment(lastUpdated).format('HH:mm:ss')}
              </Typography>
            </Box>
            <Box>
              <IconButton color="inherit" onClick={refreshData} title={t('common.refresh')}>
                <RefreshIcon />
              </IconButton>
              <IconButton color="inherit" onClick={shareTracking} title={t('common.share')}>
                <ShareIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Main Tracking Panel */}
          <Grid item xs={12} md={8}>
            {/* Current Status */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  📦 {t('tracking.currentStatus')}
                </Typography>
                <Chip
                  label={t(`status.${trackingData.currentStatus}`)}
                  color={trackingData.currentStatus === 'delivered' ? 'success' : 'primary'}
                  icon={<TruckIcon />}
                />
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={trackingData.progress} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {trackingData.progress}% {t('tracking.complete')}
              </Typography>

              {trackingData.currentLocation && (
                <Alert severity="info" icon={<LocationIcon />}>
                  <Typography variant="body2">
                    {t('tracking.currentLocation')}: {trackingData.currentLocation.address}
                  </Typography>
                  <Typography variant="caption">
                    {moment(trackingData.currentLocation.timestamp).fromNow()}
                  </Typography>
                </Alert>
              )}
            </Paper>

            {/* Progress Stepper */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📍 {t('tracking.journey')}
              </Typography>
              <Stepper activeStep={getCurrentStepIndex()} orientation="vertical">
                {getStatusSteps().map((step, index) => {
                  const status = trackingData.statusHistory.find(s => s.status === step.key)
                  return (
                    <Step key={step.key}>
                      <StepLabel
                        StepIconComponent={() => (
                          <Avatar sx={{ 
                            bgcolor: index <= getCurrentStepIndex() ? 'primary.main' : 'grey.300',
                            color: 'white',
                            width: 32,
                            height: 32,
                            fontSize: '1rem'
                          }}>
                            {step.icon}
                          </Avatar>
                        )}
                      >
                        <Typography variant="subtitle1">
                          {step.label}
                        </Typography>
                        {status && (
                          <Typography variant="caption" color="text.secondary">
                            {moment(status.timestamp).format('DD MMM, HH:mm')}
                          </Typography>
                        )}
                      </StepLabel>
                      {status && (
                        <StepContent>
                          <Typography variant="body2" color="text.secondary">
                            {status.description}
                          </Typography>
                          {status.location && (
                            <Typography variant="caption" display="block">
                              📍 {status.location}
                            </Typography>
                          )}
                        </StepContent>
                      )}
                    </Step>
                  )
                })}
              </Stepper>
            </Paper>

            {/* Route Map */}
            {trackingData.currentLocation && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  🗺️ {t('tracking.liveMap')}
                </Typography>
                <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
                  <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={trackingData.currentLocation}
                      zoom={12}
                    >
                      <Marker
                        position={trackingData.currentLocation}
                        icon={
                          typeof google !== 'undefined'
                            ? {
                                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="16" cy="16" r="15" fill="#1976d2" stroke="white" stroke-width="2"/>
                                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🚛</text>
                                  </svg>
                                `)}`,
                                scaledSize: new google.maps.Size(32, 32)
                              }
                            : undefined
                        }
                        title={`${trackingData.vehicle.licensePlate} - ${trackingData.driver.name}`}
                      />
                      
                      {trackingData.route && (
                        <Polyline
                          path={trackingData.route}
                          options={{
                            strokeColor: '#2196F3',
                            strokeOpacity: 0.8,
                            strokeWeight: 3
                          }}
                        />
                      )}
                    </GoogleMap>
                  </LoadScript>
                </Box>
              </Paper>
            )}
            
            {/* Fallback when Google Maps isn't configured */}
            {trackingData.currentLocation && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📍 {t('tracking.currentLocation')}
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Current Location:</strong> {trackingData.currentLocation.address}
                  </Typography>
                  <Typography variant="caption" display="block">
                    📌 Lat: {trackingData.currentLocation.lat.toFixed(4)}, Lng: {trackingData.currentLocation.lng.toFixed(4)}
                  </Typography>
                  <Typography variant="caption" display="block">
                    🕐 Last updated: {moment(trackingData.currentLocation.timestamp).fromNow()}
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  💡 Configure Google Maps API key to see live map visualization
                </Typography>
              </Paper>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Delivery Information */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 {t('tracking.shipmentDetails')}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="primary">
                  {t('tracking.from')}
                </Typography>
                <Typography variant="body2">
                  📍 {trackingData.pickupAddress}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="primary">
                  {t('tracking.to')}
                </Typography>
                <Typography variant="body2">
                  🎯 {trackingData.deliveryAddress}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle2" color="primary">
                  {t('tracking.estimatedDelivery')}
                </Typography>
                <Typography variant="body2">
                  ⏰ {moment(trackingData.estimatedDelivery).format('DD MMM YYYY, HH:mm')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({moment(trackingData.estimatedDelivery).fromNow()})
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  💰 {t('tracking.charges')}
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('charges.baseRate')}</Typography>
                  <Typography variant="body2">₹{trackingData.charges.baseRate}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{t('charges.fuelSurcharge')}</Typography>
                  <Typography variant="body2">₹{trackingData.charges.fuelSurcharge}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="subtitle2">{t('charges.total')}</Typography>
                  <Typography variant="subtitle2" color="primary">
                    ₹{trackingData.charges.total}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Driver & Vehicle Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                👨‍✈️ {t('tracking.driverInfo')}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  src={trackingData.driver.photo}
                  sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}
                >
                  {trackingData.driver.name.charAt(0)}
                </Avatar>
                <Box flexGrow={1}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {trackingData.driver.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⭐ {trackingData.driver.rating}/5 • {trackingData.driver.experience}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PhoneIcon />}
                  onClick={callDriver}
                  fullWidth
                >
                  {t('common.call')}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  onClick={sendWhatsApp}
                  fullWidth
                >
                  WhatsApp
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="primary" gutterBottom>
                🚛 {t('tracking.vehicleInfo')}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {trackingData.vehicle.licensePlate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {trackingData.vehicle.make} {trackingData.vehicle.model}
              </Typography>
            </Paper>

            {/* QR Code & Share */}
            <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                📱 {t('tracking.shareTracking')}
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={2}>
                <QRCode value={typeof window !== 'undefined' ? window.location.href : ''} size={120} />
              </Box>
              
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {t('tracking.qrHelp')}
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={shareTracking}
                fullWidth
              >
                {t('common.share')}
              </Button>
            </Paper>

            {/* Company Info */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🏢 {t('tracking.companyInfo')}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight="bold">
                {trackingData.companyInfo.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                📞 {trackingData.companyInfo.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✉️ {trackingData.companyInfo.email}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Language Selector FAB */}
        <Fab
          size="small"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'primary.main',
            color: 'white'
          }}
          onClick={() => {
            const newLang = i18n.language === 'en' ? 'hi' : 'en'
            i18n.changeLanguage(newLang)
          }}
        >
          🌐
        </Fab>
      </Container>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string }
  
  try {
    // For customer portal, we use the local API routes
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
      : 'http://localhost:3001'
    
    const response = await fetch(`${baseUrl}/api/track/${id}`)
    
    if (response.ok) {
      const data = await response.json()
      return { props: { initialData: data } }
    }
  } catch (error) {
    console.error('Failed to fetch tracking data:', error)
  }
  
  return { props: { initialData: null } }
}
