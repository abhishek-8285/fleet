import React, { useState, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignaturePad from '../components/SignaturePad'
import * as ImagePicker from 'expo-image-picker'
import { PermissionsManager } from '../utils/permissions'
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService, Trip } from '../services/api'
import offlineSyncService from '../services/OfflineSync'

interface ProofOfDeliveryProps {
  trip: Trip
  language: 'en' | 'hi'
  onComplete: (podData: PODData) => void
  onCancel: () => void
}

interface PODData {
  customerName: string
  customerPhone: string
  customerSignature: string
  deliveryPhotos: string[]
  deliveryNotes: string
  odometerReading: string
  deliveredAt: string
  customerRating?: number
  customerFeedback?: string
}

const translations = {
  en: {
    title: 'Proof of Delivery',
    customerInfo: 'Customer Information',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    signature: 'Customer Signature',
    getSignature: 'Get Customer Signature',
    retakeSignature: 'Retake Signature',
    deliveryPhotos: 'Delivery Photos',
    addPhoto: 'Add Photo',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    deliveryNotes: 'Delivery Notes (Optional)',
    notesPlaceholder: 'Any special delivery instructions or notes...',
    odometerReading: 'Odometer Reading',
    customerRating: 'Customer Rating (Optional)',
    customerFeedback: 'Customer Feedback (Optional)',
    feedbackPlaceholder: 'Customer comments about the service...',
    completeDelivery: 'Complete Delivery',
    cancel: 'Cancel',
    clear: 'Clear',
    confirmComplete: 'Confirm Delivery',
    confirmMessage: 'This will mark the trip as completed. Continue?',
    yes: 'Yes',
    no: 'No',
    signatureRequired: 'Customer signature is required',
    customerNameRequired: 'Customer name is required',
    odometerRequired: 'Odometer reading is required',
    invalidOdometer: 'Please enter a valid odometer reading',
    deliveryCompleted: 'Delivery completed successfully',
    errorCompleting: 'Error completing delivery',
    workingOffline: 'Working offline - will sync when connected',
    signatureCleared: 'Signature cleared',
    photoAdded: 'Photo added successfully',
    photoRemoved: 'Photo removed',
    removePhoto: 'Remove Photo',
    viewPhoto: 'View Photo',
    signatureTitle: 'Customer Signature',
    signatureInstructions: 'Please ask customer to sign below',
    done: 'Done',
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    poor: 'Poor',
    rating: 'Rating'
  },
  hi: {
    title: 'डिलीवरी प्रूफ',
    customerInfo: 'ग्राहक जानकारी',
    customerName: 'ग्राहक का नाम',
    customerPhone: 'ग्राहक का फोन',
    signature: 'ग्राहक का हस्ताक्षर',
    getSignature: 'ग्राहक का हस्ताक्षर लें',
    retakeSignature: 'हस्ताक्षर फिर से लें',
    deliveryPhotos: 'डिलीवरी फोटो',
    addPhoto: 'फोटो जोड़ें',
    takePhoto: 'फोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    deliveryNotes: 'डिलीवरी नोट्स (वैकल्पिक)',
    notesPlaceholder: 'कोई विशेष डिलीवरी निर्देश या नोट्स...',
    odometerReading: 'ओडोमीटर रीडिंग',
    customerRating: 'ग्राहक रेटिंग (वैकल्पिक)',
    customerFeedback: 'ग्राहक फीडबैक (वैकल्पिक)',
    feedbackPlaceholder: 'सेवा के बारे में ग्राहक की टिप्पणियां...',
    completeDelivery: 'डिलीवरी पूरी करें',
    cancel: 'रद्द करें',
    clear: 'साफ करें',
    confirmComplete: 'डिलीवरी की पुष्टि करें',
    confirmMessage: 'यह यात्रा को पूर्ण के रूप में चिह्नित करेगा। जारी रखें?',
    yes: 'हां',
    no: 'नहीं',
    signatureRequired: 'ग्राहक का हस्ताक्षर आवश्यक है',
    customerNameRequired: 'ग्राहक का नाम आवश्यक है',
    odometerRequired: 'ओडोमीटर रीडिंग आवश्यक है',
    invalidOdometer: 'कृपया वैध ओडोमीटर रीडिंग दर्ज करें',
    deliveryCompleted: 'डिलीवरी सफलतापूर्वक पूर्ण',
    errorCompleting: 'डिलीवरी पूरी करने में त्रुटि',
    workingOffline: 'ऑफलाइन काम कर रहे - जुड़ने पर सिंक होगा',
    signatureCleared: 'हस्ताक्षर साफ किया गया',
    photoAdded: 'फोटो सफलतापूर्वक जोड़ी गई',
    photoRemoved: 'फोटो हटाई गई',
    removePhoto: 'फोटो हटाएं',
    viewPhoto: 'फोटो देखें',
    signatureTitle: 'ग्राहक हस्ताक्षर',
    signatureInstructions: 'कृपया ग्राहक से नीचे हस्ताक्षर करने को कहें',
    done: 'हो गया',
    excellent: 'उत्कृष्ट',
    good: 'अच्छा',
    average: 'औसत',
    poor: 'खराब',
    rating: 'रेटिंग'
  }
}

export default function ProofOfDeliveryScreen({ trip, language, onComplete, onCancel }: ProofOfDeliveryProps) {
  const [podData, setPodData] = useState<PODData>({
    customerName: trip.customerName || '',
    customerPhone: trip.customerPhone || '',
    customerSignature: '',
    deliveryPhotos: [],
    deliveryNotes: '',
    odometerReading: '',
    deliveredAt: new Date().toISOString(),
    customerRating: undefined,
    customerFeedback: ''
  })

  const [showSignature, setShowSignature] = useState(false)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const t = translations[language]

  const handleSignature = (signature: string) => {
    setPodData(prev => ({ ...prev, customerSignature: signature }))
    setShowSignature(false)
    Alert.alert('Success', t.signatureCleared)
  }

  const clearSignature = () => {
    setPodData(prev => ({ ...prev, customerSignature: '' }))
    Alert.alert('Info', t.signatureCleared)
  }

  const addPhoto = async (source: 'camera' | 'gallery') => {
    try {
      let result

      if (source === 'camera') {
        const hasPermission = await PermissionsManager.requestCameraPermission()
        if (!hasPermission) {
          return
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      }

      if (!result.canceled && result.assets?.[0]) {
        const newPhotos = [...podData.deliveryPhotos, result.assets[0].uri]
        setPodData(prev => ({ ...prev, deliveryPhotos: newPhotos }))
        setShowPhotoOptions(false)
        Alert.alert('Success', t.photoAdded)
      }
    } catch (error) {
      console.error('Error adding photo:', error)
      Alert.alert('Error', 'Failed to add photo')
    }
  }

  const removePhoto = (index: number) => {
    Alert.alert(
      'Confirm',
      t.removePhoto,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const newPhotos = podData.deliveryPhotos.filter((_, i) => i !== index)
            setPodData(prev => ({ ...prev, deliveryPhotos: newPhotos }))
            Alert.alert('Success', t.photoRemoved)
          }
        }
      ]
    )
  }

  const setRating = (rating: number) => {
    setPodData(prev => ({ ...prev, customerRating: rating }))
  }

  const validateForm = (): boolean => {
    if (!podData.customerName.trim()) {
      Alert.alert('Validation Error', t.customerNameRequired)
      return false
    }

    if (!podData.customerSignature) {
      Alert.alert('Validation Error', t.signatureRequired)
      return false
    }

    if (!podData.odometerReading || parseFloat(podData.odometerReading) <= 0) {
      Alert.alert('Validation Error', t.invalidOdometer)
      return false
    }

    return true
  }

  const completeDelivery = async () => {
    if (!validateForm()) return

    Alert.alert(
      t.confirmComplete,
      t.confirmMessage,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          onPress: async () => {
            setLoading(true)
            try {
              // Upload photos first
              const uploadedPhotos: string[] = []
              for (const photoUri of podData.deliveryPhotos) {
                const uploadResult = await apiService.uploadPhoto(
                  photoUri,
                  'delivery',
                  { tripId: trip.id, timestamp: new Date().toISOString() }
                )
                
                if (uploadResult.success && uploadResult.data) {
                  uploadedPhotos.push(uploadResult.data.url)
                } else {
                  // Store locally if upload fails
                  uploadedPhotos.push(photoUri)
                }
              }

              // Complete the trip with POD data
              const completionData = {
                deliveredAt: podData.deliveredAt,
                proofOfDelivery: uploadedPhotos,
                customerSignature: podData.customerSignature,
                deliveryNotes: podData.deliveryNotes,
                odometerReading: parseFloat(podData.odometerReading),
                customerName: podData.customerName,
                customerPhone: podData.customerPhone,
                customerRating: podData.customerRating,
                customerFeedback: podData.customerFeedback
              }

              const result = await apiService.completeTrip(trip.id, completionData)

              if (result.success) {
                Alert.alert('Success', t.deliveryCompleted)
                onComplete(podData)
              } else {
                // Store offline if API call fails
                await storeOfflinePOD(completionData)
                Alert.alert('Info', t.workingOffline)
                onComplete(podData)
              }
            } catch (error) {
              // Store offline on error
              await storeOfflinePOD({
                deliveredAt: podData.deliveredAt,
                proofOfDelivery: podData.deliveryPhotos,
                customerSignature: podData.customerSignature,
                deliveryNotes: podData.deliveryNotes,
                odometerReading: parseFloat(podData.odometerReading),
                customerName: podData.customerName,
                customerPhone: podData.customerPhone,
                customerRating: podData.customerRating,
                customerFeedback: podData.customerFeedback
              })
              Alert.alert('Info', t.workingOffline)
              onComplete(podData)
            }
            setLoading(false)
          }
        }
      ]
    )
  }

  const storeOfflinePOD = async (completionData: any) => {
    try {
      await offlineSyncService.completeTrip(
        trip.id.toString(),
        { lat: 0, lng: 0 }, // Location will be added by GPS service
        JSON.stringify(completionData)
      )
    } catch (error) {
      console.error('Error storing offline POD:', error)
    }
  }

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 5: return t.excellent
      case 4: return t.good
      case 3: return t.average
      case 2: case 1: return t.poor
      default: return ''
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Customer Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👤 {t.customerInfo}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.customerName} *</Text>
              <TextInput
                style={styles.input}
                value={podData.customerName}
                onChangeText={(text) => setPodData(prev => ({ ...prev, customerName: text }))}
                placeholder="Customer Name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.customerPhone}</Text>
              <TextInput
                style={styles.input}
                value={podData.customerPhone}
                onChangeText={(text) => setPodData(prev => ({ ...prev, customerPhone: text }))}
                placeholder="+91 9876543210"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Customer Signature */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✍️ {t.signature}</Text>
            
            {podData.customerSignature ? (
              <View style={styles.signatureContainer}>
                <Image 
                  source={{ uri: podData.customerSignature }} 
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
                <View style={styles.signatureActions}>
                  <TouchableOpacity 
                    style={styles.signatureButton}
                    onPress={() => setShowSignature(true)}
                  >
                    <Text style={styles.signatureButtonText}>{t.retakeSignature}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.signatureButton, styles.clearButton]}
                    onPress={clearSignature}
                  >
                    <Text style={styles.signatureButtonText}>{t.clear}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.getSignatureButton}
                onPress={() => setShowSignature(true)}
              >
                <Text style={styles.getSignatureText}>✍️ {t.getSignature}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Delivery Photos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷 {t.deliveryPhotos}</Text>
            
            <View style={styles.photosContainer}>
              {podData.deliveryPhotos.map((photo, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.photoThumbnail}
                  onPress={() => {
                    setSelectedPhotoIndex(index)
                    setShowPhotoViewer(true)
                  }}
                  onLongPress={() => removePhoto(index)}
                >
                  <Image source={{ uri: photo }} style={styles.thumbnailImage} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={() => setShowPhotoOptions(true)}
              >
                <Text style={styles.addPhotoText}>📷</Text>
                <Text style={styles.addPhotoLabel}>{t.addPhoto}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📝 Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.odometerReading} *</Text>
              <TextInput
                style={styles.input}
                value={podData.odometerReading}
                onChangeText={(text) => setPodData(prev => ({ ...prev, odometerReading: text }))}
                placeholder="125000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.deliveryNotes}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={podData.deliveryNotes}
                onChangeText={(text) => setPodData(prev => ({ ...prev, deliveryNotes: text }))}
                placeholder={t.notesPlaceholder}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Customer Rating */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ {t.customerRating}</Text>
            
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={styles.ratingButton}
                  onPress={() => setRating(rating)}
                >
                  <Text style={[
                    styles.ratingStar,
                    (podData.customerRating !== undefined && podData.customerRating >= rating) ? styles.ratingStarActive : null
                  ]}>
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {podData.customerRating && (
              <Text style={styles.ratingText}>
                {podData.customerRating} / 5 - {getRatingText(podData.customerRating)}
              </Text>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.customerFeedback}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={podData.customerFeedback}
                onChangeText={(text) => setPodData(prev => ({ ...prev, customerFeedback: text }))}
                placeholder={t.feedbackPlaceholder}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelActionButton]}
            onPress={onCancel}
          >
            <Text style={styles.actionButtonText}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeActionButton]}
            onPress={completeDelivery}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>{t.completeDelivery}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Signature Modal */}
        <Modal visible={showSignature} animationType="slide">
          <SafeAreaView style={styles.signatureModal}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureTitle}>{t.signatureTitle}</Text>
              <Text style={styles.signatureInstructions}>{t.signatureInstructions}</Text>
            </View>
            
            <View style={styles.signatureCanvasContainer}>
              <SignaturePad
                onSignatureChange={(signature) => {
                  if (signature) {
                    handleSignature(signature)
                  }
                }}
                strokeColor="#000000"
                strokeWidth={3}
                backgroundColor="#ffffff"
              />
            </View>
            
            <View style={styles.signatureActions}>
              <TouchableOpacity
                style={[styles.signatureButton, styles.clearButton]}
                onPress={clearSignature}
              >
                <Text style={styles.signatureButtonText}>{t.clear}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.signatureButton, styles.cancelButton]}
                onPress={() => setShowSignature(false)}
              >
                <Text style={styles.signatureButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Photo Options Modal */}
        <Modal visible={showPhotoOptions} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.photoOptionsModal}>
              <Text style={styles.modalTitle}>{t.addPhoto}</Text>
              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={() => addPhoto('camera')}
              >
                <Text style={styles.photoOptionText}>📷 {t.takePhoto}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoOptionButton}
                onPress={() => addPhoto('gallery')}
              >
                <Text style={styles.photoOptionText}>🖼️ {t.chooseFromGallery}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoOptionButton, styles.cancelOption]}
                onPress={() => setShowPhotoOptions(false)}
              >
                <Text style={styles.photoOptionText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Photo Viewer Modal */}
        <Modal visible={showPhotoViewer} animationType="fade">
          <SafeAreaView style={styles.photoViewerModal}>
            <View style={styles.photoViewerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPhotoViewer(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.photoViewerTitle}>
                {t.viewPhoto} {selectedPhotoIndex + 1}/{podData.deliveryPhotos.length}
              </Text>
            </View>
            
            {podData.deliveryPhotos[selectedPhotoIndex] && (
              <Image
                source={{ uri: podData.deliveryPhotos[selectedPhotoIndex] }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
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
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelText: {
    fontSize: 18,
    color: '#666'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  placeholder: {
    width: 40
  },
  scrollContainer: {
    flex: 1,
    padding: 16
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  signatureContainer: {
    alignItems: 'center'
  },
  signatureImage: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  signatureButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 20
  },
  signatureButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  clearButton: {
    backgroundColor: '#666'
  },
  getSignatureButton: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f8f9ff'
  },
  getSignatureText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold'
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    marginRight: 10,
    marginBottom: 10,
    position: 'relative'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10
  },
  removePhotoButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    backgroundColor: '#F44336',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removePhotoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa'
  },
  addPhotoText: {
    fontSize: 24,
    marginBottom: 5
  },
  addPhotoLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15
  },
  ratingButton: {
    padding: 5
  },
  ratingStar: {
    fontSize: 30,
    color: '#ddd'
  },
  ratingStarActive: {
    color: '#FFD700'
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    fontWeight: '500'
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelActionButton: {
    backgroundColor: '#666'
  },
  completeActionButton: {
    backgroundColor: '#4CAF50'
  },
  signatureModal: {
    flex: 1,
    backgroundColor: 'white'
  },
  signatureHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  signatureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  signatureInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  signatureCanvasContainer: {
    flex: 1,
    margin: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  photoOptionsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    minWidth: 250
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  photoOptionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    alignItems: 'center'
  },
  photoOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  cancelOption: {
    backgroundColor: '#ffebee'
  },
  photoViewerModal: {
    flex: 1,
    backgroundColor: 'black'
  },
  photoViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  photoViewerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  fullScreenImage: {
    flex: 1,
    width: '100%'
  }
})
