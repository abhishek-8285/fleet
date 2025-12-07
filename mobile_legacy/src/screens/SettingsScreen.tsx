import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Picker } from '@react-native-picker/picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
// Temporarily disable expo-location to isolate prototype error
// import * as Location from 'expo-location'
// Platform-safe import for notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('Expo Notifications not available - using fallback');
}
import { apiService } from '../services/api'

interface SettingsScreenProps {
  language: 'en' | 'hi'
  onLanguageChange: (language: 'en' | 'hi') => void
  onLogout: () => void
  onClose?: () => void
}

interface AppSettings {
  // GPS & Location
  gpsTrackingEnabled: boolean
  gpsTrackingInterval: number // seconds
  highAccuracyMode: boolean
  offlineLocationStorage: boolean
  
  // Notifications  
  pushNotificationsEnabled: boolean
  tripNotifications: boolean
  emergencyAlerts: boolean
  maintenanceReminders: boolean
  notificationSound: boolean
  vibration: boolean
  
  // App Preferences
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'hi'
  autoLogout: boolean
  autoLogoutTime: number // minutes
  
  // Data & Performance
  dataUsageMode: 'high' | 'medium' | 'low'
  imageQuality: 'high' | 'medium' | 'low'
  cacheSize: number // MB
  offlineDataRetention: number // days
  
  // Battery Optimization
  batteryOptimization: boolean
  backgroundAppRefresh: boolean
  reducedAnimations: boolean
}

const defaultSettings: AppSettings = {
  gpsTrackingEnabled: true,
  gpsTrackingInterval: 30,
  highAccuracyMode: true,
  offlineLocationStorage: true,
  pushNotificationsEnabled: true,
  tripNotifications: true,
  emergencyAlerts: true,
  maintenanceReminders: true,
  notificationSound: true,
  vibration: true,
  theme: 'light',
  language: 'en',
  autoLogout: false,
  autoLogoutTime: 30,
  dataUsageMode: 'medium',
  imageQuality: 'medium',
  cacheSize: 100,
  offlineDataRetention: 7,
  batteryOptimization: false,
  backgroundAppRefresh: true,
  reducedAnimations: false
}

const translations = {
  en: {
    title: 'Settings',
    gpsLocation: 'GPS & Location',
    notifications: 'Notifications',
    appPreferences: 'App Preferences',
    dataPerformance: 'Data & Performance',
    batteryOptimization: 'Battery Optimization',
    about: 'About',
    gpsTrackingEnabled: 'GPS Tracking',
    gpsTrackingInterval: 'Tracking Interval',
    highAccuracyMode: 'High Accuracy Mode',
    offlineLocationStorage: 'Offline Location Storage',
    pushNotificationsEnabled: 'Push Notifications',
    tripNotifications: 'Trip Notifications',
    emergencyAlerts: 'Emergency Alerts',
    maintenanceReminders: 'Maintenance Reminders',
    notificationSound: 'Notification Sound',
    vibration: 'Vibration',
    theme: 'Theme',
    language: 'Language',
    autoLogout: 'Auto Logout',
    autoLogoutTime: 'Auto Logout Time',
    dataUsageMode: 'Data Usage Mode',
    imageQuality: 'Image Quality',
    cacheSize: 'Cache Size',
    offlineDataRetention: 'Offline Data Retention',
    batteryOptimizationMode: 'Battery Optimization',
    backgroundAppRefresh: 'Background App Refresh',
    reducedAnimations: 'Reduced Animations',
    save: 'Save Settings',
    cancel: 'Cancel',
    reset: 'Reset to Default',
    confirmReset: 'Reset Settings',
    resetMessage: 'This will reset all settings to default values. Continue?',
    yes: 'Yes',
    no: 'No',
    settingsSaved: 'Settings saved successfully',
    settingsReset: 'Settings reset to default',
    error: 'Error',
    permissionRequired: 'Permission Required',
    locationPermissionRequired: 'Location permission is required for GPS tracking',
    notificationPermissionRequired: 'Notification permission is required for alerts',
    seconds: 'seconds',
    minutes: 'minutes',
    days: 'days',
    mb: 'MB',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto (System)',
    english: 'English',
    hindi: 'हिंदी',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    every15Seconds: 'Every 15 seconds',
    every30Seconds: 'Every 30 seconds',
    every1Minute: 'Every 1 minute',
    every5Minutes: 'Every 5 minutes',
    every10Minutes: 'Every 10 minutes',
    after15Minutes: 'After 15 minutes',
    after30Minutes: 'After 30 minutes',
    after1Hour: 'After 1 hour',
    after2Hours: 'After 2 hours',
    never: 'Never',
    clearCache: 'Clear Cache',
    cacheCleared: 'Cache cleared successfully',
    appVersion: 'App Version',
    buildNumber: 'Build Number',
    lastSync: 'Last Sync',
    deviceInfo: 'Device Info',
    logout: 'Logout',
    confirmLogout: 'Are you sure you want to logout?',
    loggingOut: 'Logging out...'
  },
  hi: {
    title: 'सेटिंग्स',
    gpsLocation: 'GPS और स्थान',
    notifications: 'सूचनाएं',
    appPreferences: 'ऐप प्राथमिकताएं',
    dataPerformance: 'डेटा और प्रदर्शन',
    batteryOptimization: 'बैटरी अनुकूलन',
    about: 'के बारे में',
    gpsTrackingEnabled: 'GPS ट्रैकिंग',
    gpsTrackingInterval: 'ट्रैकिंग अंतराल',
    highAccuracyMode: 'उच्च सटीकता मोड',
    offlineLocationStorage: 'ऑफलाइन स्थान भंडारण',
    pushNotificationsEnabled: 'पुश सूचनाएं',
    tripNotifications: 'यात्रा सूचनाएं',
    emergencyAlerts: 'आपातकालीन अलर्ट',
    maintenanceReminders: 'रखरखाव अनुस्मारक',
    notificationSound: 'सूचना ध्वनि',
    vibration: 'कंपन',
    theme: 'थीम',
    language: 'भाषा',
    autoLogout: 'ऑटो लॉगआउट',
    autoLogoutTime: 'ऑटो लॉगआउट समय',
    dataUsageMode: 'डेटा उपयोग मोड',
    imageQuality: 'छवि गुणवत्ता',
    cacheSize: 'कैश आकार',
    offlineDataRetention: 'ऑफलाइन डेटा प्रतिधारण',
    batteryOptimizationMode: 'बैटरी अनुकूलन',
    backgroundAppRefresh: 'बैकग्राउंड ऐप रिफ्रेश',
    reducedAnimations: 'कम एनीमेशन',
    save: 'सेटिंग्स सेव करें',
    cancel: 'रद्द करें',
    reset: 'डिफ़ॉल्ट पर रीसेट करें',
    confirmReset: 'सेटिंग्स रीसेट करें',
    resetMessage: 'यह सभी सेटिंग्स को डिफ़ॉल्ट मानों पर रीसेट कर देगा। जारी रखें?',
    yes: 'हां',
    no: 'नहीं',
    settingsSaved: 'सेटिंग्स सफलतापूर्वक सेव',
    settingsReset: 'सेटिंग्स डिफ़ॉल्ट पर रीसेट',
    error: 'त्रुटि',
    permissionRequired: 'अनुमति आवश्यक',
    locationPermissionRequired: 'GPS ट्रैकिंग के लिए स्थान अनुमति आवश्यक है',
    notificationPermissionRequired: 'अलर्ट के लिए सूचना अनुमति आवश्यक है',
    seconds: 'सेकंड',
    minutes: 'मिनट',
    days: 'दिन',
    mb: 'MB',
    light: 'हल्का',
    dark: 'डार्क',
    auto: 'ऑटो (सिस्टम)',
    english: 'English',
    hindi: 'हिंदी',
    high: 'उच्च',
    medium: 'मध्यम',
    low: 'कम',
    every15Seconds: 'हर 15 सेकंड',
    every30Seconds: 'हर 30 सेकंड',
    every1Minute: 'हर 1 मिनट',
    every5Minutes: 'हर 5 मिनट',
    every10Minutes: 'हर 10 मिनट',
    after15Minutes: '15 मिनट बाद',
    after30Minutes: '30 मिनट बाद',
    after1Hour: '1 घंटे बाद',
    after2Hours: '2 घंटे बाद',
    never: 'कभी नहीं',
    clearCache: 'कैश साफ करें',
    cacheCleared: 'कैश सफलतापूर्वक साफ',
    appVersion: 'ऐप संस्करण',
    buildNumber: 'बिल्ड नंबर',
    lastSync: 'अंतिम सिंक',
    deviceInfo: 'डिवाइस जानकारी',
    logout: 'लॉगआउट',
    confirmLogout: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
    loggingOut: 'लॉगआउट हो रहा है...'
  }
}

export default function SettingsScreen({ language, onLanguageChange, onLogout, onClose }: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const t = translations[language]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('appSettings')
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings))
      
      // Apply language change immediately
      if (settings.language !== language) {
        onLanguageChange(settings.language)
        await AsyncStorage.setItem('language', settings.language)
      }
      
      Alert.alert('Success', t.settingsSaved)
    } catch (error) {
      console.error('Error saving settings:', error)
      Alert.alert(t.error, 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    Alert.alert(
      t.confirmReset,
      t.resetMessage,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          onPress: async () => {
            setSettings(defaultSettings)
            await AsyncStorage.setItem('appSettings', JSON.stringify(defaultSettings))
            Alert.alert('Success', t.settingsReset)
          }
        }
      ]
    )
  }

  const clearCache = async () => {
    try {
      await AsyncStorage.multiRemove([
        'offlineLocations',
        'offlinePhotos',
        'cachedTrips',
        'cachedDriverProfile'
      ])
      Alert.alert('Success', t.cacheCleared)
    } catch (error) {
      console.error('Error clearing cache:', error)
      Alert.alert(t.error, 'Failed to clear cache')
    }
  }

  const handleGPSToggle = async (enabled: boolean) => {
    if (enabled) {
      console.log('📍 Location permission request temporarily disabled for debugging')
      const status = 'granted' // Mock permission granted
      if (status !== 'granted') {
        Alert.alert(t.permissionRequired, t.locationPermissionRequired)
        return
      }
    }
    updateSetting('gpsTrackingEnabled', enabled)
  }

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(t.permissionRequired, t.notificationPermissionRequired)
        return
      }
    }
    updateSetting('pushNotificationsEnabled', enabled)
  }

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    setLoggingOut(true)
    try {
      await apiService.logout()
      setShowLogoutModal(false)
      onLogout()
    } catch (error) {
      console.error('Logout error:', error)
      onLogout() // Logout even if API call fails
    } finally {
      setLoggingOut(false)
    }
  }

  const getTrackingIntervalText = (interval: number): string => {
    switch (interval) {
      case 15: return t.every15Seconds
      case 30: return t.every30Seconds
      case 60: return t.every1Minute
      case 300: return t.every5Minutes
      case 600: return t.every10Minutes
      default: return `${interval} ${t.seconds}`
    }
  }

  const getAutoLogoutText = (time: number): string => {
    if (time === 0) return t.never
    switch (time) {
      case 15: return t.after15Minutes
      case 30: return t.after30Minutes
      case 60: return t.after1Hour
      case 120: return t.after2Hours
      default: return `${time} ${t.minutes}`
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{t.title}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>💾</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* GPS & Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 {t.gpsLocation}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.gpsTrackingEnabled}</Text>
            <Switch
              value={settings.gpsTrackingEnabled}
              onValueChange={handleGPSToggle}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>

          {settings.gpsTrackingEnabled && (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.gpsTrackingInterval}</Text>
                <TouchableOpacity style={styles.valueButton}>
                  <Text style={styles.valueText}>
                    {getTrackingIntervalText(settings.gpsTrackingInterval)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.highAccuracyMode}</Text>
                <Switch
                  value={settings.highAccuracyMode}
                  onValueChange={(value) => updateSetting('highAccuracyMode', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.offlineLocationStorage}</Text>
                <Switch
                  value={settings.offlineLocationStorage}
                  onValueChange={(value) => updateSetting('offlineLocationStorage', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>
            </>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 {t.notifications}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.pushNotificationsEnabled}</Text>
            <Switch
              value={settings.pushNotificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>

          {settings.pushNotificationsEnabled && (
            <>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.tripNotifications}</Text>
                <Switch
                  value={settings.tripNotifications}
                  onValueChange={(value) => updateSetting('tripNotifications', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.emergencyAlerts}</Text>
                <Switch
                  value={settings.emergencyAlerts}
                  onValueChange={(value) => updateSetting('emergencyAlerts', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.maintenanceReminders}</Text>
                <Switch
                  value={settings.maintenanceReminders}
                  onValueChange={(value) => updateSetting('maintenanceReminders', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.notificationSound}</Text>
                <Switch
                  value={settings.notificationSound}
                  onValueChange={(value) => updateSetting('notificationSound', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t.vibration}</Text>
                <Switch
                  value={settings.vibration}
                  onValueChange={(value) => updateSetting('vibration', value)}
                  trackColor={{ false: '#ccc', true: '#2196F3' }}
                />
              </View>
            </>
          )}
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ {t.appPreferences}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.theme}</Text>
            <TouchableOpacity style={styles.valueButton}>
              <Text style={styles.valueText}>
                {t[settings.theme as keyof typeof t]}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.language}</Text>
            <TouchableOpacity style={styles.valueButton}>
              <Text style={styles.valueText}>
                {settings.language === 'en' ? t.english : t.hindi}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.autoLogout}</Text>
            <Switch
              value={settings.autoLogout}
              onValueChange={(value) => updateSetting('autoLogout', value)}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>

          {settings.autoLogout && (
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{t.autoLogoutTime}</Text>
              <TouchableOpacity style={styles.valueButton}>
                <Text style={styles.valueText}>
                  {getAutoLogoutText(settings.autoLogoutTime)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Data & Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 {t.dataPerformance}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.dataUsageMode}</Text>
            <TouchableOpacity style={styles.valueButton}>
              <Text style={styles.valueText}>
                {t[settings.dataUsageMode as keyof typeof t]}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.imageQuality}</Text>
            <TouchableOpacity style={styles.valueButton}>
              <Text style={styles.valueText}>
                {t[settings.imageQuality as keyof typeof t]}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.cacheSize}</Text>
            <Text style={styles.valueText}>{settings.cacheSize} {t.mb}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.offlineDataRetention}</Text>
            <Text style={styles.valueText}>{settings.offlineDataRetention} {t.days}</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
            <Text style={styles.actionButtonText}>{t.clearCache}</Text>
          </TouchableOpacity>
        </View>

        {/* Battery Optimization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔋 {t.batteryOptimization}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.batteryOptimizationMode}</Text>
            <Switch
              value={settings.batteryOptimization}
              onValueChange={(value) => updateSetting('batteryOptimization', value)}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.backgroundAppRefresh}</Text>
            <Switch
              value={settings.backgroundAppRefresh}
              onValueChange={(value) => updateSetting('backgroundAppRefresh', value)}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.reducedAnimations}</Text>
            <Switch
              value={settings.reducedAnimations}
              onValueChange={(value) => updateSetting('reducedAnimations', value)}
              trackColor={{ false: '#ccc', true: '#2196F3' }}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ {t.about}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.appVersion}</Text>
            <Text style={styles.valueText}>1.0.0</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.buildNumber}</Text>
            <Text style={styles.valueText}>100</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t.lastSync}</Text>
            <Text style={styles.valueText}>
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={resetSettings}>
            <Text style={styles.actionButtonText}>{t.reset}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.actionButtonText}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            <Text style={styles.modalTitle}>{t.confirmLogout}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalButtonText}>{t.no}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>{t.yes}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
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
    color: '#333',
    flex: 1,
    textAlign: 'center'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666'
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  saveButtonText: {
    fontSize: 18,
    color: 'white'
  },
  scrollContainer: {
    flex: 1,
    padding: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 10
  },
  valueButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 15
  },
  valueText: {
    fontSize: 14,
    color: '#666'
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  resetButton: {
    backgroundColor: '#FF9800'
  },
  logoutButton: {
    backgroundColor: '#F44336'
  },
  actionsSection: {
    marginBottom: 30
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    minWidth: 280
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  cancelButton: {
    backgroundColor: '#666'
  },
  confirmButton: {
    backgroundColor: '#F44336'
  }
})
