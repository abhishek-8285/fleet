// Platform-safe import for notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('Expo Notifications not available in this environment - using fallback');
}
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiService } from './api'

export interface NotificationData {
  tripId?: string
  type: 'NEW_TRIP' | 'TRIP_UPDATE' | 'FUEL_ALERT' | 'EMERGENCY' | 'SYSTEM'
  title: string
  message: string
  data?: any
}

// Configure notification behavior only if available
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

class NotificationService {
  private expoPushToken: string | null = null
  private isInitialized = false

  async initialize(): Promise<boolean> {
    try {
      if (!Notifications) {
        console.log('Notifications not available in this environment (Expo Go limitation)')
        return false
      }

      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications')
        return false
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!')
        return false
      }

      // Get the Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      })

      this.expoPushToken = token.data
      console.log('Expo Push Token:', this.expoPushToken)

      // Store token locally
      if (this.expoPushToken) {
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken)
      }

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels()
      }

      // Register token with backend
      await this.registerTokenWithBackend()

      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Error initializing notifications:', error)
      return false
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    if (!Notifications) return;
    
    // High priority channel for trip assignments and emergencies
    await Notifications.setNotificationChannelAsync('high-priority', {
      name: 'High Priority',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
    })

    // Normal priority for trip updates
    await Notifications.setNotificationChannelAsync('trip-updates', {
      name: 'Trip Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      sound: 'default',
      enableVibrate: true,
    })

    // Low priority for system messages
    await Notifications.setNotificationChannelAsync('system-messages', {
      name: 'System Messages',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    })
  }

  private async registerTokenWithBackend(): Promise<void> {
    if (!this.expoPushToken) return

    try {
      // Use public method instead of private request method
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/v1/driver/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token: this.expoPushToken,
          platform: Platform.OS,
          deviceModel: Device.modelName,
          osVersion: Device.osVersion
        })
      })
      
      const result = await response.json()

      if (result.success) {
        console.log('Push token registered with backend')
      } else {
        console.error('Failed to register push token:', result.error)
      }
    } catch (error) {
      console.error('Error registering push token:', error)
    }
  }

  async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      if (!Notifications) {
        console.log('Notification fallback:', notification.title, '-', notification.message)
        return
      }

      const channelId = this.getChannelIdForNotificationType(notification.type)
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data,
          sound: 'default',
          priority: notification.type === 'EMERGENCY' || notification.type === 'NEW_TRIP' 
            ? Notifications.AndroidImportance.HIGH 
            : Notifications.AndroidImportance.DEFAULT,
        },
        trigger: null, // Show immediately
        ...(Platform.OS === 'android' && { 
          identifier: channelId,
          content: {
            ...notification,
            channelId
          }
        })
      })

      console.log('Local notification shown:', notification.title)
    } catch (error) {
      console.error('Error showing local notification:', error)
    }
  }

  private getChannelIdForNotificationType(type: string): string {
    switch (type) {
      case 'NEW_TRIP':
      case 'EMERGENCY':
        return 'high-priority'
      case 'TRIP_UPDATE':
        return 'trip-updates'
      case 'SYSTEM':
      case 'FUEL_ALERT':
      default:
        return 'system-messages'
    }
  }

  // Handle notification received while app is in foreground
  addNotificationReceivedListener(handler: (notification: any) => void): any {
    if (!Notifications) {
      console.log('Notification listeners not available in Expo Go')
      return { remove: () => {} }
    }
    return Notifications.addNotificationReceivedListener(handler)
  }

  // Handle notification tap
  addNotificationResponseReceivedListener(handler: (response: any) => void): any {
    if (!Notifications) {
      console.log('Notification response listeners not available in Expo Go')
      return { remove: () => {} }
    }
    return Notifications.addNotificationResponseReceivedListener(handler)
  }

  // Trip-specific notifications
  async showTripAssignmentNotification(trip: any): Promise<void> {
    const notification: NotificationData = {
      type: 'NEW_TRIP',
      title: 'New Trip Assignment 🚛',
      message: `Trip from ${trip.pickup} to ${trip.destination}. Tap to view details.`,
      tripId: trip.id,
      data: { tripId: trip.id, action: 'view_trip' }
    }

    await this.showLocalNotification(notification)
  }

  async showTripUpdateNotification(tripId: string, status: string, message: string): Promise<void> {
    const statusEmojis: { [key: string]: string } = {
      'started': '🚀',
      'completed': '✅',
      'cancelled': '❌',
      'delayed': '⏰'
    }

    const notification: NotificationData = {
      type: 'TRIP_UPDATE',
      title: `Trip ${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmojis[status] || '📝'}`,
      message,
      tripId,
      data: { tripId, status, action: 'view_trip' }
    }

    await this.showLocalNotification(notification)
  }

  async showFuelAlertNotification(vehicleId: string, alertType: string, message: string): Promise<void> {
    const notification: NotificationData = {
      type: 'FUEL_ALERT',
      title: `Fuel Alert ⛽`,
      message: `Vehicle ${vehicleId}: ${message}`,
      data: { vehicleId, alertType, action: 'view_fuel' }
    }

    await this.showLocalNotification(notification)
  }

  async showEmergencyNotification(message: string): Promise<void> {
    const notification: NotificationData = {
      type: 'EMERGENCY',
      title: 'Emergency Alert 🚨',
      message,
      data: { action: 'emergency_response' }
    }

    await this.showLocalNotification(notification)
  }

  async showSystemNotification(title: string, message: string): Promise<void> {
    const notification: NotificationData = {
      type: 'SYSTEM',
      title,
      message,
      data: { action: 'system_message' }
    }

    await this.showLocalNotification(notification)
  }

  // Notification handling for different app states
  async handleNotificationAction(response: any): Promise<void> {
    if (!response?.notification?.request?.content) return
    
    const { data } = response.notification.request.content
    console.log('Notification action:', data)

    if (data?.action) {
      switch (data.action) {
        case 'view_trip':
          // Navigate to trip details screen
          this.navigateToTrip(data.tripId)
          break
        case 'view_fuel':
          // Navigate to fuel management screen
          this.navigateToFuel()
          break
        case 'emergency_response':
          // Handle emergency response
          this.handleEmergencyResponse()
          break
        case 'system_message':
          // Navigate to notifications/messages screen
          this.navigateToMessages()
          break
        default:
          console.log('Unknown notification action:', data.action)
      }
    }
  }

  private navigateToTrip(tripId: string): void {
    // This will be handled by the navigation service
    // For now, just store the trip ID to be handled by the main app
    AsyncStorage.setItem('pendingTripNavigation', tripId)
  }

  private navigateToFuel(): void {
    AsyncStorage.setItem('pendingNavigation', 'fuel')
  }

  private handleEmergencyResponse(): void {
    AsyncStorage.setItem('pendingNavigation', 'emergency')
  }

  private navigateToMessages(): void {
    AsyncStorage.setItem('pendingNavigation', 'messages')
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return
    await Notifications.setBadgeCountAsync(count)
  }

  async clearBadge(): Promise<void> {
    if (!Notifications) return
    await Notifications.setBadgeCountAsync(0)
  }

  // Get notification history
  async getNotificationHistory(): Promise<any[]> {
    if (!Notifications) return []
    return await Notifications.getPresentedNotificationsAsync()
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (!Notifications) return
    await Notifications.dismissAllNotificationsAsync()
  }

  // Check if notifications are enabled
  async areNotificationsEnabled(): Promise<boolean> {
    if (!Notifications) return false
    const { status } = await Notifications.getPermissionsAsync()
    return status === 'granted'
  }

  // Get push token
  getPushToken(): string | null {
    return this.expoPushToken
  }

  // Check if service is initialized
  getInitializationStatus(): boolean {
    return this.isInitialized
  }

  // Schedule recurring notifications (for reminders, etc.)
  async scheduleRecurringNotification(
    title: string,
    message: string,
    triggerTime: Date,
    repeatInterval?: 'day' | 'week' | 'month'
  ): Promise<string> {
    if (!Notifications) {
      console.log('Scheduled notifications not available in Expo Go')
      return 'fallback-id'
    }

    let trigger: any = {
      date: triggerTime,
    }

    if (repeatInterval) {
      switch (repeatInterval) {
        case 'day':
          trigger = {
            hour: triggerTime.getHours(),
            minute: triggerTime.getMinutes(),
            repeats: true,
          }
          break
        case 'week':
          trigger = {
            weekday: triggerTime.getDay() + 1,
            hour: triggerTime.getHours(),
            minute: triggerTime.getMinutes(),
            repeats: true,
          }
          break
        case 'month':
          trigger = {
            day: triggerTime.getDate(),
            hour: triggerTime.getHours(),
            minute: triggerTime.getMinutes(),
            repeats: true,
          }
          break
      }
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: 'default',
      },
      trigger,
    })

    return identifier
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(identifier: string): Promise<void> {
    if (!Notifications) return
    await Notifications.cancelScheduledNotificationAsync(identifier)
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<any[]> {
    if (!Notifications) return []
    return await Notifications.getAllScheduledNotificationsAsync()
  }
}

export const notificationService = new NotificationService()
export default notificationService
