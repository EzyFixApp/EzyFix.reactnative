import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

interface AddressItemProps {
  id: string;
  type: string;
  name: string;
  address: string;
  phone: string;
  details: string;
  isDefault?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

function AddressCard({ id, type, name, address, phone, details, isDefault, onEdit, onDelete, onSetDefault }: AddressItemProps) {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'nhà riêng':
        return '#10B981';
      case 'văn phòng':
        return '#609CEF';
      case 'khác':
        return '#6B7280';
      default:
        return '#609CEF';
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xóa địa chỉ",
      "Bạn có chắc chắn muốn xóa địa chỉ này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => onDelete(id) }
      ]
    );
  };

  return (
    <View style={styles.addressCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.addressType}>{type}</Text>
        {isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>MẶC ĐỊNH</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressText}>{address}</Text>
      <Text style={styles.phoneText}>SĐT: {phone}</Text>
      <Text style={styles.detailsText}>Ghi chú: {details}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          onPress={() => onEdit(id)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Chỉnh sửa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleDelete}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>Xóa</Text>
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
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      type: 'Nhà riêng',
      name: 'Nhà riêng',
      address: '123 Nguyễn Lê Lợi, Phường Tân Nghĩa, Quận 1, TPHCM',
      phone: '0901234567',
      details: 'Ghi chú: Cửa hàng xanh, có bảng tên trước cửa',
      isDefault: true
    }
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleAddAddress = () => {
    router.push('./add-address' as any);
  };

  const handleEditAddress = (id: string) => {
    router.push(`./add-address?id=${id}` as any);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => 
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }))
    );
  };

  const totalAddresses = addresses.length;
  const defaultAddresses = addresses.filter(addr => addr.isDefault).length;

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
              <StatCard number={defaultAddresses.toString()} label="MẶC ĐỊNH" />
              <StatCard number="0" label="CỦA QUAN" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
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
            
            {addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
                <Text style={styles.emptySubtitle}>
                  Thêm địa chỉ để dễ dàng đặt dịch vụ
                </Text>
              </View>
            ) : (
              addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  {...address}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefault}
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
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
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
});