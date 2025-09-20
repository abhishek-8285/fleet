import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Progress from 'react-native-progress'
import { apiService } from '../services/api'
import DocumentManagementScreen from './DocumentManagementScreen'
import ProfileEditScreen from './ProfileEditScreen'
import ChangeRequestScreen from './ChangeRequestScreen'

interface DriverProfileScreenProps {
  language: 'en' | 'hi'
  navigation?: any
  onOpenSettings?: () => void
}

interface DriverProfile {
  id: number | string
  name: string
  phone: string
  email?: string
  photo?: string
  licenseNumber?: string
  licenseNo?: string // API field name
  licenseExpiry?: string
  aadharNumber?: string
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  bankDetails?: {
    accountNumber: string
    ifscCode: string
    bankName: string
    accountHolderName: string
  }
  documents?: {
    license?: string
    aadhar?: string
    medical?: string
    insurance?: string
    pcc?: string // Police Clearance Certificate
  }
  experience?: number
  joiningDate?: string
  joinDate?: string // API field name
  status: 'active' | 'inactive' | 'suspended' | 'AVAILABLE' | 'ON_TRIP' | 'ON_BREAK' | 'OFFLINE'
  rating?: number
  completedTrips?: number
  totalTrips?: number // API field name
  totalDistance?: number
  vehicle?: string // API field name
  profileCompletion?: number
}

const translations = {
  en: {
    title: 'Driver Profile',
    personalInfo: 'Personal Information',
    contactInfo: 'Contact Information',
    documents: 'Documents',
    bankDetails: 'Bank Details',
    stats: 'Statistics',
    editProfile: 'Edit Profile',
    manageDocuments: 'Manage Documents',
    changePhoto: 'Change Photo',
    changeRequests: 'Change Requests',
    viewRequests: 'View Requests',
    emergencyContact: 'Emergency Contact',
    profileCompletion: 'Profile Completion',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    license: 'License Number',
    licenseExpiry: 'License Expiry',
    aadhar: 'Aadhar Number',
    address: 'Address',
    experience: 'Experience (Years)',
    joiningDate: 'Joining Date',
    rating: 'Rating',
    completedTrips: 'Completed Trips',
    totalDistance: 'Total Distance (KM)',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    uploadPhoto: 'Upload Photo',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    photoUpdated: 'Profile photo updated successfully',
    failedToUpdate: 'Failed to update profile photo',
    missingInfo: 'Some information is missing',
    completeProfile: 'Complete your profile for better experience',
    changeRequestSubmitted: 'Change request submitted to admin for approval',
    changeRequestFailed: 'Failed to submit change request',
    pendingApproval: 'Pending Admin Approval',
    contactName: 'Contact Name',
    contactPhone: 'Contact Phone',
    relationship: 'Relationship',
    accountNumber: 'Account Number',
    ifscCode: 'IFSC Code',
    bankName: 'Bank Name',
    accountHolderName: 'Account Holder Name',
    addEmergencyContact: 'Add Emergency Contact',
    addBankDetails: 'Add Bank Details',
    viewDocument: 'View Document',
    uploadDocument: 'Upload Document',
    expired: 'Expired',
    expiringIn: 'Expiring in',
    days: 'days',
    noDocuments: 'No documents uploaded',
    documentExpiry: 'Document Expiry Alerts',
    refreshing: 'Refreshing...',
    years: 'years'
  },
  hi: {
    title: 'ड्राइवर प्रोफाइल',
    personalInfo: 'व्यक्तिगत जानकारी',
    contactInfo: 'संपर्क जानकारी',
    documents: 'दस्तावेज',
    bankDetails: 'बैंक विवरण',
    stats: 'आंकड़े',
    editProfile: 'प्रोफाइल संपादित करें',
    manageDocuments: 'दस्तावेज प्रबंधन',
    changePhoto: 'फोटो बदलें',
    changeRequests: 'परिवर्तन अनुरोध',
    viewRequests: 'अनुरोध देखें',
    emergencyContact: 'आपातकालीन संपर्क',
    profileCompletion: 'प्रोफाइल पूर्णता',
    name: 'नाम',
    phone: 'फोन',
    email: 'ईमेल',
    license: 'लाइसेंस नंबर',
    licenseExpiry: 'लाइसेंस समाप्ति',
    aadhar: 'आधार नंबर',
    address: 'पता',
    experience: 'अनुभव (वर्ष)',
    joiningDate: 'ज्वाइनिंग तारीख',
    rating: 'रेटिंग',
    completedTrips: 'पूर्ण यात्राएं',
    totalDistance: 'कुल दूरी (KM)',
    status: 'स्थिति',
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    suspended: 'निलंबित',
    uploadPhoto: 'फोटो अपलोड करें',
    takePhoto: 'फोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    photoUpdated: 'प्रोफाइल फोटो सफलतापूर्वक अपडेट',
    failedToUpdate: 'प्रोफाइल फोटो अपडेट करने में विफल',
    missingInfo: 'कुछ जानकारी गुम है',
    completeProfile: 'बेहतर अनुभव के लिए अपना प्रोफाइल पूरा करें',
    changeRequestSubmitted: 'परिवर्तन अनुरोध व्यवस्थापक के अनुमोदन के लिए भेजा गया',
    changeRequestFailed: 'परिवर्तन अनुरोध भेजने में विफल',
    pendingApproval: 'व्यवस्थापक अनुमोदन लंबित',
    contactName: 'संपर्क नाम',
    contactPhone: 'संपर्क फोन',
    relationship: 'रिश्ता',
    accountNumber: 'खाता संख्या',
    ifscCode: 'IFSC कोड',
    bankName: 'बैंक का नाम',
    accountHolderName: 'खाता धारक का नाम',
    addEmergencyContact: 'आपातकालीन संपर्क जोड़ें',
    addBankDetails: 'बैंक विवरण जोड़ें',
    viewDocument: 'दस्तावेज देखें',
    uploadDocument: 'दस्तावेज अपलोड करें',
    expired: 'समाप्त',
    expiringIn: 'समाप्त हो रहा है',
    days: 'दिन',
    noDocuments: 'कोई दस्तावेज अपलोड नहीं',
    documentExpiry: 'दस्तावेज समाप्ति अलर्ट',
    refreshing: 'रिफ्रेश हो रहा है...',
    years: 'वर्ष'
  }
}

const { width } = Dimensions.get('window')

export default function DriverProfileScreen({ language, navigation, onOpenSettings }: DriverProfileScreenProps) {
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangeRequests, setShowChangeRequests] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = translations[language]

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Try to get from local storage first
      const cachedProfile = await AsyncStorage.getItem('driverProfile')
      const cachedUser = await AsyncStorage.getItem('user')
      
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile))
      } else if (cachedUser) {
        // Use cached user data as fallback
        const userData = JSON.parse(cachedUser)
        const fallbackProfile = createFallbackProfile(userData)
        setProfile(fallbackProfile)
      }

      // Then try to fetch from API
      const result = await apiService.getDriverProfile()
      
      if (result.success && result.data) {
        // Map API response to expected interface
        const mappedData = {
          ...result.data,
          id: String(result.data.id), // Convert number to string
          licenseNumber: result.data.licenseNo || result.data.licenseNumber,
          joiningDate: result.data.joinDate || result.data.joiningDate,
          completedTrips: result.data.totalTrips || result.data.completedTrips,
          documents: result.data.documents || {},
          profileCompletion: calculateProfileCompletion(result.data)
        }
        setProfile(mappedData)
        await AsyncStorage.setItem('driverProfile', JSON.stringify(mappedData))
      } else {
        console.log('⚠️ Profile API failed, using cached/fallback data:', result.error)
        // Don't show error alert if we have fallback data
        if (!profile) {
          const userData = cachedUser ? JSON.parse(cachedUser) : null
          const fallbackProfile = createFallbackProfile(userData)
          setProfile(fallbackProfile)
        }
      }
    } catch (error) {
      console.error('🔴 Error loading profile:', error)
      // Try to use fallback profile instead of showing error
      const cachedUser = await AsyncStorage.getItem('user')
      if (cachedUser) {
        const userData = JSON.parse(cachedUser)
        const fallbackProfile = createFallbackProfile(userData)
        setProfile(fallbackProfile)
      } else {
        setError('Failed to load profile. Please try logging in again.')
        // Create a basic fallback profile to prevent crashes
        const basicProfile = createFallbackProfile(null)
        setProfile(basicProfile)
      }
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  const createFallbackProfile = (userData: any): DriverProfile => {
    return {
      id: userData?.id || 'user-1',
      name: userData?.name || 'Driver User',
      phone: userData?.phone || '+919876543210',
      email: userData?.email || '',
      photo: userData?.photo || '',
      licenseNumber: userData?.licenseNumber || '',
      licenseExpiry: userData?.licenseExpiry || '',
      aadharNumber: userData?.aadharNumber || '',
      address: userData?.address || '',
      emergencyContact: userData?.emergencyContact || undefined,
      bankDetails: userData?.bankDetails || undefined,
      documents: userData?.documents || {
        license: '',
        aadhar: '',
        medical: '',
        insurance: '',
        pcc: ''
      },
      experience: userData?.experience || 0,
      joiningDate: userData?.joiningDate || new Date().toISOString(),
      status: userData?.status || 'active',
      rating: userData?.rating || 4.5,
      completedTrips: userData?.completedTrips || 0,
      totalDistance: userData?.totalDistance || 0,
      profileCompletion: 45 // Default completion percentage
    }
  }

  const calculateProfileCompletion = (profileData: any): number => {
    const fields = [
      'name', 'phone', 'email', 'licenseNumber', 'licenseExpiry', 
      'aadharNumber', 'address', 'photo', 'emergencyContact', 'bankDetails'
    ]
    
    let completed = 0
    fields.forEach(field => {
      if (field === 'emergencyContact' && profileData.emergencyContact?.name) completed++
      else if (field === 'bankDetails' && profileData.bankDetails?.accountNumber) completed++
      else if (profileData[field]) completed++
    })
    
    const documentsComplete = Object.keys(profileData.documents || {}).length
    completed += Math.min(documentsComplete / 3, 2) // Max 2 points for documents
    
    return Math.round((completed / (fields.length + 2)) * 100)
  }

  const handlePhotoUpload = async (source: 'camera' | 'gallery') => {
    try {
      setUploadingPhoto(true)
      let result

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert(t.error, 'Camera permission required')
          return
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images' as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      }

      if (!result.canceled && result.assets?.[0]) {
        const uploadResult = await apiService.uploadPhoto(
          result.assets[0].uri,
          'profile',
          { driverId: profile?.id }
        )
        
        if (uploadResult.success && uploadResult.data) {
          setProfile(prev => prev ? {
            ...prev,
            photo: uploadResult.data!.url,
            profileCompletion: calculateProfileCompletion({
              ...prev,
              photo: uploadResult.data!.url
            })
          } : null)
          
          Alert.alert(t.success, t.photoUpdated)
        } else {
          Alert.alert(t.error, t.failedToUpdate)
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      Alert.alert(t.error, t.failedToUpdate)
    } finally {
      setUploadingPhoto(false)
      setShowPhotoOptions(false)
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#4CAF50'
      case 'inactive': return '#FFC107'
      case 'suspended': return '#F44336'
      default: return '#666'
    }
  }

  const getDocumentStatus = (documentType: string) => {
    if (!profile?.documents || !profile.documents[documentType as keyof typeof profile.documents]) {
      return { status: 'missing', color: '#F44336', text: t.uploadDocument }
    }
    
    // For now, assuming documents don't have expiry in the current data
    // In real implementation, you'd check expiry dates
    return { status: 'valid', color: '#4CAF50', text: t.viewDocument }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getExperienceText = (years?: number): string => {
    if (!years) return 'N/A'
    return `${years} ${t.years}`
  }

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.headerActions}>
          {onOpenSettings && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={onOpenSettings}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.requestsButton}
            onPress={() => setShowChangeRequests(true)}
          >
            <Text style={styles.requestsButtonText}>📝</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditProfile(true)}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Completion */}
        {profile.profileCompletion < 100 && (
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>{t.profileCompletion}</Text>
            <Progress.Bar 
              progress={profile.profileCompletion / 100} 
              width={width - 80}
              color="#2196F3"
              unfilledColor="#E3F2FD"
              borderWidth={0}
              height={8}
            />
            <Text style={styles.completionText}>
              {profile.profileCompletion}% {t.completeProfile}
            </Text>
          </View>
        )}

        {/* Profile Photo & Basic Info */}
        <View style={styles.profileCard}>
          <View style={styles.photoSection}>
            <TouchableOpacity 
              style={styles.photoContainer}
              onPress={() => setShowPhotoOptions(true)}
            >
              {profile.photo ? (
                <Image source={{ uri: profile.photo }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.defaultPhoto}>
                  <Text style={styles.defaultPhotoText}>👤</Text>
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="white" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.basicInfo}>
              <Text style={styles.driverName}>{profile.name}</Text>
              <Text style={styles.driverPhone}>{profile.phone}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profile.status) }]}>
                  <Text style={styles.statusText}>{t[profile.status as keyof typeof t]}</Text>
                </View>
              </View>
            </View>
          </View>

          {profile.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingText}>
                ⭐ {profile.rating.toFixed(1)} ({profile.completedTrips || 0} {t.completedTrips})
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 {t.stats}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.completedTrips || profile.totalTrips || 0}</Text>
              <Text style={styles.statLabel}>{t.completedTrips}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalDistance || 0}</Text>
              <Text style={styles.statLabel}>{t.totalDistance}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getExperienceText(profile.experience)}</Text>
              <Text style={styles.statLabel}>{t.experience}</Text>
            </View>
          </View>
          
          {/* Vehicle Info if available */}
          {profile.vehicle && (
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleLabel}>🚛 Assigned Vehicle:</Text>
              <Text style={styles.vehicleValue}>{profile.vehicle}</Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>👤 {t.personalInfo}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.name}:</Text>
            <Text style={styles.infoValue}>{profile.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.license}:</Text>
            <Text style={styles.infoValue}>{profile.licenseNumber || profile.licenseNo || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.licenseExpiry}:</Text>
            <Text style={styles.infoValue}>{formatDate(profile.licenseExpiry)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.aadhar}:</Text>
            <Text style={styles.infoValue}>
              {profile.aadharNumber ? `**** **** ${profile.aadharNumber.slice(-4)}` : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.address}:</Text>
            <Text style={styles.infoValue}>{profile.address || 'N/A'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.joiningDate}:</Text>
            <Text style={styles.infoValue}>{formatDate(profile.joiningDate || profile.joinDate)}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📞 {t.contactInfo}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.phone}:</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t.email}:</Text>
            <Text style={styles.infoValue}>{profile.email || 'N/A'}</Text>
          </View>
          
          {profile.emergencyContact ? (
            <>
              <Text style={styles.subTitle}>{t.emergencyContact}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.contactName}:</Text>
                <Text style={styles.infoValue}>{profile.emergencyContact.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.contactPhone}:</Text>
                <Text style={styles.infoValue}>{profile.emergencyContact.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.relationship}:</Text>
                <Text style={styles.infoValue}>{profile.emergencyContact.relationship}</Text>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ {t.addEmergencyContact}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bank Details */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>🏦 {t.bankDetails}</Text>
          
          {profile.bankDetails ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.bankName}:</Text>
                <Text style={styles.infoValue}>{profile.bankDetails.bankName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.accountHolderName}:</Text>
                <Text style={styles.infoValue}>{profile.bankDetails.accountHolderName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.accountNumber}:</Text>
                <Text style={styles.infoValue}>
                  ****{profile.bankDetails.accountNumber.slice(-4)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.ifscCode}:</Text>
                <Text style={styles.infoValue}>{profile.bankDetails.ifscCode}</Text>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>+ {t.addBankDetails}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Documents */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📄 {t.documents}</Text>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => setShowDocuments(true)}
            >
              <Text style={styles.manageButtonText}>{t.manageDocuments}</Text>
            </TouchableOpacity>
          </View>
          
          {profile.documents && Object.keys(profile.documents).length > 0 ? (
            Object.entries(profile.documents).map(([docType, docUrl]) => {
              if (!docUrl) return null
              const status = getDocumentStatus(docType)
              
              return (
                <View key={docType} style={styles.documentRow}>
                  <Text style={styles.documentType}>
                    {docType.charAt(0).toUpperCase() + docType.slice(1)}
                  </Text>
                  <View style={[styles.documentStatus, { backgroundColor: status.color }]}>
                    <Text style={styles.documentStatusText}>{status.text}</Text>
                  </View>
                </View>
              )
            })
          ) : (
            <Text style={styles.noDocumentsText}>{t.noDocuments}</Text>
          )}
        </View>
      </ScrollView>

      {/* Photo Options Modal */}
      <Modal visible={showPhotoOptions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.photoOptionsModal}>
            <Text style={styles.modalTitle}>{t.changePhoto}</Text>
            <TouchableOpacity
              style={styles.photoOptionButton}
              onPress={() => handlePhotoUpload('camera')}
            >
              <Text style={styles.photoOptionText}>📷 {t.takePhoto}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoOptionButton}
              onPress={() => handlePhotoUpload('gallery')}
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

      {/* Document Management Modal */}
      {showDocuments && (
        <Modal visible={showDocuments} animationType="slide">
          <DocumentManagementScreen
            language={language}
            profile={profile}
            onClose={() => setShowDocuments(false)}
            onUpdate={(updatedProfile) => {
              setProfile(updatedProfile)
              setShowDocuments(false)
            }}
          />
        </Modal>
      )}

      {/* Profile Edit Modal */}
      {showEditProfile && (
        <Modal visible={showEditProfile} animationType="slide">
          <ProfileEditScreen
            language={language}
            profile={profile}
            onClose={() => setShowEditProfile(false)}
            onUpdate={(updatedProfile) => {
              setProfile(updatedProfile)
              setShowEditProfile(false)
            }}
          />
        </Modal>
      )}

      {/* Change Requests Modal */}
      {showChangeRequests && (
        <Modal visible={showChangeRequests} animationType="slide">
          <ChangeRequestScreen
            language={language}
            onClose={() => setShowChangeRequests(false)}
          />
        </Modal>
      )}
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
    color: '#333'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  settingsButtonText: {
    fontSize: 18,
    color: 'white'
  },
  requestsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  requestsButtonText: {
    fontSize: 18,
    color: 'white'
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  editButtonText: {
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
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2196F3',
    borderRadius: 20
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  completionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  completionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  profileCard: {
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
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  photoContainer: {
    position: 'relative',
    marginRight: 20
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#2196F3'
  },
  defaultPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2196F3'
  },
  defaultPhotoText: {
    fontSize: 30,
    color: '#666'
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIconText: {
    fontSize: 14,
    color: 'white'
  },
  basicInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  driverPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  statusContainer: {
    flexDirection: 'row'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  ratingSection: {
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 16,
    color: '#666'
  },
  statsCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  infoCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196F3',
    borderRadius: 15
  },
  manageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right'
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10
  },
  addButton: {
    padding: 15,
    backgroundColor: '#f8f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  addButtonText: {
    color: '#2196F3',
    fontWeight: 'bold'
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  documentType: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  documentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  documentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  noDocumentsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic'
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
  vehicleInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  vehicleValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold'
  }
})
