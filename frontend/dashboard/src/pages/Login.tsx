import { useState } from 'react'
import { 
  Box, 
  Button, 
  Stack, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Divider
} from '@mui/material'
import { Phone, Lock, Language } from '@mui/icons-material'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en')
  
  // Fallback to username/password for development
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loginMode, setLoginMode] = useState<'otp' | 'fallback'>('otp')

  const text = {
    en: {
      title: 'FleetFlow India',
      subtitle: 'Fleet Management System',
      mobileNumber: 'Enter Mobile Number',
      enterOtp: 'Enter OTP',
      sendOtp: 'Send OTP',
      login: 'LOGIN',
      resendOtp: 'Resend OTP',
      username: 'Username',
      password: 'Password',
      fallback: 'Use Username/Password',
      useOtp: 'Use OTP Login'
    },
    hi: {
      title: 'फ्लीटफ्लो इंडिया',
      subtitle: 'फ्लीट प्रबंधन प्रणाली',
      mobileNumber: 'मोबाइल नंबर दर्ज करें',
      enterOtp: 'OTP दर्ज करें',
      sendOtp: 'OTP भेजें',
      login: 'लॉगिन',
      resendOtp: 'OTP दोबारा भेजें',
      username: 'उपयोगकर्ता नाम',
      password: 'पासवर्ड',
      fallback: 'उपयोगकर्ता नाम/पासवर्ड का उपयोग करें',
      useOtp: 'OTP लॉगिन का उपयोग करें'
    }
  }

  const currentText = text[language as keyof typeof text]

  async function sendOtp() {
    setError('')
    if (!phone) return setError('Please enter mobile number')
    
    try {
      const res = await fetch('/api/v1/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` })
      })
      if (res.ok) {
        setOtpSent(true)
      } else {
        setError('Failed to send OTP')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  async function verifyOtp() {
    setError('')
    if (!otp) return setError('Please enter OTP')
    
    try {
      const res = await fetch('/api/v1/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp: otp })
      })
      if (res.ok) {
        const json = await res.json()
        localStorage.setItem('token', json.token)
        if (json.refreshToken) localStorage.setItem('refreshToken', json.refreshToken)
        window.location.href = '/'
      } else {
        setError('Invalid OTP')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  async function fallbackLogin() {
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) return setError('Invalid credentials')
    const json = await res.json()
    localStorage.setItem('token', json.token)
    if (json.refreshToken) localStorage.setItem('refreshToken', json.refreshToken)
    window.location.href = '/'
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={8}
          sx={{ 
            p: 4, 
            borderRadius: 3,
            textAlign: 'center',
            background: '#FAFAFA'
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: 'primary.main',
                mb: 1
              }}
            >
              🚛 {currentText.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {currentText.subtitle}
            </Typography>
          </Box>

          {/* Language Toggle */}
          <Box sx={{ mb: 4 }}>
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={(_, value) => value && setLanguage(value)}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="hi">🌐 हिंदी</ToggleButton>
              <ToggleButton value="en">🌐 English</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {loginMode === 'otp' ? (
            <Stack spacing={3} sx={{ maxWidth: 400, mx: 'auto' }}>
              {/* Mobile Number Input */}
              <TextField
                fullWidth
                label={currentText.mobileNumber}
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <Phone color="primary" sx={{ mr: 1 }} />
                      <Typography color="text.secondary">+91</Typography>
                    </Box>
                  ),
                }}
                disabled={otpSent}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    minHeight: 56
                  }
                }}
              />

              {/* OTP Input (shown after sending OTP) */}
              {otpSent && (
                <TextField
                  fullWidth
                  label={currentText.enterOtp}
                  placeholder="1 2 3 4 5 6"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  InputProps={{
                    startAdornment: <Lock color="primary" sx={{ mr: 2 }} />,
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2,
                      minHeight: 56,
                      letterSpacing: '0.5em',
                      textAlign: 'center'
                    }
                  }}
                />
              )}

              {/* Error Message */}
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}

              {/* Action Buttons */}
              {!otpSent ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={sendOtp}
                  disabled={phone.length !== 10}
                  sx={{ 
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2
                  }}
                >
                  {currentText.sendOtp}
                </Button>
              ) : (
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={verifyOtp}
                    disabled={otp.length !== 6}
                    sx={{ 
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 2
                    }}
                  >
                    {currentText.login}
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                    sx={{ color: 'primary.main' }}
                  >
                    {currentText.resendOtp}
                  </Button>
                </Stack>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                onClick={() => setLoginMode('fallback')}
                sx={{ py: 1.5 }}
              >
                {currentText.fallback}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3} sx={{ maxWidth: 400, mx: 'auto' }}>
              <TextField
                fullWidth
                label={currentText.username}
                value={username}
                onChange={e => setUsername(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    minHeight: 56
                  }
                }}
              />
              <TextField
                fullWidth
                label={currentText.password}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    minHeight: 56
                  }
                }}
              />
              
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                size="large"
                onClick={fallbackLogin}
                sx={{ 
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2
                }}
              >
                {currentText.login}
              </Button>

              <Divider sx={{ my: 2 }} />
              
              <Button
                variant="outlined"
                onClick={() => setLoginMode('otp')}
                sx={{ py: 1.5 }}
              >
                {currentText.useOtp}
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  )
}

