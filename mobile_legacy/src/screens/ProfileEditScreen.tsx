import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Picker } from '@react-native-picker/picker'
import { apiService } from '../services/api'

interface ProfileEditScreenProps {
  language: 'en' | 'hi'
  profile: any
  onClose: () => void
  onUpdate: (updatedProfile: any) => void
}

const translations = {
  en: {
    title: 'Edit Profile',
    personalInfo: 'Personal Information',
    contactInfo: 'Contact Information',
    emergencyContact: 'Emergency Contact',
    bankDetails: 'Bank Details',
    name: 'Full Name',
    email: 'Email',
    address: 'Address',
    experience: 'Experience (Years)',
    emergencyName: 'Emergency Contact Name',
    emergencyPhone: 'Emergency Contact Phone',
    relationship: 'Relationship',
    accountNumber: 'Account Number',
    ifscCode: 'IFSC Code',
    bankName: 'Bank Name',
    accountHolderName: 'Account Holder Name',
    save: 'Save Changes',
    cancel: 'Cancel',
    saving: 'Saving...',
    success: 'Success',
    error: 'Error',
    profileUpdated: 'Profile updated successfully',
    failedToUpdate: 'Failed to update profile',
    nameRequired: 'Name is required',
    emailInvalid: 'Please enter a valid email',
    phoneInvalid: 'Please enter a valid phone number',
    ifscInvalid: 'Please enter a valid IFSC code',
    selectRelationship: 'Select Relationship',
    father: 'Father',
    mother: 'Mother',
    spouse: 'Spouse',
    brother: 'Brother',
    sister: 'Sister',
    friend: 'Friend',
    other: 'Other',
    namePlaceholder: 'Enter your full name',
    emailPlaceholder: 'Enter your email address',
    addressPlaceholder: 'Enter your complete address',
    emergencyNamePlaceholder: 'Enter emergency contact name',
    emergencyPhonePlaceholder: 'Enter emergency contact phone',
    accountNumberPlaceholder: 'Enter account number',
    ifscPlaceholder: 'Enter IFSC code',
    bankNamePlaceholder: 'Enter bank name',
    accountHolderPlaceholder: 'Enter account holder name',
    optional: '(Optional)',
    required: '(Required)'
  },
  hi: {
    title: 'प्रोफाइल संपादित करें',
    personalInfo: 'व्यक्तिगत जानकारी',
    contactInfo: 'संपर्क जानकारी',
    emergencyContact: 'आपातकालीन संपर्क',
    bankDetails: 'बैंक विवरण',
    name: 'पूरा नाम',
    email: 'ईमेल',
    address: 'पता',
    experience: 'अनुभव (वर्ष)',
    emergencyName: 'आपातकालीन संपर्क नाम',
    emergencyPhone: 'आपातकालीन संपर्क फोन',
    relationship: 'रिश्ता',
    accountNumber: 'खाता संख्या',
    ifscCode: 'IFSC कोड',
    bankName: 'बैंक का नाम',
    accountHolderName: 'खाता धारक का नाम',
    save: 'परिवर्तन सेव करें',
    cancel: 'रद्द करें',
    saving: 'सेव हो रहा है...',
    success: 'सफलता',
    error: 'त्रुटि',
    profileUpdated: 'प्रोफाइल सफलतापूर्वक अपडेट',
    failedToUpdate: 'प्रोफाइल अपडेट करने में विफल',
    nameRequired: 'नाम आवश्यक है',
    emailInvalid: 'कृपया वैध ईमेल दर्ज करें',
    phoneInvalid: 'कृपया वैध फोन नंबर दर्ज करें',
    ifscInvalid: 'कृपया वैध IFSC कोड दर्ज करें',
    selectRelationship: 'रिश्ता चुनें',
    father: 'पिता',
    mother: 'माता',
    spouse: 'पति/पत्नी',
    brother: 'भाई',
    sister: 'बहन',
    friend: 'मित्र',
    other: 'अन्य',
    namePlaceholder: 'अपना पूरा नाम दर्ज करें',
    emailPlaceholder: 'अपना ईमेल पता दर्ज करें',
    addressPlaceholder: 'अपना पूरा पता दर्ज करें',
    emergencyNamePlaceholder: 'आपातकालीन संपर्क नाम दर्ज करें',
    emergencyPhonePlaceholder: 'आपातकालीन संपर्क फोन दर्ज करें',
    accountNumberPlaceholder: 'खाता संख्या दर्ज करें',
    ifscPlaceholder: 'IFSC कोड दर्ज करें',
    bankNamePlaceholder: 'बैंक का नाम दर्ज करें',
    accountHolderPlaceholder: 'खाता धारक का नाम दर्ज करें',
    optional: '(वैकल्पिक)',
    required: '(आवश्यक)'
  }
}

const relationships = ['father', 'mother', 'spouse', 'brother', 'sister', 'friend', 'other']

export default function ProfileEditScreen({ language, profile, onClose, onUpdate }: ProfileEditScreenProps) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    email: profile.email || '',
    address: profile.address || '',
    experience: profile.experience?.toString() || '',
    emergencyContact: {
      name: profile.emergencyContact?.name || '',
      phone: profile.emergencyContact?.phone || '',
      relationship: profile.emergencyContact?.relationship || 'father'
    },
    bankDetails: {
      accountNumber: profile.bankDetails?.accountNumber || '',
      ifscCode: profile.bankDetails?.ifscCode || '',
      bankName: profile.bankDetails?.bankName || '',
      accountHolderName: profile.bankDetails?.accountHolderName || ''
    }
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const t = translations[language]

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired
    }

    // Email validation
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t.emailInvalid
      }
    }

    // Emergency phone validation
    if (formData.emergencyContact.phone.trim()) {
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.emergencyContact.phone)) {
        newErrors.emergencyPhone = t.phoneInvalid
      }
    }

    // IFSC validation
    if (formData.bankDetails.ifscCode.trim()) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
      if (!ifscRegex.test(formData.bankDetails.ifscCode)) {
        newErrors.ifscCode = t.ifscInvalid
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        experience: formData.experience ? parseInt(formData.experience) : null,
        emergencyContact: formData.emergencyContact.name.trim() ? {
          name: formData.emergencyContact.name.trim(),
          phone: formData.emergencyContact.phone.trim(),
          relationship: formData.emergencyContact.relationship
        } : null,
        bankDetails: formData.bankDetails.accountNumber.trim() ? {
          accountNumber: formData.bankDetails.accountNumber.trim(),
          ifscCode: formData.bankDetails.ifscCode.trim(),
          bankName: formData.bankDetails.bankName.trim(),
          accountHolderName: formData.bankDetails.accountHolderName.trim()
        } : null
      }

      const result = await apiService.updateDriverProfile(String(profile.id), updateData)
      
      if (result.success) {
        Alert.alert(
          t.success, 
          'Change request submitted to admin for approval. You will be notified when reviewed.',
          [{ text: t.ok, onPress: () => onClose() }]
        )
      } else {
        Alert.alert(t.error, result.error || t.failedToUpdate)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert(t.error, t.failedToUpdate)
    } finally {
      setLoading(false)
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

  const updateFormData = (section: string, field: string, value: string) => {
    if (section === 'main') {
      setFormData(prev => ({ ...prev, [field]: value }))
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any),
          [field]: value
        }
      }))
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
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
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 {t.personalInfo}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.name} <Text style={styles.required}>{t.required}</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateFormData('main', 'name', value)}
                placeholder={t.namePlaceholder}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.email} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(value) => updateFormData('main', 'email', value)}
                placeholder={t.emailPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.address} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => updateFormData('main', 'address', value)}
                placeholder={t.addressPlaceholder}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.experience} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.experience}
                onChangeText={(value) => updateFormData('main', 'experience', value)}
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 {t.emergencyContact}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.emergencyName} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.emergencyContact.name}
                onChangeText={(value) => updateFormData('emergencyContact', 'name', value)}
                placeholder={t.emergencyNamePlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.emergencyPhone} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.emergencyPhone && styles.inputError]}
                value={formData.emergencyContact.phone}
                onChangeText={(value) => updateFormData('emergencyContact', 'phone', value)}
                placeholder={t.emergencyPhonePlaceholder}
                keyboardType="phone-pad"
              />
              {errors.emergencyPhone && <Text style={styles.errorText}>{errors.emergencyPhone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.relationship}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.emergencyContact.relationship}
                  onValueChange={(value) => updateFormData('emergencyContact', 'relationship', value)}
                  style={styles.picker}
                >
                  {relationships.map((rel) => (
                    <Picker.Item 
                      key={rel} 
                      label={t[rel as keyof typeof t]} 
                      value={rel} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          {/* Bank Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏦 {t.bankDetails}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.bankName} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.bankDetails.bankName}
                onChangeText={(value) => updateFormData('bankDetails', 'bankName', value)}
                placeholder={t.bankNamePlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.accountHolderName} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.bankDetails.accountHolderName}
                onChangeText={(value) => updateFormData('bankDetails', 'accountHolderName', value)}
                placeholder={t.accountHolderPlaceholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.accountNumber} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.bankDetails.accountNumber}
                onChangeText={(value) => updateFormData('bankDetails', 'accountNumber', value)}
                placeholder={t.accountNumberPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {t.ifscCode} <Text style={styles.optional}>{t.optional}</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.ifscCode && styles.inputError]}
                value={formData.bankDetails.ifscCode}
                onChangeText={(value) => updateFormData('bankDetails', 'ifscCode', value.toUpperCase())}
                placeholder={t.ifscPlaceholder}
                autoCapitalize="characters"
              />
              {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.actionButtonText}>{t.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.actionButtonText}>{t.save}</Text>
            )}
          </TouchableOpacity>
        </View>
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500'
  },
  required: {
    color: '#F44336',
    fontSize: 12
  },
  optional: {
    color: '#666',
    fontSize: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  inputError: {
    borderColor: '#F44336'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 5
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    overflow: 'hidden'
  },
  picker: {
    height: 50
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
  cancelButton: {
    backgroundColor: '#666'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  }
})
