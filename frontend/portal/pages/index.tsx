import { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Grid,
  Card,
  useTheme,
  Stack,
  IconButton
} from '@mui/material'
import {
  Search,
  LocalShipping,
  Navigation,
  Shield,
  AccessTime,
  RocketLaunch
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const [trackingId, setTrackingId] = useState('')
  const router = useRouter()
  const theme = useTheme()
  const { t } = useTranslation()

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingId.trim()) {
      router.push(`/track/${trackingId}`)
    }
  }

  const FeatureCard = ({ icon: Icon, title, description }: any) => (
    <motion.div whileHover={{ y: -10 }}>
      <Card
        sx={{
          p: 4,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 30px ${theme.palette.primary.main}20`
          }
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}05 100%)`,
            color: theme.palette.primary.main,
            mb: 2
          }}
        >
          <Icon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h6" gutterBottom color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Card>
    </motion.div>
  )

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Head>
        <title>FleetFlow | Premium Shipment Tracking</title>
        <meta name="description" content="Track your shipments with FleetFlow" />
      </Head>

      {/* Abstract Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          background: 'radial-gradient(circle at 50% 10%, #1a2c4e 0%, #0F172A 100%)',
        }}
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 100,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '120%',
            height: '120%',
            background: `conic-gradient(from 0deg at 50% 50%, ${theme.palette.primary.main}10 0deg, transparent 60deg, transparent 300deg, ${theme.palette.primary.main}10 360deg)`,
            opacity: 0.5
          }}
        />
      </Box>

      {/* Navbar */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <RocketLaunch color="primary" />
            FleetFlow
          </Typography>
          <Button variant="outlined" color="primary" href="/login">
            Driver Login
          </Button>
        </Stack>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="md" sx={{ mt: 10, mb: 10, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '3rem', md: '5rem' },
              mb: 2,
              letterSpacing: '-0.02em',
              background: `linear-gradient(to right, #fff, ${theme.palette.primary.light})`,
              backgroundClip: 'text',
              textFillColor: 'transparent'
            }}
          >
            Track Your Journey
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
            Experience real-time logistics transparency with our premium tracking portal. Enter your ID below to get started.
          </Typography>

          <Box
            component="form"
            onSubmit={handleTrack}
            sx={{
              position: 'relative',
              maxWidth: 600,
              mx: 'auto',
              p: 1,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: `0 0 40px ${theme.palette.primary.main}20`,
              display: 'flex',
              transition: 'all 0.3s',
              '&:focus-within': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 60px ${theme.palette.primary.main}30`
              }
            }}
          >
            <InputBase
              fullWidth
              placeholder="Enter Tracking ID (e.g. TRK-8291)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              sx={{
                ml: 2,
                flex: 1,
                color: 'white',
                fontSize: '1.2rem'
              }}
              startAdornment={
                <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 28 }} />
              }
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: theme.palette.gradients.primary,
                boxShadow: `0 10px 20px -5px ${theme.palette.primary.main}50`
              }}
            >
              Track Now
            </Button>
          </Box>
        </motion.div>
      </Container>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ mb: 10 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={Navigation}
              title="Real-time GPS"
              description="Monitor your cargo's exact location with live updates every 30 seconds."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={Shield}
              title="Secure Handling"
              description="End-to-end security for your shipments with verified driver identities."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={AccessTime}
              title="Predictive ETA"
              description="AI-powered arrival estimates that adapt to traffic and weather conditions."
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
// Helper for InputBase (MUI component not imported but used in textfield workaround logic? No, let's use standard TextField or import InputBase)
import { InputBase } from '@mui/material'
