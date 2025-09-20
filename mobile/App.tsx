import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { 
  StyleSheet, 
  Text, 
  View, 
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PermissionsManager } from './src/utils/permissions'
import { locationServiceNoExpo } from './src/services/LocationServiceNoExpo'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { apiService } from './src/services/api'
import { webSocketService } from './src/services/websocket'
import { notificationService } from './src/services/notifications'
import offlineSyncService from './src/services/OfflineSync'

// Import screens
import FuelTrackingScreen from './src/screens/FuelTrackingScreen'
import TripManagementScreen from './src/screens/TripManagementScreen'
import DriverProfileScreen from './src/screens/DriverProfileScreen'
import SettingsScreen from './src/screens/SettingsScreen'

// Import modern UI components and theme
import { Button, Card, Input, Icon, AppIcons } from './src/components/ui'
import { colors, typography, spacing, theme } from './src/theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://10.236.156.17:8080'
const { width, height } = Dimensions.get('window')

// Language context
const languages = {
  en: {
    title: 'FleetFlow Driver',
    login: 'Login',
    phone: 'Phone Number',
    otp: 'OTP Code',
    send: 'Send OTP',
    verify: 'Verify',
    home: 'Home',
    trips: 'Trips',
    fuel: 'Fuel',
    profile: 'Profile',
    emergency: 'Emergency',
    startTrip: 'Start Trip',
    endTrip: 'End Trip',
    acceptTrip: 'Accept Trip',
    rejectTrip: 'Reject Trip',
    trackingOn: 'GPS Tracking: ON',
    trackingOff: 'GPS Tracking: OFF',
    noTrips: 'No active trips',
    fuelPhoto: 'Fuel Receipt Photo',
    deliveryPhoto: 'Delivery Proof Photo',
    currentTrip: 'Current Trip',
    tripHistory: 'Trip History',
    driverStats: 'Driver Stats',
    rating: 'Rating',
    totalTrips: 'Total Trips',
    fuelEfficiency: 'Fuel Efficiency',
    earnings: 'Today\'s Earnings',
    welcomeBack: 'Welcome back',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening'
  },
  hi: {
    title: 'FleetFlow ड्राइवर',
    login: 'लॉग इन',
    phone: 'फोन नंबर',
    otp: 'OTP कोड',
    send: 'OTP भेजें',
    verify: 'सत्यापित करें',
    home: 'होम',
    trips: 'यात्राएं',
    fuel: 'ईंधन',
    profile: 'प्रोफाइल',
    emergency: 'आपातकाल',
    startTrip: 'यात्रा शुरू करें',
    endTrip: 'यात्रा समाप्त करें',
    acceptTrip: 'यात्रा स्वीकार करें',
    rejectTrip: 'यात्रा अस्वीकार करें',
    trackingOn: 'GPS ट्रैकिंग: चालू',
    trackingOff: 'GPS ट्रैकिंग: बंद',
    noTrips: 'कोई सक्रिय यात्रा नहीं',
    fuelPhoto: 'ईंधन रसीद फोटो',
    deliveryPhoto: 'डिलीवरी प्रूफ फोटो',
    currentTrip: 'वर्तमान यात्रा',
    tripHistory: 'यात्रा इतिहास',
    driverStats: 'ड्राइवर आंकड़े',
    rating: 'रेटिंग',
    totalTrips: 'कुल यात्राएं',
    fuelEfficiency: 'ईंधन दक्षता',
    earnings: 'आज की कमाई',
    welcomeBack: 'वापसी पर स्वागत है',
    goodMorning: 'सुप्रभात',
    goodAfternoon: 'नमस्कार',
    goodEvening: 'शुभ संध्या'
  }
}

type Language = 'en' | 'hi'

// Context for language and app state
const AppContext = React.createContext({
  language: 'en' as Language,
  setLanguage: (lang: Language) => {},
  user: null as any,
  setUser: (user: any) => {},
  currentTrip: null as any,
  setCurrentTrip: (trip: any) => {}
})

// Modern Login Screen
function LoginScreen({ navigation, setIsAuthenticated }: any) {
  const [phone, setPhone] = useState('+919876543210')
  const [otp, setOtp] = useState('111111')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  
  const t = languages[language]

  // Format phone number input to ensure +91 prefix
  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    let digits = text.replace(/\D/g, '')
    
    // If starts with 91, add +
    if (digits.startsWith('91') && digits.length >= 12) {
      setPhone('+' + digits)
    }
    // If starts with 9, 8, 7, or 6, add +91
    else if (digits.length === 10 && /^[6-9]/.test(digits)) {
      setPhone('+91' + digits)
    }
    // If already starts with +91, keep as is
    else if (text.startsWith('+91')) {
      setPhone(text)
    }
    // Otherwise, just set the text (let user type)
    else {
      setPhone(text)
    }
  }
  
  const sendOTP = async () => {
    setLoading(true)
    try {
      const result = await apiService.sendOTP(phone)
      
      if (result.success) {
        setOtpSent(true)
        Alert.alert('Success', 'OTP sent to your phone')
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP')
      }
    } catch (error) {
      Alert.alert('Error', 'Network error')
    }
    setLoading(false)
  }
  
  const verifyOTP = async () => {
    setLoading(true)
    try {
      const result = await apiService.verifyOTP({ phone, code: otp })
      
      if (result.success && result.data) {
        // Store auth data (handle both formats)
        const accessToken = result.data.accessToken || result.data.access_token
        const refreshToken = result.data.refreshToken || result.data.refresh_token
        
        await AsyncStorage.setItem('token', accessToken)
        await AsyncStorage.setItem('refreshToken', refreshToken)
        await AsyncStorage.setItem('user', JSON.stringify(result.data.user))
        await AsyncStorage.setItem('language', language)
        
        // Update authentication state to trigger navigation
        setIsAuthenticated(true)
        
        // Initialize services in background (don't block navigation)
        initializeServices(result.data.user).catch(error => {
          console.log('Service initialization failed (non-blocking):', error)
        })
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP')
      }
    } catch (error) {
      Alert.alert('Error', 'Network error')
    }
    setLoading(false)
  }

  const initializeServices = async (user: any) => {
    try {
      // Initialize WebSocket connection
      await webSocketService.connect()
      
      // Initialize push notifications
      await notificationService.initialize()
      
      // Start location tracking
      await locationServiceNoExpo.startSimpleTracking()
      
      // Setup WebSocket event listeners
      webSocketService.on('trip_assigned', (tripData) => {
        notificationService.showTripAssignmentNotification(tripData)
      })
      
      webSocketService.on('trip_updated', (updateData) => {
        notificationService.showTripUpdateNotification(
          updateData.tripId, 
          updateData.status, 
          updateData.message
        )
      })
      
      // Start offline sync
      offlineSyncService.forcSync()
      
      console.log('Services initialized successfully')
    } catch (error) {
      console.error('Error initializing services:', error)
    }
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        {/* Modern Header */}
        <View style={styles.loginHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Icon name="local-shipping" size={32} color={colors.primary} />
            </View>
            <Text style={styles.appTitle}>{t.title}</Text>
            <Text style={styles.appSubtitle}>Professional Fleet Management</Text>
          </View>
        </View>
        
        {/* Language Toggle */}
        <View style={styles.languageToggle}>
          <Button 
            title="English" 
            onPress={() => setLanguage('en')}
            variant={language === 'en' ? 'primary' : 'ghost'}
            size="small"
          />
          <Button 
            title="हिंदी" 
            onPress={() => setLanguage('hi')}
            variant={language === 'hi' ? 'primary' : 'ghost'}
            size="small"
          />
        </View>
        
        <Card style={styles.loginCard}>
          <Text style={styles.loginTitle}>
            {otpSent ? t.verify : t.login}
          </Text>
          
          <Input
            label={t.phone}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="+91 9999999999"
            keyboardType="phone-pad"
            leftIcon="📞"
            editable={!otpSent}
            required
          />
        
          {otpSent && (
            <Input
              label={t.otp}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              leftIcon="🔐"
              required
            />
          )}
          
          <Button 
            title={otpSent ? t.verify : t.send}
            onPress={otpSent ? verifyOTP : sendOTP}
            loading={loading}
            fullWidth
            style={styles.loginButton}
          />
        </Card>
      </View>
    </SafeAreaView>
  )
}

// Modern Home Screen
function HomeScreen() {
  const { language, user, currentTrip, setCurrentTrip } = React.useContext(AppContext)
  const [tracking, setTracking] = useState(false)
  const [stats, setStats] = useState({
    rating: 4.8,
    totalTrips: 127,
    todayEarnings: 850,
    fuelEfficiency: 12.5
  })
  
  const t = languages[language]
  
  useEffect(() => {
    checkLocationPermissions()
    loadStats()
    
    // Cleanup function to prevent event emitter memory leaks
    return () => {
      cleanup()
    }
  }, [])
  
  const cleanup = async () => {
    try {
      console.log('🧹 Cleaning up location services...')
      await locationServiceNoExpo.cleanup()
    } catch (error) {
      console.log('⚠️ Cleanup error:', error)
    }
  }
  
  const checkLocationPermissions = async () => {
    console.log('🔐 Checking permissions...')
    const permissionStatus = await PermissionsManager.checkAllPermissions()
    console.log('📋 Current permissions:', permissionStatus)
    
    // Request camera permission if not granted (location is now handled by pure JS service)
    if (!permissionStatus.camera) {
      console.log('🔐 Requesting camera permission...')
      await PermissionsManager.requestCameraPermission()
    }
  }
  
  const loadStats = async () => {
    try {
      const result = await apiService.getDriverStats()
      if (result.success && result.data) {
        setStats({
          rating: result.data.rating,
          totalTrips: result.data.totalTrips,
          todayEarnings: result.data.todayEarnings,
          fuelEfficiency: result.data.fuelEfficiency
        })
      }
    } catch (error) {
      console.log('Failed to load stats:', error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.goodMorning
    if (hour < 18) return t.goodAfternoon
    return t.goodEvening
  }
  
  const toggleTracking = async () => {
    try {
      if (tracking) {
        const success = await locationServiceNoExpo.stopTracking()
        if (success) {
          setTracking(false)
        } else {
          Alert.alert('Error', 'Failed to stop GPS tracking')
        }
      } else {
        const success = await locationServiceNoExpo.startSimpleTracking()
        if (success) {
          setTracking(true)
        } else {
          Alert.alert('Tracking Error', 'Unable to start location tracking. Using mock mode for development.')
        }
      }
    } catch (error) {
      console.log('🔴 GPS tracking error:', error)
      Alert.alert('GPS Error', `Failed to toggle GPS tracking: ${error.message}`)
    }
  }
  
  const emergencyCall = () => {
    Alert.alert(
      'Emergency',
      'Call emergency services?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 108', onPress: () => console.log('Emergency call') }
      ]
    )
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View style={styles.homeHeader}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.driverName}>{user?.name || 'Driver'}</Text>
          </View>
          <Button 
            title=""
            icon="🚨"
            onPress={emergencyCall}
            variant="error"
            size="small"
            style={styles.emergencyButton}
          />
        </View>
        
        {/* GPS Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusInfo}>
              <Icon 
                name={tracking ? 'gps-fixed' : 'gps-off'} 
                size={24} 
                color={tracking ? colors.success : colors.error} 
              />
              <Text style={[styles.statusText, { color: tracking ? colors.success : colors.error }]}>
                {tracking ? t.trackingOn : t.trackingOff}
              </Text>
            </View>
            <Button
              title={tracking ? 'Stop GPS' : 'Start GPS'}
              onPress={toggleTracking}
              variant={tracking ? 'error' : 'success'}
              size="small"
            />
          </View>
        </Card>
        
        {/* Current Trip */}
        {currentTrip ? (
          <Card style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripTitleSection}>
                <Icon name="local-shipping" size={20} color={colors.primary} />
                <Text style={styles.tripTitle}>{t.currentTrip}</Text>
              </View>
              <View style={[styles.tripStatusBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.tripStatusText}>IN PROGRESS</Text>
              </View>
            </View>
            
            <View style={styles.tripDetails}>
              <View style={styles.tripRoute}>
                <Icon name="location-on" size={16} color={colors.primary} />
                <Text style={styles.tripLocation}>{currentTrip.pickup}</Text>
              </View>
              <View style={styles.routeArrow}>
                <Icon name="keyboard-arrow-down" size={20} color={colors.gray500} />
              </View>
              <View style={styles.tripRoute}>
                <Icon name="location-on" size={16} color={colors.success} />
                <Text style={styles.tripLocation}>{currentTrip.destination}</Text>
              </View>
            </View>
            
            <Text style={styles.tripCustomer}>
              Customer: {currentTrip.customer}
            </Text>
            
            <View style={styles.tripActions}>
              <Button 
                title="Navigate"
                icon="🗺️"
                onPress={() => {}}
                variant="primary"
                size="small"
              />
              <Button 
                title="Complete"
                icon="✅"
                onPress={() => {}}
                variant="success"
                size="small"
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.noTripCard}>
            <View style={styles.noTripContent}>
              <Icon name="local-shipping" size={48} color={colors.gray400} />
              <Text style={styles.noTripText}>{t.noTrips}</Text>
              <Text style={styles.noTripSubtext}>You'll be notified when new trips are available</Text>
            </View>
          </Card>
        )}
        
        {/* Driver Stats */}
        <Card style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Icon name="bar-chart" size={20} color={colors.primary} />
            <Text style={styles.statsTitle}>{t.driverStats}</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="star" size={20} color={colors.warning} />
              <Text style={styles.statValue}>{stats.rating}</Text>
              <Text style={styles.statLabel}>{t.rating}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="directions" size={20} color={colors.primary} />
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>{t.totalTrips}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="attach-money" size={20} color={colors.success} />
              <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
              <Text style={styles.statLabel}>{t.earnings}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="local-gas-station" size={20} color={colors.info} />
              <Text style={styles.statValue}>{stats.fuelEfficiency}km/L</Text>
              <Text style={styles.statLabel}>{t.fuelEfficiency}</Text>
            </View>
          </View>
        </Card>
        
        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button 
              title="Test Camera"
              icon="📷"
              onPress={() => PermissionsManager.testCamera()}
              variant="outline"
              size="small"
            />
            <Button 
              title="Test GPS"
              icon="📍"
              onPress={() => locationServiceNoExpo.showLocationInstructions()}
              variant="outline"
              size="small"
            />
            <Button 
              title="Permissions"
              icon="🔐"
              onPress={() => PermissionsManager.showPermissionStatus()}
              variant="outline"
              size="small"
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

// Enhanced Trips Screen
function TripsScreen() {
  const { language } = React.useContext(AppContext)
  
  return (
    <TripManagementScreen language={language} />
  )
}

// Enhanced Fuel Tracking Screen
function FuelScreen() {
  const { language } = React.useContext(AppContext)
  
  return (
    <FuelTrackingScreen language={language} />
  )
}

// Enhanced Profile Screen with Settings
function ProfileScreen({ navigation }: any) {
  const { language, setLanguage } = React.useContext(AppContext)
  const [showSettings, setShowSettings] = useState(false)
  
  const handleLanguageChange = (newLanguage: 'en' | 'hi') => {
    setLanguage(newLanguage)
  }
  
  const handleLogout = async () => {
    try {
      await apiService.logout()
      // setIsAuthenticated(false) // Update auth state to trigger navigation
    } catch (error) {
      console.log('Logout error:', error)
      await clearAuthData()
      // setIsAuthenticated(false) // Ensure logout even if API call fails
    }
  }
  
  const clearAuthData = async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user', 'currentTrip'])
  }
  
  return (
    <View style={{ flex: 1 }}>
      <DriverProfileScreen 
        language={language} 
        navigation={navigation}
        onOpenSettings={() => setShowSettings(true)}
      />
      
      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide">
        <SettingsScreen
          language={language}
          onLanguageChange={handleLanguageChange}
          onLogout={handleLogout}
          onClose={() => setShowSettings(false)}
        />
      </Modal>
    </View>
  )
}

// Modern Tab Navigator
function TabNavigator() {
  const { language } = React.useContext(AppContext)
  const t = languages[language]
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = ''
          
          if (route.name === 'Home') iconName = 'home'
          else if (route.name === 'Trips') iconName = 'local-shipping'
          else if (route.name === 'Fuel') iconName = 'local-gas-station'
          else if (route.name === 'Profile') iconName = 'person'
          
          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.home }} />
      <Tab.Screen name="Trips" component={TripsScreen} options={{ title: t.trips }} />
      <Tab.Screen name="Fuel" component={FuelScreen} options={{ title: t.fuel }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.profile }} />
    </Tab.Navigator>
  )
}

// Main App Component
export default function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [user, setUser] = useState(null)
  const [currentTrip, setCurrentTrip] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking
  
  useEffect(() => {
    checkAuthenticationState()
  }, [])
  
  const checkAuthenticationState = async () => {
    try {
      // Load saved app state
      const savedLanguage = await AsyncStorage.getItem('language')
      const savedUser = await AsyncStorage.getItem('user')
      const savedTrip = await AsyncStorage.getItem('currentTrip')
      const savedToken = await AsyncStorage.getItem('token')
      
      if (savedLanguage) setLanguage(savedLanguage as Language)
      if (savedUser) setUser(JSON.parse(savedUser))
      if (savedTrip) setCurrentTrip(JSON.parse(savedTrip))
      
      // Check if user has valid authentication
      if (savedToken && savedUser) {
        // Validate token by making a simple API call
        try {
          const result = await apiService.getDriverProfile()
          if (result.success) {
            // Token is valid, user is authenticated
            setIsAuthenticated(true)
            console.log('✅ Auto-login successful with existing token')
          } else {
            // Token expired, try refresh
            await attemptTokenRefresh()
          }
        } catch (error) {
          // Token validation failed, try refresh
          await attemptTokenRefresh()
        }
      } else {
        // No token or user data, require login
        setIsAuthenticated(false)
        console.log('❌ No saved authentication, showing login')
      }
    } catch (error) {
      console.error('Authentication check failed:', error)
      setIsAuthenticated(false)
    }
  }
  
  const attemptTokenRefresh = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken')
      if (refreshToken) {
        const result = await apiService.refreshToken()
        if (result.success && result.data) {
          // Update stored token
          await AsyncStorage.setItem('token', result.data.accessToken)
          setIsAuthenticated(true)
          console.log('✅ Token refreshed successfully')
        } else {
          // Refresh failed, require login
          await clearAuthData()
          setIsAuthenticated(false)
          console.log('❌ Token refresh failed, requiring login')
        }
      } else {
        // No refresh token, require login
        setIsAuthenticated(false)
        console.log('❌ No refresh token, requiring login')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      await clearAuthData()
      setIsAuthenticated(false)
    }
  }
  
  const clearAuthData = async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user', 'currentTrip'])
    setUser(null)
    setCurrentTrip(null)
  }
  
  const updateLanguage = async (lang: Language) => {
    setLanguage(lang)
    await AsyncStorage.setItem('language', lang)
  }
  
  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingLogo}>
              <Icon name="local-shipping" size={48} color={colors.primary} />
            </View>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>FleetFlow</Text>
            <Text style={styles.loadingSubtext}>Checking authentication...</Text>
          </View>
        </View>
      </SafeAreaProvider>
    )
  }
  
  return (
    <SafeAreaProvider>
      <AppContext.Provider value={{
        language,
        setLanguage: updateLanguage,
        user,
        setUser,
        currentTrip,
        setCurrentTrip
      }}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              // User is authenticated, show main app
              <Stack.Screen name="Main" component={TabNavigator} />
            ) : (
              // User is not authenticated, show login
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </AppContext.Provider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    ...typography.styles.h3,
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    ...typography.styles.bodyMedium,
    color: colors.textSecondary,
  },
  
  // Login Screen Styles
  loginContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appTitle: {
    ...typography.styles.h2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  appSubtitle: {
    ...typography.styles.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  languageToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  loginCard: {
    marginBottom: spacing.xl,
  },
  loginTitle: {
    ...typography.styles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: spacing.md,
  },
  
  // Home Screen Styles
  scrollContainer: {
    flex: 1,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    ...typography.styles.bodyMedium,
    color: colors.textSecondary,
  },
  driverName: {
    ...typography.styles.h4,
    color: colors.textPrimary,
    marginTop: 2,
  },
  emergencyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  
  // Status Card Styles
  statusCard: {
    margin: spacing.lg,
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    ...typography.styles.labelLarge,
    marginLeft: spacing.sm,
  },
  
  // Trip Card Styles
  tripCard: {
    margin: spacing.lg,
    marginVertical: spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tripTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  tripStatusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.full,
  },
  tripStatusText: {
    ...typography.styles.caption,
    color: colors.white,
    fontWeight: '600',
  },
  tripDetails: {
    marginBottom: spacing.md,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripLocation: {
    ...typography.styles.bodyMedium,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  routeArrow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  tripCustomer: {
    ...typography.styles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  tripActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  
  // No Trip Card Styles
  noTripCard: {
    margin: spacing.lg,
    marginVertical: spacing.md,
  },
  noTripContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noTripText: {
    ...typography.styles.h6,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  noTripSubtext: {
    ...typography.styles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Stats Card Styles
  statsCard: {
    margin: spacing.lg,
    marginVertical: spacing.md,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statsTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.sm,
  },
  statValue: {
    ...typography.styles.h5,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  
  // Quick Actions Styles
  quickActionsCard: {
    margin: spacing.lg,
    marginVertical: spacing.md,
    marginBottom: spacing['2xl'],
  },
  quickActionsTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  
  // Tab Bar Styles
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    ...spacing.shadows.sm,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    height: Platform.OS === 'ios' ? 90 : 70,
  },
  tabBarLabel: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
})