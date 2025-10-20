import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { addressService } from '../../lib/api';
import { useAuth } from '../../store/authStore';
import type { Address } from '../../types/api';

interface AddressItemProps {
  addressId: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  index: number; // Add index for numbering
}

function AddressCard({ 
  addressId, 
  street, 
  city, 
  province, 
  postalCode, 
  latitude, 
  longitude, 
  onDelete,
  isDeleting = false,
  index
}: AddressItemProps) {
  const handleDelete = () => {
    Alert.alert(
      "Xóa địa chỉ",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => onDelete(addressId) }
      ]
    );
  };

  // Format address display - avoid duplication
  const displayAddress = street.includes(city) 
    ? street  // If street already contains full address, use as is
    : `${street}, ${city}, ${province} ${postalCode}`; // Otherwise build full address

  return (
    <View style={styles.addressCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.addressType}>Địa chỉ {index + 1}</Text>
      </View>

      <Text style={styles.addressText}>{displayAddress}</Text>
      {(latitude && longitude) && (
        <Text style={styles.coordinatesText}>
          Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={handleDelete}
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#F44336" />
          ) : (
            <Text style={styles.deleteButtonText}>Xóa</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function SavedAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Get auth state
  const { isAuthenticated, user } = useAuth();

  // Load addresses when component mounts or when focus returns
  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        Alert.alert(
          'Chưa đăng nhập',
          'Vui lòng đăng nhập để xem danh sách địa chỉ.',
          [
            { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login' as any) },
            { text: 'Hủy', onPress: () => router.back() }
          ]
        );
        return;
      }
      
      loadAddresses();
    }, [isAuthenticated, user])
  );

  const loadAddresses = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const allAddresses = await addressService.getAllAddresses();
      
      // Filter addresses by current user
      const userAddresses = allAddresses.filter(addr => addr.userId === user?.id);
      setAddresses(userAddresses);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadAddresses(true);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleAddAddress = () => {
    router.push('./add-address' as any);
  };

  const handleDeleteAddress = async (addressId: string) => {
    // Store original addresses for potential revert
    const originalAddresses = addresses;
    
    try {
      // Add to deleting set for loading state
      setDeletingIds(prev => new Set([...prev, addressId]));
      
      // Optimistic update - remove from UI immediately
      setAddresses(prev => prev.filter(addr => addr.addressId !== addressId));

      // Call API
      const response = await addressService.deleteAddress(addressId);
      
      if (response.success || response.message?.includes('successfully')) {
        // Success - keep the optimistic update
        Alert.alert('Thành công', 'Địa chỉ đã được xóa');
      } else {
        // API failed but no error thrown - revert optimistic update
        setAddresses(originalAddresses);
        Alert.alert('Lỗi', response.message || 'Không thể xóa địa chỉ');
      }
    } catch (error: any) {
      // Network/API error - revert optimistic update
      setAddresses(originalAddresses);
      Alert.alert('Lỗi', error.message || 'Không thể xóa địa chỉ');
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(addressId);
        return newSet;
      });
    }
  };

  const totalAddresses = useMemo(() => {
    return addresses.length;
  }, [addresses]);

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
            <Text style={styles.headerTitle}>Địa chỉ đã lưu</Text>
            <Text style={styles.headerSubtitle}>Quản lý địa chỉ của bạn</Text>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <StatCard number={totalAddresses.toString()} label="TỔNG ĐỊA CHỈ" />
              <StatCard number="0" label="KHÁC" />
              <StatCard number="0" label="ĐÃ DÙNG" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView 
          style={styles.contentContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#609CEF']}
              tintColor="#609CEF"
            />
          }
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              onPress={handleAddAddress}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          </View>

          {/* Addresses List */}
          <View style={styles.addressesSection}>
            <Text style={styles.sectionTitle}>Danh sách địa chỉ</Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#609CEF" />
                <Text style={styles.loadingText}>Đang tải danh sách địa chỉ...</Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
                <Text style={styles.emptySubtitle}>
                  Thêm địa chỉ để dễ dàng đặt dịch vụ
                </Text>
              </View>
            ) : (
              addresses.map((address, index) => (
                <AddressCard
                  key={address.addressId}
                  addressId={address.addressId}
                  street={address.street}
                  city={address.city}
                  province={address.province}
                  postalCode={address.postalCode}
                  latitude={address.latitude}
                  longitude={address.longitude}
                  onDelete={handleDeleteAddress}
                  isDeleting={deletingIds.has(address.addressId)}
                  index={index}
                />
              ))
            )}
          </View>
          
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
    paddingBottom: 24,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  addressesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  coordinatesText: {
    fontSize: 13,
    color: '#8B5CF6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
});