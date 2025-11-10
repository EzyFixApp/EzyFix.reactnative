/**
 * Push Notification Service
 * Handles local and push notifications for quote updates
 * Features:
 * - Register for push notifications
 * - Schedule local notifications
 * - Handle notification responses
 * - Custom notification sounds
 * - Quote notification templates
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface QuoteNotificationData {
  type: 'new_quote' | 'quote_accepted' | 'quote_rejected';
  quoteId: string;
  serviceRequestId: string;
  serviceName: string;
  technicianName?: string;
  customerName?: string;
  amount: number;
  isEstimated: boolean;
  notes?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  public async initialize(onNotificationResponse?: (data: any) => void): Promise<string | null> {
    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      this.expoPushToken = token;

      // Setup notification listeners
      this.setupListeners(onNotificationResponse);

      if (__DEV__) console.log('🔔 Notification service initialized with token:', token);
      return token;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to initialize notifications:', error);
      return null;
    }
  }

  /**
   * Register device for push notifications
   */
  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      if (__DEV__) console.warn('⚠️ Push notifications require a physical device');
      return null;
    }

    // Skip Expo push token registration in Expo Go (SDK 53+)
    // Local notifications still work fine
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      if (__DEV__) console.log('📱 Running in Expo Go - Skipping push token registration. Local notifications will still work.');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (__DEV__) {
        console.log('🔐 Current notification permission:', existingStatus);
      }

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        if (__DEV__) console.log('📲 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        if (__DEV__) console.log('📲 Permission request result:', status);
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) console.warn('⚠️ Notification permission not granted');
        Alert.alert(
          'Cần quyền thông báo',
          'EzyFix cần quyền thông báo để:\n\n• Thông báo khi có báo giá mới\n• Cập nhật trạng thái đơn hàng\n• Nhắc nhở lịch hẹn\n\nVui lòng bật quyền trong Cài đặt.',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Mở Cài đặt',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  // On iOS, opening settings requires Linking
                  import('react-native').then(({ Linking }) => {
                    Linking.openSettings();
                  });
                } else {
                  // On Android, can open app settings
                  import('react-native').then(({ Linking }) => {
                    Linking.openSettings();
                  });
                }
              }
            }
          ]
        );
        return null;
      }

      if (__DEV__) console.log('✅ Notification permission granted');

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        if (__DEV__) console.warn('⚠️ No EAS project ID found');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('quote-updates', {
          name: 'Cập nhật báo giá',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default', // Can be customized
          enableLights: true,
          lightColor: '#609CEF',
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync('order-updates', {
          name: 'Cập nhật đơn hàng',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          enableLights: true,
          lightColor: '#10B981',
          enableVibrate: true,
        });
      }

      // Save token to AsyncStorage
      await AsyncStorage.setItem('expoPushToken', tokenData.data);

      if (__DEV__) console.log('✅ Push token obtained:', tokenData.data);
      return tokenData.data;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  private setupListeners(onNotificationResponse?: (data: any) => void): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      if (__DEV__) {
        console.log('🔔 Notification received:', notification.request.content.title);
      }
    });

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (__DEV__) {
        console.log('👆 Notification tapped:', data);
      }

      // Call custom handler if provided
      if (onNotificationResponse) {
        onNotificationResponse(data);
      }
    });
  }

  /**
   * Get stored push token
   */
  public async getPushToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      this.expoPushToken = token;
      return token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Schedule local notification for new quote (Customer side)
   */
  public async scheduleQuoteNotification(data: QuoteNotificationData): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.warn('⚠️ Notification permission not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Báo giá mới từ thợ!',
          body: `${data.technicianName || 'Thợ'} đã gửi ${data.isEstimated ? 'báo giá dự kiến' : 'báo giá chốt'} cho ${data.serviceName}: ${this.formatCurrency(data.amount)}`,
          data: {
            type: data.type,
            quoteId: data.quoteId,
            serviceRequestId: data.serviceRequestId,
            serviceName: data.serviceName,
            amount: data.amount,
            isEstimated: data.isEstimated,
          },
          sound: 'default', // Play notification sound
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'quote-update',
        },
        trigger: null, // Immediate delivery
      });

      if (__DEV__) console.log('✅ Quote notification scheduled:', notificationId);
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for quote accepted (Technician side)
   */
  public async scheduleQuoteAcceptedNotification(data: QuoteNotificationData): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Báo giá được chấp nhận!',
          body: `${data.customerName || 'Khách hàng'} đã chấp nhận báo giá ${this.formatCurrency(data.amount)} cho ${data.serviceName}. Hãy chuẩn bị bắt đầu công việc!`,
          data: {
            type: data.type,
            quoteId: data.quoteId,
            serviceRequestId: data.serviceRequestId,
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Quote accepted notification scheduled');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for quote rejected (Technician side)
   */
  public async scheduleQuoteRejectedNotification(data: QuoteNotificationData): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '❌ Báo giá bị từ chối',
          body: `${data.customerName || 'Khách hàng'} đã từ chối báo giá cho ${data.serviceName}. Bạn có thể gửi báo giá mới hoặc liên hệ khách hàng.`,
          data: {
            type: data.type,
            quoteId: data.quoteId,
            serviceRequestId: data.serviceRequestId,
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Quote rejected notification scheduled');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for order status: PENDING (Finding technician)
   */
  public async notifyOrderPending(serviceRequestId: string, serviceName: string): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.warn('⚠️ Notification permission not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔍 Đang tìm thợ',
          body: `Chúng tôi đang tìm kiếm thợ phù hợp cho dịch vụ "${serviceName}". Vui lòng chờ trong giây lát...`,
          data: {
            type: 'ORDER_PENDING',
            serviceRequestId,
            serviceName,
            screen: 'order-tracking',
          },
          sound: 'default', // Ting ting sound
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'order-update',
        },
        trigger: null, // Immediate delivery
      });

      if (__DEV__) console.log('✅ Order PENDING notification sent:', notificationId);
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send PENDING notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for order status: ACCEPTED (Technician accepted)
   */
  public async notifyOrderAccepted(
    serviceRequestId: string, 
    serviceName: string, 
    technicianName?: string
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.warn('⚠️ Notification permission not granted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Thợ đã chấp nhận đơn!',
          body: technicianName 
            ? `Thợ ${technicianName} đã chấp nhận đơn hàng "${serviceName}" của bạn. Hãy chuẩn bị đón thợ!`
            : `Thợ đã chấp nhận đơn hàng "${serviceName}" của bạn. Hãy chuẩn bị đón thợ!`,
          data: {
            type: 'ORDER_ACCEPTED',
            serviceRequestId,
            serviceName,
            technicianName,
            screen: 'order-tracking',
          },
          sound: 'default', // Ting ting sound
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'order-update',
        },
        trigger: null, // Immediate delivery
      });

      if (__DEV__) console.log('✅ Order ACCEPTED notification sent:', notificationId);
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send ACCEPTED notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for order status: IN_PROGRESS
   */
  public async notifyOrderInProgress(serviceRequestId: string, serviceName: string): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔧 Đơn hàng đang thực hiện',
          body: `Thợ đã bắt đầu thực hiện dịch vụ "${serviceName}". Bạn có thể theo dõi tiến độ trực tiếp.`,
          data: {
            type: 'ORDER_IN_PROGRESS',
            serviceRequestId,
            serviceName,
            screen: 'order-tracking',
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Order IN_PROGRESS notification sent');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send IN_PROGRESS notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for order status: COMPLETED
   */
  public async notifyOrderCompleted(serviceRequestId: string, serviceName: string): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Hoàn thành đơn hàng',
          body: `Dịch vụ "${serviceName}" đã hoàn thành. Vui lòng kiểm tra và đánh giá chất lượng dịch vụ!`,
          data: {
            type: 'ORDER_COMPLETED',
            serviceRequestId,
            serviceName,
            screen: 'order-tracking',
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Order COMPLETED notification sent');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send COMPLETED notification:', error);
      return null;
    }
  }

  // ========================================
  // TECHNICIAN NOTIFICATIONS (Tiếng Việt)
  // ========================================

  /**
   * Thông báo cho thợ: Khách hàng chấp nhận báo giá
   */
  public async notifyTechnicianQuoteAccepted(
    serviceRequestId: string,
    serviceName: string,
    customerName?: string,
    amount?: number
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        if (__DEV__) console.warn('⚠️ Notification permission not granted');
        return null;
      }

      const amountText = amount ? `${amount.toLocaleString('vi-VN')} VNĐ` : '';
      const customerText = customerName || 'Khách hàng';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ Báo giá được chấp nhận!',
          body: amount
            ? `${customerText} đã chấp nhận báo giá ${amountText} cho "${serviceName}". Chuẩn bị xuất phát!`
            : `${customerText} đã chấp nhận báo giá cho "${serviceName}". Chuẩn bị xuất phát!`,
          data: {
            type: 'TECHNICIAN_QUOTE_ACCEPTED',
            serviceRequestId,
            serviceName,
            customerName,
            amount,
            screen: 'technician-order-tracking',
          },
          sound: 'default', // Ting ting sound
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.MAX,
          categoryIdentifier: 'technician-order-update',
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Technician QUOTE_ACCEPTED notification sent:', notificationId);
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send technician QUOTE_ACCEPTED notification:', error);
      return null;
    }
  }

  /**
   * Thông báo cho thợ: Đã tới hẹn (sắp tới giờ appointment)
   */
  public async notifyTechnicianAppointmentReminder(
    serviceRequestId: string,
    serviceName: string,
    appointmentTime: string,
    customerAddress?: string
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Nhắc lịch hẹn',
          body: customerAddress
            ? `Lịch hẹn "${serviceName}" lúc ${appointmentTime} tại ${customerAddress}. Chuẩn bị khởi hành!`
            : `Lịch hẹn "${serviceName}" lúc ${appointmentTime}. Đừng quên!`,
          data: {
            type: 'TECHNICIAN_APPOINTMENT_REMINDER',
            serviceRequestId,
            serviceName,
            appointmentTime,
            customerAddress,
            screen: 'technician-order-tracking',
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Technician APPOINTMENT_REMINDER notification sent');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send technician APPOINTMENT_REMINDER notification:', error);
      return null;
    }
  }

  /**
   * Thông báo cho thợ: Khách hàng đã thanh toán
   */
  public async notifyTechnicianPaymentReceived(
    serviceRequestId: string,
    serviceName: string,
    amount: number
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const amountText = amount.toLocaleString('vi-VN') + ' VNĐ';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Đã nhận thanh toán',
          body: `Khách hàng đã thanh toán ${amountText} cho "${serviceName}". Công việc hoàn tất!`,
          data: {
            type: 'TECHNICIAN_PAYMENT_RECEIVED',
            serviceRequestId,
            serviceName,
            amount,
            screen: 'technician-order-tracking',
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Technician PAYMENT_RECEIVED notification sent');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send technician PAYMENT_RECEIVED notification:', error);
      return null;
    }
  }

  /**
   * Thông báo cho thợ: Khách hàng đã đánh giá
   */
  public async notifyTechnicianReviewed(
    serviceRequestId: string,
    serviceName: string,
    rating: number,
    customerName?: string
  ): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return null;

      const stars = '⭐'.repeat(Math.round(rating));
      const customerText = customerName || 'Khách hàng';

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⭐ Nhận đánh giá mới',
          body: `${customerText} đã đánh giá ${stars} (${rating}/5) cho "${serviceName}". Xem chi tiết!`,
          data: {
            type: 'TECHNICIAN_REVIEWED',
            serviceRequestId,
            serviceName,
            rating,
            customerName,
            screen: 'technician-order-tracking',
          },
          sound: 'default',
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });

      if (__DEV__) console.log('✅ Technician REVIEWED notification sent');
      return notificationId;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to send technician REVIEWED notification:', error);
      return null;
    }
  }

  /**
   * Clear all notifications
   */
  public async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Get badge count
   */
  public async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  }

  /**
   * Cleanup listeners
   */
  public cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
