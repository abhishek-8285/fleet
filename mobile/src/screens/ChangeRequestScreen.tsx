import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiService } from '../services/api'

interface ChangeRequestScreenProps {
  language: 'en' | 'hi'
  onClose: () => void
}

interface ChangeRequest {
  id: string
  request_type: string
  requested_changes: any
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason?: string
  submitted_at: string
  reviewed_at?: string
  admin_comments?: string
}

const translations = {
  en: {
    title: 'Change Requests',
    noRequests: 'No change requests found',
    pending: 'Pending',
    approved: 'Approved', 
    rejected: 'Rejected',
    submittedOn: 'Submitted on',
    reviewedOn: 'Reviewed on',
    adminComments: 'Admin Comments',
    requestType: 'Request Type',
    profileUpdate: 'Profile Update',
    documentUpdate: 'Document Update',
    cancel: 'Cancel Request',
    close: 'Close',
    loading: 'Loading...',
    refreshing: 'Refreshing...',
    cancelConfirm: 'Cancel this change request?',
    yes: 'Yes',
    no: 'No',
    cancelled: 'Change request cancelled',
    cancelFailed: 'Failed to cancel request'
  },
  hi: {
    title: 'परिवर्तन अनुरोध',
    noRequests: 'कोई परिवर्तन अनुरोध नहीं मिला',
    pending: 'लंबित',
    approved: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    submittedOn: 'प्रस्तुत किया गया',
    reviewedOn: 'समीक्षा की गई',
    adminComments: 'व्यवस्थापक टिप्पणी',
    requestType: 'अनुरोध प्रकार',
    profileUpdate: 'प्रोफाइल अपडेट',
    documentUpdate: 'दस्तावेज़ अपडेट',
    cancel: 'अनुरोध रद्द करें',
    close: 'बंद करें',
    loading: 'लोड हो रहा है...',
    refreshing: 'रिफ्रेश हो रहा है...',
    cancelConfirm: 'इस परिवर्तन अनुरोध को रद्द करें?',
    yes: 'हाँ',
    no: 'नहीं',
    cancelled: 'परिवर्तन अनुरोध रद्द कर दिया गया',
    cancelFailed: 'अनुरोध रद्द करने में विफल'
  }
}

export default function ChangeRequestScreen({ language, onClose }: ChangeRequestScreenProps) {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const t = translations[language]

  useEffect(() => {
    loadChangeRequests()
  }, [])

  const loadChangeRequests = async () => {
    try {
      setLoading(true)
      const result = await apiService.getDriverChangeRequests()
      
      if (result.success && result.data) {
        setRequests(result.data)
      } else {
        console.log('No change requests or API not available')
        setRequests([])
      }
    } catch (error) {
      console.error('Error loading change requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadChangeRequests()
    setRefreshing(false)
  }

  const cancelRequest = async (requestId: string) => {
    Alert.alert(
      t.cancelConfirm,
      '',
      [
        { text: t.no, style: 'cancel' },
        {
          text: t.yes,
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiService.cancelChangeRequest(requestId)
              if (result.success) {
                Alert.alert(t.cancelled)
                loadChangeRequests()
              } else {
                Alert.alert(t.cancelFailed)
              }
            } catch (error) {
              Alert.alert(t.cancelFailed)
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return '#FF9800'
      case 'APPROVED': return '#4CAF50' 
      case 'REJECTED': return '#F44336'
      default: return '#666'
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRequestTypeDisplay = (type: string): string => {
    switch (type) {
      case 'PROFILE_UPDATE': return t.profileUpdate
      case 'DOCUMENT_UPDATE': return t.documentUpdate
      default: return type
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length > 0 ? (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* Request Header */}
              <View style={styles.requestHeader}>
                <View>
                  <Text style={styles.requestType}>
                    {getRequestTypeDisplay(request.request_type)}
                  </Text>
                  <Text style={styles.submittedDate}>
                    {t.submittedOn}: {formatDate(request.submitted_at)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                  <Text style={styles.statusText}>{t[request.status.toLowerCase() as keyof typeof t]}</Text>
                </View>
              </View>

              {/* Requested Changes */}
              <View style={styles.changesSection}>
                <Text style={styles.changesTitle}>Requested Changes:</Text>
                {Object.entries(request.requested_changes).map(([field, value]) => (
                  <View key={field} style={styles.changeRow}>
                    <Text style={styles.changeField}>{field}:</Text>
                    <Text style={styles.changeValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>

              {/* Admin Comments */}
              {request.admin_comments && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>{t.adminComments}:</Text>
                  <Text style={styles.commentsText}>{request.admin_comments}</Text>
                </View>
              )}

              {/* Actions */}
              {request.status === 'PENDING' && (
                <View style={styles.actionsSection}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelRequest(request.id)}
                  >
                    <Text style={styles.cancelButtonText}>{t.cancel}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Review Date */}
              {request.reviewed_at && (
                <Text style={styles.reviewDate}>
                  {t.reviewedOn}: {formatDate(request.reviewed_at)}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>📝</Text>
            <Text style={styles.emptyTitle}>{t.noRequests}</Text>
            <Text style={styles.emptySubtext}>
              Profile change requests will appear here
            </Text>
          </View>
        )}
      </ScrollView>
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    fontSize: 18,
    color: '#666'
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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  submittedDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
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
  changesSection: {
    marginBottom: 15
  },
  changesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  changeField: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  changeValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right'
  },
  commentsSection: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  commentsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F44336',
    borderRadius: 20
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 10
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 60,
    marginBottom: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
})
