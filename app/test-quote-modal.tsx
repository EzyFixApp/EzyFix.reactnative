/**
 * Test screen for QuoteNotificationModal
 * This is for testing the modal UI and functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QuoteNotificationModal from '../components/QuoteNotificationModal';
import { router } from 'expo-router';

export default function TestQuoteModal() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Mock estimated quote
  const mockEstimatedQuote = {
    offerID: 'offer-estimated-123',
    serviceName: 'Sửa máy lạnh',
    technicianName: 'Nguyễn Văn Thợ',
    estimatedCost: 500000,
    notes: 'Giá chỉ mang tính chất tham khảo. Giá thực tế sẽ được xác định sau khi kiểm tra thiết bị và đánh giá mức độ hư hỏng. Có thể phát sinh thêm chi phí nếu cần thay linh kiện.',
    serviceRequestId: 'request-123',
  };

  // Mock final quote
  const mockFinalQuote = {
    offerID: 'offer-final-456',
    serviceName: 'Sửa tivi',
    technicianName: 'Trần Văn Thợ',
    finalCost: 750000,
    serviceRequestId: 'request-456',
  };

  // Mock estimated quote with short notes
  const mockEstimatedQuoteShort = {
    offerID: 'offer-estimated-789',
    serviceName: 'Vệ sinh máy lạnh',
    technicianName: 'Lê Văn Thợ',
    estimatedCost: 300000,
    notes: 'Giá có thể tăng nếu cần thay gas hoặc thay linh kiện.',
    serviceRequestId: 'request-789',
  };

  const showQuote = (quote: any) => {
    setSelectedQuote(quote);
    setModalVisible(true);
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
          <Text style={styles.headerTitle}>Test Quote Modal</Text>
          <View style={styles.backButton} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>📱 Quote Notification Modal Tests</Text>
          <Text style={styles.description}>
            Test các trường hợp hiển thị modal báo giá cho customer
          </Text>

          {/* Test Case 1 */}
          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              <View style={styles.testBadge}>
                <Text style={styles.testBadgeText}>Test 1</Text>
              </View>
              <Text style={styles.testTitle}>Estimated Quote - Long Notes</Text>
            </View>
            <Text style={styles.testDescription}>
              Báo giá dự kiến với ghi chú dài. Giá có thể thay đổi sau khi thợ kiểm tra.
            </Text>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Service:</Text>
              <Text style={styles.testDetailValue}>{mockEstimatedQuote.serviceName}</Text>
            </View>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Amount:</Text>
              <Text style={styles.testDetailValue}>
                {mockEstimatedQuote.estimatedCost?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => showQuote(mockEstimatedQuote)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#609CEF', '#4F8BE8']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Show Modal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Test Case 2 */}
          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              <View style={[styles.testBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.testBadgeText, { color: '#065F46' }]}>Test 2</Text>
              </View>
              <Text style={styles.testTitle}>Final Quote - No Notes</Text>
            </View>
            <Text style={styles.testDescription}>
              Báo giá chốt - giá cố định, không thay đổi. Customer có thể chấp nhận ngay.
            </Text>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Service:</Text>
              <Text style={styles.testDetailValue}>{mockFinalQuote.serviceName}</Text>
            </View>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Amount:</Text>
              <Text style={[styles.testDetailValue, { color: '#10B981' }]}>
                {mockFinalQuote.finalCost?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => showQuote(mockFinalQuote)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Show Modal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Test Case 3 */}
          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              <View style={[styles.testBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.testBadgeText, { color: '#92400E' }]}>Test 3</Text>
              </View>
              <Text style={styles.testTitle}>Estimated Quote - Short Notes</Text>
            </View>
            <Text style={styles.testDescription}>
              Báo giá dự kiến với ghi chú ngắn gọn.
            </Text>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Service:</Text>
              <Text style={styles.testDetailValue}>{mockEstimatedQuoteShort.serviceName}</Text>
            </View>
            <View style={styles.testDetails}>
              <Text style={styles.testDetailLabel}>Amount:</Text>
              <Text style={styles.testDetailValue}>
                {mockEstimatedQuoteShort.estimatedCost?.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => showQuote(mockEstimatedQuoteShort)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.testGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="calculator-outline" size={18} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Show Modal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Testing Instructions</Text>
              <Text style={styles.infoText}>
                1. Click "Show Modal" to test each scenario{'\n'}
                2. Try accepting and rejecting quotes{'\n'}
                3. Check if API calls work correctly{'\n'}
                4. Verify UI responsiveness
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Quote Notification Modal */}
        {selectedQuote && (
          <QuoteNotificationModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setSelectedQuote(null);
            }}
            quote={selectedQuote}
            onAccepted={() => {
              console.log('✅ Quote accepted:', selectedQuote.offerID);
            }}
            onRejected={() => {
              console.log('❌ Quote rejected:', selectedQuote.offerID);
            }}
          />
        )}
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
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  testBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  testBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  testDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  testDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testDetailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    width: 80,
  },
  testDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  testButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  testGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
