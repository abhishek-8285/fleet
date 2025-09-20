import React, { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  Modal
} from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { StyleSheet as RNStyleSheet } from 'react-native'
import * as FileSystem from 'expo-file-system'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaView } from 'react-native-safe-area-context'

// Platform-safe import for barcode scanner with fallback
let BarCodeScanner: any = null;
try {
  const barcodeModule = require('expo-barcode-scanner');
  BarCodeScanner = barcodeModule.BarCodeScanner;
} catch (error) {
  console.warn('BarCodeScanner not available in this environment - using fallback');
}

const { width, height } = Dimensions.get('window')

interface EnhancedCameraProps {
  language: 'en' | 'hi'
  onPhotoTaken: (uri: string, type: 'fuel' | 'delivery' | 'qr') => void
  onQRScanned: (data: string) => void
  photoType: 'fuel' | 'delivery' | 'qr' | null
  onClose: () => void
}

const translations = {
  en: {
    camera: 'Camera',
    takePhoto: 'Take Photo',
    retake: 'Retake',
    use: 'Use Photo',
    flash: 'Flash',
    flip: 'Flip Camera',
    gallery: 'Gallery',
    fuel: 'Fuel Receipt',
    delivery: 'Delivery Proof',
    qr: 'Vehicle QR Code',
    scanning: 'Scanning QR Code...',
    scanSuccess: 'QR Code Scanned!',
    photoSaved: 'Photo saved successfully',
    uploadOffline: 'Photo saved offline. Will sync when connected.',
    cameraError: 'Camera access required',
    permissionError: 'Please enable camera permissions'
  },
  hi: {
    camera: 'कैमरा',
    takePhoto: 'फोटो लें',
    retake: 'फिर से लें',
    use: 'फोटो उपयोग करें',
    flash: 'फ्लैश',
    flip: 'कैमरा पलटें',
    gallery: 'गैलरी',
    fuel: 'ईंधन रसीद',
    delivery: 'डिलीवरी प्रूफ',
    qr: 'वाहन QR कोड',
    scanning: 'QR कोड स्कैन कर रहे हैं...',
    scanSuccess: 'QR कोड स्कैन हो गया!',
    photoSaved: 'फोटो सफलतापूर्वक सेव हो गई',
    uploadOffline: 'फोटो ऑफलाइन सेव हो गई। कनेक्शन पर सिंक होगी।',
    cameraError: 'कैमरा एक्सेस आवश्यक है',
    permissionError: 'कृपया कैमरा अनुमति दें'
  }
}

export default function EnhancedCamera({
  language,
  onPhotoTaken,
  onQRScanned,
  photoType,
  onClose
}: EnhancedCameraProps) {
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<CameraType>('back')
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [isScanning, setIsScanning] = useState(photoType === 'qr')
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  const t = translations[language]

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  const takePicture = async () => {
    if (cameraRef.current) {
      setLoading(true)
      try {
        const result = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false
        })
        setPhoto(result.uri)
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture')
      }
      setLoading(false)
    }
  }

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8
    })

    if (!result.canceled && result.assets?.[0]) {
      setPhoto(result.assets[0].uri)
    }
  }

  const handleQRScanned = ({ data }: { data: string }) => {
    if (isScanning) {
      setIsScanning(false)
      Alert.alert(t.scanSuccess, `Vehicle ID: ${data}`, [
        { text: 'OK', onPress: () => onQRScanned(data) }
      ])
    }
  }

  const savePhoto = async () => {
    if (!photo || !photoType) return

    setLoading(true)
    try {
      // Create unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const extension = photo.split('.').pop()
      const filename = `${photoType}_${timestamp}.${extension}`
      
      // Save to app's document directory using latest API
      let localUri: string
      try {
        const docDir = (FileSystem as any).documentDirectory
        if (!docDir) {
          Alert.alert('Error', 'Document directory not available')
          return
        }
        const photosDirectory = docDir + 'photos/'
        
        // Ensure directory exists
        const dirInfo = await FileSystem.getInfoAsync(photosDirectory)
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(photosDirectory, { intermediates: true })
        }
        
        localUri = photosDirectory + filename
        await FileSystem.copyAsync({
          from: photo,
          to: localUri
        })
      } catch (fileError) {
        console.error('File system error:', fileError)
        Alert.alert('Error', 'Failed to save photo to device storage')
        return
      }

      // Store metadata for offline sync
      const photoMetadata = {
        uri: localUri,
        type: photoType,
        timestamp: new Date().toISOString(),
        uploaded: false,
        tripId: await AsyncStorage.getItem('currentTripId')
      }

      const offlinePhotos = await AsyncStorage.getItem('offlinePhotos') || '[]'
      const photosArray = JSON.parse(offlinePhotos)
      photosArray.push(photoMetadata)
      await AsyncStorage.setItem('offlinePhotos', JSON.stringify(photosArray))

      // Try to upload immediately if online
      await tryUploadPhoto(photoMetadata)

      onPhotoTaken(localUri, photoType)
      Alert.alert(t.photoSaved, t.uploadOffline)
      onClose()
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo')
    }
    setLoading(false)
  }

  const tryUploadPhoto = async (photoData: any) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) return

      const formData = new FormData()
      const fileName = photoData.uri.split('/').pop() || 'photo.jpg'
      formData.append('photo', {
        uri: photoData.uri,
        type: 'image/jpeg',
        name: fileName
      } as any)
      formData.append('type', photoData.type)
      formData.append('tripId', photoData.tripId || '')
      formData.append('timestamp', photoData.timestamp)

      const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8080'
      const response = await fetch(`${API_BASE}/api/v1/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      })

      if (response.ok) {
        // Mark as uploaded
        const offlinePhotos = await AsyncStorage.getItem('offlinePhotos') || '[]'
        const photosArray = JSON.parse(offlinePhotos)
        const updatedPhotos = photosArray.map((p: any) =>
          p.uri === photoData.uri ? { ...p, uploaded: true } : p
        )
        await AsyncStorage.setItem('offlinePhotos', JSON.stringify(updatedPhotos))
      }
    } catch (error) {
      console.log('Upload failed, will retry later:', error)
    }
  }

  const retakePhoto = () => {
    setPhoto(null)
    if (photoType === 'qr') {
      setIsScanning(true)
    }
  }

  const toggleFlash = () => {
    setFlash(flash === 'off' ? 'on' : 'off')
  }

  const flipCamera = () => {
    setFacing(facing === 'back' ? 'front' : 'back')
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t.permissionError}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Photo preview screen
  if (photo && photoType !== 'qr') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={retakePhoto}
            >
              <Text style={styles.buttonText}>{t.retake}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={savePhoto}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>{t.use}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {t[photoType as keyof typeof t] || t.camera}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cameraContainer}>
        {isScanning ? (
          BarCodeScanner ? (
            <BarCodeScanner
              onBarCodeScanned={handleQRScanned}
              style={styles.camera}
            >
              <View style={styles.scanningOverlay}>
                <View style={styles.scanningBox} />
                <Text style={styles.scanningText}>{t.scanning}</Text>
              </View>
            </BarCodeScanner>
          ) : (
            <View style={[styles.camera, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: 'white', textAlign: 'center', padding: 20, fontSize: 16 }}>
                📱 QR Scanner not available{'\n'}
                Please use a development build{'\n'}
                or update your Expo Go app
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#2196F3', padding: 15, borderRadius: 8, marginTop: 20 }}
                onPress={onClose}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.camera}>
            <CameraView
              ref={cameraRef}
              style={RNStyleSheet.absoluteFillObject}
              facing={facing}
              flash={flash}
            />
            <View style={styles.cameraOverlay}>
              {photoType && (
                <View style={styles.photoTypeIndicator}>
                  <Text style={styles.photoTypeText}>
                    📷 {t[photoType as keyof typeof t]}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {!isScanning && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={selectFromGallery}>
            <Text style={styles.controlIcon}>🖼️</Text>
            <Text style={styles.controlText}>{t.gallery}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            {loading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
            <Text style={styles.controlIcon}>🔄</Text>
            <Text style={styles.controlText}>{t.flip}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isScanning && (
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
            <Text style={styles.flashIcon}>
              {flash === 'off' ? '🔦' : '⚡'}
            </Text>
            <Text style={styles.flashText}>{t.flash}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  placeholder: {
    width: 40
  },
  cameraContainer: {
    flex: 1
  },
  camera: {
    flex: 1
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20
  },
  photoTypeIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  photoTypeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  scanningOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  scanningBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: 'transparent'
  },
  scanningText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center'
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  controlButton: {
    alignItems: 'center'
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 5
  },
  controlText: {
    color: 'white',
    fontSize: 12
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2196F3'
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3'
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  flashButton: {
    alignItems: 'center'
  },
  flashIcon: {
    fontSize: 24,
    marginBottom: 5
  },
  flashText: {
    color: 'white',
    fontSize: 12
  },
  previewContainer: {
    flex: 1
  },
  preview: {
    flex: 1,
    width: '100%'
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  button: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#2196F3'
  },
  secondaryButton: {
    backgroundColor: '#666'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  }
})
