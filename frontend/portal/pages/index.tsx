import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material'
import {
  Search as SearchIcon,
  LocalShipping as TruckIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  QrCodeScanner as QrIcon,
  Smartphone as PhoneAppIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

export default function HomePage() {
  const router = useRouter()
  const { t, i18n } = useTranslation()
  
  const [trackingId, setTrackingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoDialogOpen, setDemoDialogOpen] = useState(false)

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      setError(t('home.enterTrackingId'))
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Validate tracking ID format (optional)
      if (!/^[A-Z0-9]+$/.test(trackingId.toUpperCase())) {
        setError(t('home.invalidFormat'))
        setLoading(false)
        return
      }

      // Navigate to tracking page
      router.push(`/track/${trackingId.toUpperCase()}`)
    } catch (err) {
      setError(t('home.trackingError'))
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleTrack()
    }
  }

  const features = [
    {
      icon: <TruckIcon fontSize="large" />,
      title: t('features.realTimeTracking.title'),
      description: t('features.realTimeTracking.description'),
      color: '#2196F3'
    },
    {
      icon: <ScheduleIcon fontSize="large" />,
      title: t('features.estimatedDelivery.title'),
      description: t('features.estimatedDelivery.description'),
      color: '#FF9800'
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: t('features.secureShipping.title'),
      description: t('features.secureShipping.description'),
      color: '#4CAF50'
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: t('features.fastDelivery.title'),
      description: t('features.fastDelivery.description'),
      color: '#9C27B0'
    }
  ]

  const trackingSteps = [
    t('steps.pickup'),
    t('steps.inTransit'),
    t('steps.outForDelivery'),
    t('steps.delivered')
  ]

  const demoTrackingIds = [
    'RTC240801001', // In Transit to Delhi
    'RTC240801002', // Out for Delivery in Bangalore  
    'RTC240801003', // Delivered in Mumbai
    'DEMO001',      // Premium Service Demo (Live)
    'DEMO002'       // Long Distance Demo (Live)
  ]

  return (
    <>
      <Head>
        <title>FleetFlow - Real-time Fleet Tracking</title>
        <meta name="description" content={t('home.metaDescription')} />
        <meta name="keywords" content="fleet tracking, cargo tracking, shipment tracking, India logistics" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* SEO and Social Media Tags */}
        <meta property="og:title" content="FleetFlow - Real-time Fleet Tracking" />
        <meta property="og:description" content={t('home.metaDescription')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "FleetFlow",
              "description": t('home.metaDescription'),
              "url": "https://fleetflow.in",
              "logo": "https://fleetflow.in/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-9999999999",
                "contactType": "customer service"
              }
            })
          }}
        />
      </Head>

      {/* Hero Section */}
      <Box sx={{ 
        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 8,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
              🚛 FleetFlow
            </Typography>
            <Typography variant="h4" component="h2" gutterBottom sx={{ opacity: 0.9 }}>
              {t('home.heroTitle')}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
              {t('home.heroSubtitle')}
            </Typography>

            {/* Tracking Input */}
            <Paper sx={{ p: 2, maxWidth: 500, mx: 'auto', mb: 4 }}>
              <Box display="flex" alignItems="center">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('home.trackingPlaceholder')}
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleTrack}
                  disabled={loading}
                  sx={{ 
                    minWidth: 120,
                    height: 56,
                    bgcolor: 'primary.main'
                  }}
                >
                  {loading ? '...' : t('home.trackButton')}
                </Button>
              </Box>
            </Paper>

            {/* Demo Button */}
            <Button
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'white',
                '&:hover': { 
                  borderColor: 'white', 
                  bgcolor: 'rgba(255,255,255,0.1)' 
                }
              }}
              onClick={() => setDemoDialogOpen(true)}
            >
              {t('home.tryDemo')}
            </Button>

            {/* Language Toggle */}
            <Box mt={3}>
              <Chip
                icon={<LanguageIcon />}
                label={i18n.language === 'en' ? 'हिंदी' : 'English'}
                clickable
                variant="outlined"
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => {
                  const newLang = i18n.language === 'en' ? 'hi' : 'en'
                  i18n.changeLanguage(newLang)
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* How It Works */}
        <Box mb={8}>
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            {t('home.howItWorks')}
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" mb={4}>
            {t('home.howItWorksSubtitle')}
          </Typography>
          
          <Stepper alternativeLabel>
            {trackingSteps.map((label, index) => (
              <Step key={index} active={true}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      {index + 1}
                    </Avatar>
                  )}
                >
                  <Typography variant="subtitle1" sx={{ mt: 1 }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Features */}
        <Box mb={8}>
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
            {t('home.whyChooseUs')}
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  textAlign: 'center',
                  '&:hover': { 
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.3s ease-in-out',
                    boxShadow: 4
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: feature.color, 
                      width: 64, 
                      height: 64, 
                      mx: 'auto', 
                      mb: 2 
                    }}>
                      {feature.icon}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Stats */}
        <Paper sx={{ p: 4, mb: 8, bgcolor: 'primary.main', color: 'white' }}>
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" fontWeight="bold">50,000+</Typography>
              <Typography variant="h6">{t('stats.deliveries')}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" fontWeight="bold">98.5%</Typography>
              <Typography variant="h6">{t('stats.satisfaction')}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h3" fontWeight="bold">24/7</Typography>
              <Typography variant="h6">{t('stats.support')}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Contact Information */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                📞 {t('contact.title')}
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('contact.phone')}
                    secondary="+91 9999-999-999"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('contact.email')}
                    secondary="support@fleetflow.in"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SupportIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('contact.hours')}
                    secondary={t('contact.available')}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 4, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                📱 {t('mobile.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                {t('mobile.description')}
              </Typography>
              <Box display="flex" gap={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<PhoneAppIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  {t('mobile.android')}
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PhoneAppIcon />}
                  sx={{ flexGrow: 1 }}
                >
                  {t('mobile.ios')}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Demo Dialog */}
      <Dialog open={demoDialogOpen} onClose={() => setDemoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('demo.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {t('demo.description')}
          </Typography>
          <List>
            {demoTrackingIds.map((id, index) => (
              <ListItem key={id} button onClick={() => {
                setTrackingId(id)
                setDemoDialogOpen(false)
                router.push(`/track/${id}`)
              }}>
                <ListItemIcon>
                  <TruckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={id}
                  secondary={t(`demo.status${index + 1}`)}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDemoDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
