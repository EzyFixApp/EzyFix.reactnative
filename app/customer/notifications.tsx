import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

type TabType = 'notifications' | 'messages';

interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'promo' | 'service';
  isRead: boolean;
  onPress?: () => void;
}

interface MessageItemProps {
  id: string;
  technicianName: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  isRead: boolean;
  onPress?: () => void;
}

function NotificationItem({ title, message, time, type, isRead, onPress }: NotificationItemProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'system':
        return 'notifications-outline';
      case 'promo':
        return 'gift-outline';
      case 'service':
        return 'construct-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'system':
        return '#2196F3';
      case 'promo':
        return '#FF9800';
      case 'service':
        return '#4CAF50';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        !isRead && styles.unreadItem
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.notificationIcon, { backgroundColor: `${getTypeColor()}15` }]}>
        <Ionicons name={getTypeIcon() as keyof typeof Ionicons.glyphMap} size={20} color={getTypeColor()} />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !isRead && styles.unreadText]}>
          {title}
        </Text>
        <Text style={[
          styles.notificationMessage,
          !isRead && { fontWeight: '600', color: '#374151' }
        ]} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>

      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function MessageItem({ technicianName, lastMessage, time, isRead, onPress }: MessageItemProps) {
  return (
    <TouchableOpacity 
      style={[
        styles.messageItem,
        !isRead && styles.unreadItem
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{technicianName.charAt(0)}</Text>
        </View>
      </View>
      
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.technicianName, !isRead && styles.unreadText]}>
            {technicianName}
          </Text>
          <Text style={styles.messageTime}>{time}</Text>
        </View>
        <Text style={[
          styles.lastMessage,
          !isRead && { fontWeight: '600', color: '#374151' }
        ]} numberOfLines={2}>
          {lastMessage}
        </Text>
      </View>

      {!isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('notifications');

  const handleBackPress = () => {
    router.back();
  };

  // Sample notifications data
  const notifications = [
    {
      id: '1',
      title: 'Thông báo từ EzyFix',
      message: 'Nhận ngay 50,000đ cho đơn hàng đầu tiên. Đặt lịch hẹn ngay để được giảm giá!',
      time: 'Th 6',
      type: 'promo' as const,
      isRead: false
    },
    {
      id: '2',
      title: 'Kỹ thuật viên đang trên đường đến địa chỉ của bạn',
      message: 'Dự kiến đến lúc: 14:30 hôm nay.',
      time: 'Th 6',
      type: 'service' as const,
      isRead: false
    },
    {
      id: '3',
      title: 'Công việc hoàn thành xong với EzyFix',
      message: 'Đơn #QU14392.',
      time: 'Th 5',
      type: 'service' as const,
      isRead: true
    },
    {
      id: '4',
      title: 'Công việc sắp diễn ra tại địa chỉ [123 Đường ABC] đã hoàn tất',
      message: 'Cảm ơn bạn đã tin tưởng EzyFix.',
      time: 'Th 5',
      type: 'system' as const,
      isRead: true
    },
    {
      id: '5',
      title: 'Sử dụng mã WATER10 - Ắp dụng cho mọi đơn hàng',
      message: 'Giảm tối đa 100,000đ',
      time: 'Th 4',
      type: 'promo' as const,
      isRead: true
    }
  ];

  // Sample messages data
  const messages = [
    {
      id: '1',
      technicianName: 'Kỹ Thuật Viên Lâm',
      lastMessage: 'Anh có thể cho chú em xin địa chỉ chính xác được không?',
      time: '7 giờ',
      isRead: false
    },
    {
      id: '2',
      technicianName: 'Kỹ Thuật Viên Thảo',
      lastMessage: 'Em có thể đặt lịch với bạn vào lúc 14:00 được không?',
      time: '7 giờ',
      isRead: false
    },
    {
      id: '3',
      technicianName: 'Kỹ Thuật Viên Nam',
      lastMessage: 'Dạ em đã đến gần địa chỉ. Em sẽ gọi cho chú sau.',
      time: '7 giờ',
      isRead: true
    },
    {
      id: '4',
      technicianName: 'Trung Tâm Hỗ Trợ',
      lastMessage: 'Lúc ấy thì một anh sẽ có mặt vào lúc 15:00 để sửa...',
      time: '7 giờ',
      isRead: true
    },
    {
      id: '5',
      technicianName: 'Kỹ Thuật Viên Long',
      lastMessage: 'Anh thông tin còn cần hay thêm để ạnh tìm hiểu...',
      time: '7 giờ',
      isRead: true
    },
    {
      id: '6',
      technicianName: 'Kỹ Thuật Viên Quân',
      lastMessage: 'Chó chị, em đi nhạp.',
      time: '7 giờ',
      isRead: true
    },
    {
      id: '7',
      technicianName: 'Kỹ Thuật Viên Thiên',
      lastMessage: 'Em đã đến AEON 3 từ 1 lúc rồi, anh có thể...',
      time: '7 giờ',
      isRead: true
    }
  ];

  const getUnreadCount = (type: TabType) => {
    if (type === 'notifications') {
      return notifications.filter(n => !n.isRead).length;
    }
    return messages.filter(m => !m.isRead).length;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {activeTab === 'notifications' ? 'Thông báo' : 'Tin nhắn'}
            </Text>
          </View>
        </LinearGradient>

        {/* Tab Navigation - 2 separate buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.leftButton,
              activeTab === 'notifications' && styles.activeTab
            ]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'notifications' && styles.activeTabText
            ]}>
              Thông báo
            </Text>
            {getUnreadCount('notifications') > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{getUnreadCount('notifications')}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              styles.rightButton,
              activeTab === 'messages' && styles.activeTab
            ]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'messages' && styles.activeTabText
            ]}>
              Tin nhắn
            </Text>
            {getUnreadCount('messages') > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{getUnreadCount('messages')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'notifications' ? (
            <View style={styles.notificationsContainer}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onPress={() => console.log('Notification pressed:', notification.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((message) => (
                <MessageItem
                  key={message.id}
                  {...message}
                  onPress={() => console.log('Message pressed:', message.id)}
                />
              ))}
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  leftButton: {
    marginRight: 6,
  },
  rightButton: {
    marginLeft: 6,
  },
  activeTab: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
    shadowColor: '#609CEF',
    shadowOpacity: 0.3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
  },
  notificationsContainer: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: '#FEFEFE',
    borderLeftWidth: 4,
    borderLeftColor: '#609CEF',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    alignSelf: 'center',
  },
  notificationContent: {
    flex: 1,
    paddingRight: 20,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '800',
    color: '#1F2937',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  messagesContainer: {
    paddingHorizontal: 16,
  },
  messageItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  avatarContainer: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
    paddingRight: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  technicianName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default withCustomerAuth(NotificationsPage, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});