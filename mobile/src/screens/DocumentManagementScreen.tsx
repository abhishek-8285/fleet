import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// Document picker temporarily disabled for web compatibility
// import * as DocumentPicker from 'react-native-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { PermissionsManager } from '../utils/permissions'
import { apiService } from '../services/api'

interface DocumentManagementScreenProps {
  language: 'en' | 'hi'
  profile: any
  onClose: () => void
  onUpdate: (updatedProfile: any) => void
}

interface DocumentInfo {
  type: string
  name: string
  icon: string
  required: boolean
  expiryRequired: boolean
}

const documentTypes: DocumentInfo[] = [
  { type: 'license', name: 'Driving License', icon: '🚗', required: true, expiryRequired: true },
  { type: 'aadhar', name: 'Aadhar Card', icon: '🆔', required: true, expiryRequired: false },
  { type: 'medical', name: 'Medical Certificate', icon: '🩺', required: true, expiryRequired: true },
  { type: 'insurance', name: 'Insurance Certificate', icon: '🛡️', required: false, expiryRequired: true },
  { type: 'pcc', name: 'Police Clearance', icon: '👮', required: false, expiryRequired: true },
  { type: 'training', name: 'Training Certificate', icon: '🎓', required: false, expiryRequired: true }
]

const translations = {
  en: {
    title: 'Document Management',
    requiredDocuments: 'Required Documents',
    optionalDocuments: 'Optional Documents',
    uploadDocument: 'Upload Document',
    viewDocument: 'View Document',
    updateDocument: 'Update Document',
    deleteDocument: 'Delete Document',
    expiryDate: 'Expiry Date',
    documentNumber: 'Document Number',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    chooseFile: 'Choose File',
    uploading: 'Uploading...',
    uploaded: 'Document uploaded successfully',
    updated: 'Document updated successfully',
    deleted: 'Document deleted successfully',
    error: 'Error',
    success: 'Success',
    confirmDelete: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this document?',
    yes: 'Yes',
    no: 'No',
    required: 'Required',
    optional: 'Optional',
    expired: 'Expired',
    expiringIn: 'Expires in',
    days: 'days',
    validUntil: 'Valid until',
    documentDetails: 'Document Details',
    enterExpiryDate: 'Enter expiry date (DD/MM/YYYY)',
    enterDocumentNumber: 'Enter document number',
    invalidDate: 'Please enter a valid date',
    selectUploadMethod: 'Select Upload Method',
    documentPreview: 'Document Preview',
    loading: 'Loading...',
    noDocuments: 'No documents uploaded yet',
    uploadFirst: 'Upload your first document',
    allRequired: 'All required documents uploaded!',
    someRequired: 'Some required documents are missing',
    completionStatus: 'Completion Status'
  },
  hi: {
    title: 'दस्तावेज़ प्रबंधन',
    requiredDocuments: 'आवश्यक दस्तावेज़',
    optionalDocuments: 'वैकल्पिक दस्तावेज़',
    uploadDocument: 'दस्तावेज़ अपलोड करें',
    viewDocument: 'दस्तावेज़ देखें',
    updateDocument: 'दस्तावेज़ अपडेट करें',
    deleteDocument: 'दस्तावेज़ हटाएं',
    expiryDate: 'समाप्ति तिथि',
    documentNumber: 'दस्तावेज़ संख्या',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    takePhoto: 'फोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    chooseFile: 'फाइल चुनें',
    uploading: 'अपलोड हो रहा है...',
    uploaded: 'दस्तावेज़ सफलतापूर्वक अपलोड',
    updated: 'दस्तावेज़ सफलतापूर्वक अपडेट',
    deleted: 'दस्तावेज़ सफलतापूर्वक हटाया गया',
    error: 'त्रुटि',
    success: 'सफलता',
    confirmDelete: 'हटाना पुष्टि करें',
    deleteMessage: 'क्या आप वाकई इस दस्तावेज़ को हटाना चाहते हैं?',
    yes: 'हां',
    no: 'नहीं',
    required: 'आवश्यक',
    optional: 'वैकल्पिक',
    expired: 'समाप्त',
    expiringIn: 'समाप्त हो रहा है',
    days: 'दिन',
    validUntil: 'तक वैध',
    documentDetails: 'दस्तावेज़ विवरण',
    enterExpiryDate: 'समाप्ति तिथि दर्ज करें (DD/MM/YYYY)',
    enterDocumentNumber: 'दस्तावेज़ संख्या दर्ज करें',
    invalidDate: 'कृपया वैध तिथि दर्ज करें',
    selectUploadMethod: 'अपलोड विधि चुनें',
    documentPreview: 'दस्तावेज़ पूर्वावलोकन',
    loading: 'लोड हो रहा है...',
    noDocuments: 'अभी तक कोई दस्तावेज़ अपलोड नहीं',
    uploadFirst: 'अपना पहला दस्तावेज़ अपलोड करें',
    allRequired: 'सभी आवश्यक दस्तावेज़ अपलोड!',
    someRequired: 'कुछ आवश्यक दस्तावेज़ गुम हैं',
    completionStatus: 'पूर्णता स्थिति'
  }
}

export default function DocumentManagementScreen({ language, profile, onClose, onUpdate }: DocumentManagementScreenProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(null)
  const [selectedDocumentData, setSelectedDocumentData] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [documentDetails, setDocumentDetails] = useState({
    expiryDate: '',
    documentNumber: ''
  })
  const [previewUri, setPreviewUri] = useState<string>('')

  const t = translations[language]

  const getDocumentStatus = (docType: string) => {
    const doc = profile.documents[docType]
    if (!doc) {
      return { status: 'missing', color: '#F44336', text: 'Not uploaded' }
    }
    
    // Check expiry if document has expiry data
    if (doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      if (daysUntilExpiry < 0) {
        return { status: 'expired', color: '#F44336', text: t.expired }
      } else if (daysUntilExpiry <= 30) {
        return { status: 'expiring', color: '#FF9800', text: `${t.expiringIn} ${daysUntilExpiry} ${t.days}` }
      }
    }
    
    return { status: 'valid', color: '#4CAF50', text: 'Valid' }
  }

  const calculateCompletion = () => {
    const requiredDocs = documentTypes.filter(doc => doc.required)
    const uploadedRequired = requiredDocs.filter(doc => profile.documents[doc.type]).length
    return { uploaded: uploadedRequired, total: requiredDocs.length }
  }

  const handleUploadDocument = (docInfo: DocumentInfo) => {
    setSelectedDocument(docInfo)
    setDocumentDetails({
      expiryDate: '',
      documentNumber: ''
    })
    setShowUploadModal(true)
  }

  const handleViewDocument = (docInfo: DocumentInfo) => {
    const doc = profile.documents[docInfo.type]
    if (doc) {
      setSelectedDocument(docInfo)
      setSelectedDocumentData(doc)
      setDocumentDetails({
        expiryDate: doc.expiryDate || '',
        documentNumber: doc.documentNumber || ''
      })
      setShowDetailsModal(true)
    }
  }

  const selectUploadMethod = () => {
    Alert.alert(
      t.selectUploadMethod,
      '',
      [
        { text: t.takePhoto, onPress: () => uploadFromCamera() },
        { text: t.chooseFromGallery, onPress: () => uploadFromGallery() },
        { text: t.chooseFile, onPress: () => uploadFromFiles() },
        { text: t.cancel, style: 'cancel' }
      ]
    )
  }

  const uploadFromCamera = async () => {
    try {
      const hasPermission = await PermissionsManager.requestCameraPermission()
      if (!hasPermission) {
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        await uploadDocument(result.assets[0].uri, 'image')
      }
    } catch (error) {
      console.error('Error taking photo:', error)
      Alert.alert(t.error, 'Failed to take photo')
    }
  }

  const uploadFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        await uploadDocument(result.assets[0].uri, 'image')
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error)
      Alert.alert(t.error, 'Failed to select photo')
    }
  }

  const uploadFromFiles = async () => {
    try {
      // Document picker temporarily disabled for web compatibility
      Alert.alert('Info', 'Document picker is temporarily disabled. Please use camera for now.')
      return
      /* const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.images, DocumentPicker.types.pdf],
      }) */

      if (result) {
        await uploadDocument(result.uri, result.type?.includes('pdf') ? 'pdf' : 'image')
      }
    } catch (error) {
      /* if (DocumentPicker.isCancel(error)) {
        // User cancelled
      } else { */
        console.error('Error selecting document:', error)
        Alert.alert(t.error, 'Failed to select document')
      // }
    }
  }

  const uploadDocument = async (uri: string, type: string) => {
    if (!selectedDocument) return

    setUploading(true)
    try {
      const uploadResult = await apiService.uploadPhoto(
        uri,
        'document',
        { 
          driverId: profile.id,
          documentType: selectedDocument.type,
          documentNumber: documentDetails.documentNumber,
          expiryDate: documentDetails.expiryDate
        }
      )
      
      if (uploadResult.success && uploadResult.data) {
        const updatedProfile = {
          ...profile,
          documents: {
            ...profile.documents,
            [selectedDocument.type]: {
              url: uploadResult.data.url,
              documentNumber: documentDetails.documentNumber,
              expiryDate: documentDetails.expiryDate,
              uploadedAt: new Date().toISOString(),
              type: type
            }
          }
        }
        
        onUpdate(updatedProfile)
        setShowUploadModal(false)
        Alert.alert(t.success, t.uploaded)
      } else {
        Alert.alert(t.error, 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      Alert.alert(t.error, 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const updateDocument = async () => {
    if (!selectedDocument || !selectedDocumentData) return

    setUploading(true)
    try {
      // Update document metadata
      const result = await apiService.updateDocumentMetadata(
        profile.id,
        selectedDocument.type,
        {
          documentNumber: documentDetails.documentNumber,
          expiryDate: documentDetails.expiryDate
        }
      )
      
      if (result.success) {
        const updatedProfile = {
          ...profile,
          documents: {
            ...profile.documents,
            [selectedDocument.type]: {
              ...selectedDocumentData,
              documentNumber: documentDetails.documentNumber,
              expiryDate: documentDetails.expiryDate,
              updatedAt: new Date().toISOString()
            }
          }
        }
        
        onUpdate(updatedProfile)
        setShowDetailsModal(false)
        Alert.alert(t.success, t.updated)
      } else {
        Alert.alert(t.error, 'Failed to update document')
      }
    } catch (error) {
      console.error('Error updating document:', error)
      Alert.alert(t.error, 'Failed to update document')
    } finally {
      setUploading(false)
    }
  }

  const deleteDocument = async (docType: string) => {
    Alert.alert(
      t.confirmDelete,
      t.deleteMessage,
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiService.deleteDocument(profile.id, docType)
              
              if (result.success) {
                const updatedDocuments = { ...profile.documents }
                delete updatedDocuments[docType]
                
                const updatedProfile = {
                  ...profile,
                  documents: updatedDocuments
                }
                
                onUpdate(updatedProfile)
                Alert.alert(t.success, t.deleted)
              } else {
                Alert.alert(t.error, 'Failed to delete document')
              }
            } catch (error) {
              console.error('Error deleting document:', error)
              Alert.alert(t.error, 'Failed to delete document')
            }
          }
        }
      ]
    )
  }

  const previewDocument = (docInfo: DocumentInfo) => {
    const doc = profile.documents[docInfo.type]
    if (doc && doc.url) {
      setPreviewUri(doc.url)
      setShowPreviewModal(true)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const validateDate = (dateStr: string): boolean => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateStr.match(regex)
    if (!match) return false

    const day = parseInt(match[1])
    const month = parseInt(match[2])
    const year = parseInt(match[3])

    const date = new Date(year, month - 1, day)
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year
  }

  const completion = calculateCompletion()
  const requiredDocs = documentTypes.filter(doc => doc.required)
  const optionalDocs = documentTypes.filter(doc => !doc.required)

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Completion Status */}
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>{t.completionStatus}</Text>
          <View style={styles.completionInfo}>
            <Text style={styles.completionText}>
              {completion.uploaded}/{completion.total} {t.requiredDocuments.toLowerCase()}
            </Text>
            <Text style={[
              styles.completionStatus,
              { color: completion.uploaded === completion.total ? '#4CAF50' : '#FF9800' }
            ]}>
              {completion.uploaded === completion.total ? t.allRequired : t.someRequired}
            </Text>
          </View>
        </View>

        {/* Required Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ {t.requiredDocuments}</Text>
          {requiredDocs.map((docInfo) => {
            const doc = profile.documents[docInfo.type]
            const status = getDocumentStatus(docInfo.type)

            return (
              <View key={docInfo.type} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentIcon}>{docInfo.icon}</Text>
                    <View style={styles.documentText}>
                      <Text style={styles.documentName}>{docInfo.name}</Text>
                      <Text style={styles.documentRequired}>{t.required}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </View>

                {doc && (
                  <View style={styles.documentDetails}>
                    {doc.documentNumber && (
                      <Text style={styles.documentNumber}>#{doc.documentNumber}</Text>
                    )}
                    {doc.expiryDate && (
                      <Text style={styles.documentExpiry}>
                        {t.validUntil}: {formatDate(doc.expiryDate)}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.documentActions}>
                  {doc ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.viewButton]}
                        onPress={() => handleViewDocument(docInfo)}
                      >
                        <Text style={styles.actionButtonText}>{t.viewDocument}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.updateButton]}
                        onPress={() => handleUploadDocument(docInfo)}
                      >
                        <Text style={styles.actionButtonText}>{t.updateDocument}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.previewButton]}
                        onPress={() => previewDocument(docInfo)}
                      >
                        <Text style={styles.actionButtonText}>👁️</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.uploadButton]}
                      onPress={() => handleUploadDocument(docInfo)}
                    >
                      <Text style={styles.actionButtonText}>{t.uploadDocument}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* Optional Documents */}
        {optionalDocs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 {t.optionalDocuments}</Text>
            {optionalDocs.map((docInfo) => {
              const doc = profile.documents[docInfo.type]
              const status = getDocumentStatus(docInfo.type)

              return (
                <View key={docInfo.type} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentIcon}>{docInfo.icon}</Text>
                      <View style={styles.documentText}>
                        <Text style={styles.documentName}>{docInfo.name}</Text>
                        <Text style={styles.documentOptional}>{t.optional}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                      <Text style={styles.statusText}>{status.text}</Text>
                    </View>
                  </View>

                  {doc && (
                    <View style={styles.documentDetails}>
                      {doc.documentNumber && (
                        <Text style={styles.documentNumber}>#{doc.documentNumber}</Text>
                      )}
                      {doc.expiryDate && (
                        <Text style={styles.documentExpiry}>
                          {t.validUntil}: {formatDate(doc.expiryDate)}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.documentActions}>
                    {doc ? (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => handleViewDocument(docInfo)}
                        >
                          <Text style={styles.actionButtonText}>{t.viewDocument}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.updateButton]}
                          onPress={() => handleUploadDocument(docInfo)}
                        >
                          <Text style={styles.actionButtonText}>{t.updateDocument}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => deleteDocument(docInfo.type)}
                        >
                          <Text style={styles.actionButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.uploadButton]}
                        onPress={() => handleUploadDocument(docInfo)}
                      >
                        <Text style={styles.actionButtonText}>{t.uploadDocument}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <Text style={styles.modalTitle}>
              {selectedDocument?.icon} {selectedDocument?.name}
            </Text>

            {selectedDocument?.expiryRequired && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.expiryDate}</Text>
                <TextInput
                  style={styles.input}
                  value={documentDetails.expiryDate}
                  onChangeText={(text) => setDocumentDetails(prev => ({ ...prev, expiryDate: text }))}
                  placeholder={t.enterExpiryDate}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.documentNumber}</Text>
              <TextInput
                style={styles.input}
                value={documentDetails.documentNumber}
                onChangeText={(text) => setDocumentDetails(prev => ({ ...prev, documentNumber: text }))}
                placeholder={t.enterDocumentNumber}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.modalButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.uploadModalButton]}
                onPress={selectUploadMethod}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>{t.uploadDocument}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <Text style={styles.modalTitle}>
              {selectedDocument?.icon} {selectedDocument?.name}
            </Text>

            {selectedDocument?.expiryRequired && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t.expiryDate}</Text>
                <TextInput
                  style={styles.input}
                  value={documentDetails.expiryDate}
                  onChangeText={(text) => setDocumentDetails(prev => ({ ...prev, expiryDate: text }))}
                  placeholder={t.enterExpiryDate}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.documentNumber}</Text>
              <TextInput
                style={styles.input}
                value={documentDetails.documentNumber}
                onChangeText={(text) => setDocumentDetails(prev => ({ ...prev, documentNumber: text }))}
                placeholder={t.enterDocumentNumber}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.modalButtonText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>{t.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal visible={showPreviewModal} animationType="fade">
        <SafeAreaView style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.closePreviewText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.previewTitle}>{t.documentPreview}</Text>
          </View>
          
          <View style={styles.previewContainer}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.previewLoading}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>{t.loading}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
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
  completionCard: {
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
  completionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  completionInfo: {
    alignItems: 'center'
  },
  completionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5
  },
  completionStatus: {
    fontSize: 14,
    fontWeight: '500'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  documentCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12
  },
  documentText: {
    flex: 1
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  documentRequired: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500'
  },
  documentOptional: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  documentDetails: {
    paddingLeft: 36,
    marginBottom: 10
  },
  documentNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  documentExpiry: {
    fontSize: 12,
    color: '#666'
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 36
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 8
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  uploadButton: {
    backgroundColor: '#2196F3'
  },
  viewButton: {
    backgroundColor: '#4CAF50'
  },
  updateButton: {
    backgroundColor: '#FF9800'
  },
  deleteButton: {
    backgroundColor: '#F44336'
  },
  previewButton: {
    backgroundColor: '#9C27B0'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    minWidth: 300
  },
  detailsModal: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    minWidth: 300
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 15
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
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
  uploadModalButton: {
    backgroundColor: '#2196F3'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'black'
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  closePreviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closePreviewText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  previewTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewLoading: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16
  }
})
