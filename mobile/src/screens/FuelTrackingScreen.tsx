import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import EnhancedCamera from '../components/EnhancedCamera'
import { apiService, FuelEvent } from '../services/api'
import { mapsService, FuelStation } from '../services/maps'
import offlineSyncService from '../services/OfflineSync'
import { Button, Card, Input, Icon } from '../components/ui'
import { colors, typography, spacing } from '../theme'

interface FuelTrackingScreenProps {
  language: 'en' | 'hi'
}

interface FuelFormData {
  liters: string
  amountINR: string
  odometerKm: string
  fuelType: string
  stationName: string
  location: string
  receiptPhoto?: string
}

const translations = {
  en: {
    title: 'Fuel Tracking',
    fuelEntry: 'Fuel Entry',
    liters: 'Liters',
    amount: 'Amount (₹)',
    odometer: 'Odometer (km)',
    fuelType: 'Fuel Type',
    stationName: 'Station Name',
    location: 'Location',
    receiptPhoto: 'Receipt Photo',
    takePhoto: 'Take Photo',
    retakePhoto: 'Retake Photo',
    submit: 'Submit',
    clear: 'Clear',
    nearbyStations: 'Nearby Fuel Stations',
    selectStation: 'Select Station',
    manualEntry: 'Manual Entry',
    photoRequired: 'Receipt photo is required',
    invalidAmount: 'Please enter a valid amount',
    invalidLiters: 'Please enter valid liters',
    invalidOdometer: 'Please enter valid odometer reading',
    submitSuccess: 'Fuel entry submitted successfully',
    submitError: 'Failed to submit fuel entry',
    gettingLocation: 'Getting current location...',
    locationError: 'Unable to get location',
    diesel: 'Diesel',
    petrol: 'Petrol',
    cng: 'CNG',
    recent: 'Recent Entries',
    noEntries: 'No recent fuel entries'
  },
  hi: {
    title: 'ईंधन ट्रैकिंग',
    fuelEntry: 'ईंधन एंट्री',
    liters: 'लीटर',
    amount: 'राशि (₹)',
    odometer: 'ओडोमीटर (किमी)',
    fuelType: 'ईंधन प्रकार',
    stationName: 'स्टेशन का नाम',
    location: 'स्थान',
    receiptPhoto: 'रसीद फोटो',
    takePhoto: 'फोटो लें',
    retakePhoto: 'फिर से फोटो लें',
    submit: 'जमा करें',
    clear: 'साफ करें',
    nearbyStations: 'पास के ईंधन स्टेशन',
    selectStation: 'स्टेशन चुनें',
    manualEntry: 'मैन्युअल एंट्री',
    photoRequired: 'रसीद फोटो आवश्यक है',
    invalidAmount: 'कृपया वैध राशि दर्ज करें',
    invalidLiters: 'कृपया वैध लीटर दर्ज करें',
    invalidOdometer: 'कृपया वैध ओडोमीटर रीडिंग दर्ज करें',
    submitSuccess: 'ईंधन एंट्री सफलतापूर्वक जमा की गई',
    submitError: 'ईंधन एंट्री जमा करने में विफल',
    gettingLocation: 'वर्तमान स्थान प्राप्त कर रहे हैं...',
    locationError: 'स्थान प्राप्त करने में असमर्थ',
    diesel: 'डीजल',
    petrol: 'पेट्रोल',
    cng: 'सीएनजी',
    recent: 'हाल की एंट्रीज',
    noEntries: 'कोई हाल की ईंधन एंट्री नहीं'
  }
}

export default function FuelTrackingScreen({ language }: FuelTrackingScreenProps) {
  const [formData, setFormData] = useState<FuelFormData>({
    liters: '',
    amountINR: '',
    odometerKm: '',
    fuelType: 'DIESEL',
    stationName: '',
    location: '',
    receiptPhoto: undefined
  })
  
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null)
  const [nearbyStations, setNearbyStations] = useState<FuelStation[]>([])
  const [showStations, setShowStations] = useState(false)
  const [recentEntries, setRecentEntries] = useState<FuelEvent[]>([])
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [currentTripId, setCurrentTripId] = useState<number | null>(null)

  const t = translations[language]

  useEffect(() => {
    initialize()
  }, [])

  const initialize = async () => {
    await loadVehicleInfo()
    await getCurrentLocation()
    await loadRecentEntries()
  }

  const loadVehicleInfo = async () => {
    try {
      const tripData = await AsyncStorage.getItem('currentTrip')
      if (tripData) {
        const trip = JSON.parse(tripData)
        setVehicleId(trip.vehicleId)
        setCurrentTripId(trip.id)
      }
    } catch (error) {
      console.error('Error loading vehicle info:', error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await mapsService.getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
        const address = await mapsService.reverseGeocode(location)
        if (address) {
          setFormData(prev => ({ ...prev, location: address }))
        }
        await loadNearbyStations(location)
      }
    } catch (error) {
      console.error('Error getting location:', error)
    }
  }

  const loadNearbyStations = async (location: { latitude: number, longitude: number }) => {
    try {
      const stations = await mapsService.findNearbyFuelStations(location, 5000, language)
      setNearbyStations(stations.slice(0, 10)) // Limit to 10 closest stations
    } catch (error) {
      console.error('Error loading nearby stations:', error)
    }
  }

  const loadRecentEntries = async () => {
    try {
      const result = await apiService.getFuelEvents(1)
      if (result.success && result.data) {
        setRecentEntries(result.data.events.slice(0, 5)) // Show last 5 entries
      }
    } catch (error) {
      console.error('Error loading recent entries:', error)
    }
  }

  const handleInputChange = (field: keyof FuelFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const selectStation = (station: FuelStation) => {
    setFormData(prev => ({
      ...prev,
      stationName: station.name,
      location: station.address
    }))
    setShowStations(false)
  }

  const handlePhotoTaken = (uri: string, type: 'fuel' | 'delivery' | 'qr') => {
    if (type === 'fuel') {
      setFormData(prev => ({ ...prev, receiptPhoto: uri }))
    }
    setShowCamera(false)
  }

  const validateForm = (): boolean => {
    if (!formData.liters || parseFloat(formData.liters) <= 0) {
      Alert.alert('Validation Error', t.invalidLiters)
      return false
    }

    if (!formData.amountINR || parseFloat(formData.amountINR) <= 0) {
      Alert.alert('Validation Error', t.invalidAmount)
      return false
    }

    if (!formData.odometerKm || parseFloat(formData.odometerKm) <= 0) {
      Alert.alert('Validation Error', t.invalidOdometer)
      return false
    }

    if (!formData.receiptPhoto) {
      Alert.alert('Validation Error', t.photoRequired)
      return false
    }

    return true
  }

  const submitFuelEntry = async () => {
    if (!validateForm() || !vehicleId) {
      return
    }

    setLoading(true)
    try {
      // Upload photo first
      let receiptPhotoURL = ''
      if (formData.receiptPhoto) {
        const uploadResult = await apiService.uploadPhoto(
          formData.receiptPhoto,
          'fuel',
          { tripId: currentTripId, vehicleId }
        )
        
        if (uploadResult.success && uploadResult.data) {
          receiptPhotoURL = uploadResult.data.url
        }
      }

      // Create fuel event
      const fuelEvent: FuelEvent = {
        liters: parseFloat(formData.liters),
        amountINR: parseFloat(formData.amountINR),
        odometerKm: parseFloat(formData.odometerKm),
        fuelType: formData.fuelType,
        location: formData.location,
        stationName: formData.stationName,
        receiptPhotoURL,
        vehicleId,
        tripId: currentTripId || undefined
      }

      const result = await apiService.createFuelEvent(fuelEvent)

      if (result.success) {
        Alert.alert('Success', t.submitSuccess)
        clearForm()
        await loadRecentEntries()
      } else {
        // Store offline if failed
        await offlineSyncService.recordFuelPurchase({
          vehicleId: vehicleId.toString(),
          liters: parseFloat(formData.liters),
          amount: parseFloat(formData.amountINR),
          location: formData.location,
          receiptPhoto: formData.receiptPhoto,
          odometer: parseFloat(formData.odometerKm)
        })
        
        Alert.alert('Info', 'Fuel entry saved offline. Will sync when connected.')
        clearForm()
      }
    } catch (error) {
      // Store offline on error
      await offlineSyncService.recordFuelPurchase({
        vehicleId: vehicleId?.toString() || '0',
        liters: parseFloat(formData.liters),
        amount: parseFloat(formData.amountINR),
        location: formData.location,
        receiptPhoto: formData.receiptPhoto,
        odometer: parseFloat(formData.odometerKm)
      })
      
      Alert.alert('Info', 'Fuel entry saved offline. Will sync when connected.')
      clearForm()
    }
    setLoading(false)
  }

  const clearForm = () => {
    setFormData({
      liters: '',
      amountINR: '',
      odometerKm: '',
      fuelType: 'DIESEL',
      stationName: '',
      location: formData.location, // Keep current location
      receiptPhoto: undefined
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="local-gas-station" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>{t.title}</Text>
        </View>

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Nearby Stations */}
          <Card style={styles.nearbyCard}>
            <Button 
              title={t.nearbyStations}
              icon="🗺️"
              onPress={() => setShowStations(true)}
              variant="outline"
              fullWidth
            />
          </Card>

          {/* Fuel Entry Form */}
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Icon name="receipt" size={20} color={colors.primary} />
              <Text style={styles.formTitle}>{t.fuelEntry}</Text>
            </View>

            <Input
              label={t.liters}
              value={formData.liters}
              onChangeText={(value) => handleInputChange('liters', value)}
              placeholder="35.5"
              keyboardType="numeric"
              leftIcon="🛢️"
              required
            />

            <Input
              label={t.amount}
              value={formData.amountINR}
              onChangeText={(value) => handleInputChange('amountINR', value)}
              placeholder="2500"
              keyboardType="numeric"
              leftIcon="₹"
              required
            />

            <Input
              label={t.odometer}
              value={formData.odometerKm}
              onChangeText={(value) => handleInputChange('odometerKm', value)}
              placeholder="15000"
              keyboardType="numeric"
              leftIcon="🚗"
              required
            />

            <View style={styles.fuelTypeSection}>
              <Text style={styles.fuelTypeLabel}>{t.fuelType}</Text>
              <View style={styles.fuelTypeContainer}>
                {['DIESEL', 'PETROL', 'CNG'].map((type) => (
                  <Button
                    key={type}
                    title={t[type.toLowerCase() as keyof typeof t] || type}
                    onPress={() => handleInputChange('fuelType', type)}
                    variant={formData.fuelType === type ? 'primary' : 'outline'}
                    size="small"
                    style={styles.fuelTypeButton}
                  />
                ))}
              </View>
            </View>

            <Input
              label={t.stationName}
              value={formData.stationName}
              onChangeText={(value) => handleInputChange('stationName', value)}
              placeholder="HP Petrol Pump"
              leftIcon="⛽"
            />

            <Input
              label={t.location}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder={t.gettingLocation}
              leftIcon="📍"
              multiline
            />

            {/* Receipt Photo */}
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>{t.receiptPhoto} *</Text>
              <Button
                title={formData.receiptPhoto ? t.retakePhoto : t.takePhoto}
                icon="📷"
                onPress={() => setShowCamera(true)}
                variant={formData.receiptPhoto ? 'success' : 'outline'}
                fullWidth
                style={styles.photoButton}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title={t.clear}
                onPress={clearForm}
                variant="ghost"
                style={styles.clearButton}
              />
              <Button
                title={t.submit}
                onPress={submitFuelEntry}
                loading={loading}
                variant="primary"
                style={styles.submitButton}
              />
            </View>
          </Card>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <Card style={styles.recentCard}>
              <View style={styles.recentHeader}>
                <Icon name="history" size={20} color={colors.primary} />
                <Text style={styles.recentTitle}>{t.recent}</Text>
              </View>
              {recentEntries.map((entry) => (
                <View key={entry.id} style={styles.entryItem}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryAmount}>
                      <Icon name="currency-rupee" size={16} color={colors.success} />
                      <Text style={styles.entryAmountText}>₹{entry.amountINR}</Text>
                    </View>
                    <View style={styles.entryLiters}>
                      <Icon name="local-gas-station" size={16} color={colors.primary} />
                      <Text style={styles.entryLitersText}>{entry.liters}L</Text>
                    </View>
                  </View>
                  <Text style={styles.entryLocation}>{entry.location}</Text>
                  <Text style={styles.entryDate}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </Card>
          )}
        </ScrollView>

        {/* Camera Modal */}
        {showCamera && (
          <Modal visible={showCamera} animationType="slide">
            <EnhancedCamera
              language={language}
              onPhotoTaken={handlePhotoTaken}
              onQRScanned={() => {}}
              photoType="fuel"
              onClose={() => setShowCamera(false)}
            />
          </Modal>
        )}

        {/* Nearby Stations Modal */}
        <Modal visible={showStations} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <Card style={styles.stationsModal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleSection}>
                  <Icon name="local-gas-station" size={20} color={colors.primary} />
                  <Text style={styles.modalTitle}>{t.nearbyStations}</Text>
                </View>
                <Button
                  title="✕"
                  onPress={() => setShowStations(false)}
                  variant="ghost"
                  size="small"
                  style={styles.closeButton}
                />
              </View>
              <ScrollView style={styles.stationsList} showsVerticalScrollIndicator={false}>
                {nearbyStations.map((station) => (
                  <Button
                    key={station.id}
                    title={`${station.name} - ${mapsService.formatDistance(station.distance, language)}`}
                    onPress={() => selectStation(station)}
                    variant="outline"
                    style={styles.stationItem}
                  />
                ))}
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...spacing.shadows.sm,
  },
  headerTitle: {
    ...typography.styles.h4,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  
  // Content Styles
  scrollContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  // Card Styles
  nearbyCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  formCard: {
    marginBottom: spacing.md,
  },
  recentCard: {
    marginBottom: spacing['2xl'],
  },
  
  // Form Styles
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  
  // Fuel Type Section
  fuelTypeSection: {
    marginBottom: spacing.md,
  },
  fuelTypeLabel: {
    ...typography.styles.labelMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fuelTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fuelTypeButton: {
    flex: 1,
  },
  
  // Photo Section
  photoSection: {
    marginBottom: spacing.lg,
  },
  photoLabel: {
    ...typography.styles.labelMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  photoButton: {
    marginTop: spacing.sm,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  clearButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  
  // Recent Entries Styles
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  recentTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  entryItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.gray50,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryAmountText: {
    ...typography.styles.labelLarge,
    color: colors.success,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  entryLiters: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryLitersText: {
    ...typography.styles.labelLarge,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  entryLocation: {
    ...typography.styles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  entryDate: {
    ...typography.styles.caption,
    color: colors.textSecondary,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stationsModal: {
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.styles.h6,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  closeButton: {
    width: 32,
    height: 32,
  },
  stationsList: {
    maxHeight: 400,
  },
  stationItem: {
    marginBottom: spacing.sm,
  },
})
