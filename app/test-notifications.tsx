/**
 * Test Notifications Screen
 * Test push notifications and local notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '../hooks/useNotifications';

export default function TestNotifications() {
  const {
    expoPushToken,
    isInitialized,
    notifyNewQuote,
    notifyQuoteAccepted,
    notifyQuoteRejected,
    clearAllNotifications,
    getBadgeCount,
    setBadgeCount,
  } = useNotifications();

  const [badgeCount, setBadgeCountState] = useState(0);

  useEffect(() => {
    const loadBadgeCount = async () => {
      const count = await getBadgeCount();
      setBadgeCountState(count);
    };
    loadBadgeCount();
  }, []);

  const testNewQuoteNotification = async () => {
    await notifyNewQuote({
      type: 'new_quote',
      quoteId: 'test-quote-123',
      serviceRequestId: 'test-request-123',
      serviceName: 'Sửa máy lạnh',
      technicianName: 'Nguyễn Văn Thợ',
      amount: 500000,
      isEstimated: true,
      notes: 'Giá có thể thay đổi sau khi kiểm tra thiết bị',
    });

    Alert.alert('✅ Success', 'Notification sent! Check your notification tray.');
    
    const newCount = badgeCount + 1;
    await setBadgeCount(newCount);
    setBadgeCountState(newCount);
  };

  const testFinalQuoteNotification = async () => {
    await notifyNewQuote({
      type: 'new_quote',
      quoteId: 'test-quote-456',
      serviceRequestId: 'test-request-456',
      serviceName: 'Sửa tivi',
      technicianName: 'Trần Văn Thợ',
      amount: 750000,
      isEstimated: false,
    });

    Alert.alert('✅ Success', 'Final quote notification sent!');
    
    const newCount = badgeCount + 1;
    await setBadgeCount(newCount);
    setBadgeCountState(newCount);
  };

  const testQuoteAcceptedNotification = async () => {
    await notifyQuoteAccepted({
      type: 'quote_accepted',
      quoteId: 'test-quote-789',
      serviceRequestId: 'test-request-789',
      serviceName: 'Vệ sinh máy lạnh',
      customerName: 'Lê Văn Khách',
      amount: 300000,
      isEstimated: false,
    });

    Alert.alert('✅ Success', 'Quote accepted notification sent!');
    
    const newCount = badgeCount + 1;
    await setBadgeCount(newCount);
    setBadgeCountState(newCount);
  };

  const testQuoteRejectedNotification = async () => {
    await notifyQuoteRejected({
      type: 'quote_rejected',
      quoteId: 'test-quote-999',
      serviceRequestId: 'test-request-999',
      serviceName: 'Sửa máy giặt',
      customerName: 'Phạm Văn Khách',
      amount: 400000,
      isEstimated: true,
    });

    Alert.alert('✅ Success', 'Quote rejected notification sent!');
    
    const newCount = badgeCount + 1;
    await setBadgeCount(newCount);
    setBadgeCountState(newCount);
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    await setBadgeCount(0);
    setBadgeCountState(0);
    Alert.alert('✅ Cleared', 'All notifications cleared!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Notifications</Text>
          <View style={styles.backButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>🔔 Push Notification Tests</Text>
          <Text style={styles.description}>
            Test các loại thông báo với âm thanh và hiển thị badge
          </Text>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={isInitialized ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={isInitialized ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.statusLabel}>Notification Service:</Text>
              <Text style={[
                styles.statusValue,
                { color: isInitialized ? "#10B981" : "#EF4444" }
              ]}>
                {isInitialized ? 'Initialized' : 'Not Initialized'}
              </Text>
            </View>
            
            {expoPushToken && (
              <View style={styles.tokenContainer}>
                <Text style={styles.tokenLabel}>Push Token:</Text>
                <Text style={styles.tokenValue} numberOfLines={1}>
                  {expoPushToken.substring(0, 30)}...
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Ionicons name="notifications" size={24} color="#609CEF" />
              <Text style={styles.statusLabel}>Badge Count:</Text>
              <Text style={[styles.statusValue, { color: '#609CEF' }]}>
                {badgeCount}
              </Text>
            </View>
          </View>

          {/* Test Buttons */}
          <View style={styles.testSection}>
            <Text style={styles.sectionSubtitle}>Customer Notifications</Text>
            
            {/* New Quote - Estimated */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testNewQuoteNotification}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#609CEF', '#4F8BE8']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="calculator" size={20} color="#FFFFFF" />
                <View style={styles.testTextContainer}>
                  <Text style={styles.testButtonTitle}>New Quote - Estimated</Text>
                  <Text style={styles.testButtonSubtitle}>Báo giá dự kiến</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* New Quote - Final */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testFinalQuoteNotification}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <View style={styles.testTextContainer}>
                  <Text style={styles.testButtonTitle}>New Quote - Final</Text>
                  <Text style={styles.testButtonSubtitle}>Báo giá chốt</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.testSection}>
            <Text style={styles.sectionSubtitle}>Technician Notifications</Text>
            
            {/* Quote Accepted */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testQuoteAcceptedNotification}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="thumbs-up" size={20} color="#FFFFFF" />
                <View style={styles.testTextContainer}>
                  <Text style={styles.testButtonTitle}>Quote Accepted</Text>
                  <Text style={styles.testButtonSubtitle}>Khách chấp nhận báo giá</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Quote Rejected */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={testQuoteRejectedNotification}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="thumbs-down" size={20} color="#FFFFFF" />
                <View style={styles.testTextContainer}>
                  <Text style={styles.testButtonTitle}>Quote Rejected</Text>
                  <Text style={styles.testButtonSubtitle}>Khách từ chối báo giá</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Clear All Button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.clearButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#F59E0B" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Testing Notes</Text>
              <Text style={styles.infoText}>
                • Notifications must be tested on physical device{'\n'}
                • Ensure notification permissions are granted{'\n'}
                • Check notification tray after tapping test buttons{'\n'}
                • Tap on notification to test navigation{'\n'}
                • Listen for notification sound (if not on silent mode)
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  tokenContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#1E293B',
  },
  testSection: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  testButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  testGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  testTextContainer: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  testButtonSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  infoBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
});
