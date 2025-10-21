import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface PaymentMethodProps {
  id: string;
  name: string;
  type: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isDefault?: boolean;
  isConnected: boolean;
  details?: string;
  onToggle: (id: string) => void;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}

function PaymentMethodCard({ id, name, type, icon, color, isDefault, isConnected, details, onToggle, onSetDefault, onRemove }: PaymentMethodProps) {
  return (
    <View style={styles.paymentCard}>
      <View style={styles.cardContent}>
        <View style={styles.methodInfo}>
          <View style={[styles.methodIcon, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View style={styles.methodDetails}>
            <Text style={styles.methodName}>{name}</Text>
            <Text style={styles.methodType}>{type}</Text>
            {details && <Text style={styles.methodDetailsText}>{details}</Text>}
          </View>
        </View>
        
        {isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>MẶC ĐỊNH</Text>
          </View>
        )}
      </View>
      
      {isConnected && !isDefault && (
        <View style={styles.cardActions}>
          <TouchableOpacity 
            onPress={() => onSetDefault(id)}
            style={styles.setDefaultButton}
          >
            <Text style={styles.setDefaultText}>Đặt làm mặc định</Text>
          </TouchableOpacity>
        </View>
      )}
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

function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      name: 'Ví MoMo',
      type: '*** 1000',
      icon: 'wallet' as keyof typeof Ionicons.glyphMap,
      color: '#D82D8B',
      isDefault: true,
      isConnected: true,
    }
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      "Thêm phương thức thanh toán",
      "Chọn loại phương thức thanh toán mới",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Ví điện tử", onPress: () => console.log("Add e-wallet") },
        { text: "Thẻ ngân hàng", onPress: () => console.log("Add bank card") }
      ]
    );
  };

  const handleToggleMethod = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, isConnected: !method.isConnected }
          : method
      )
    );
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleRemoveMethod = (id: string) => {
    Alert.alert(
      "Xóa phương thức thanh toán",
      "Bạn có chắc chắn muốn xóa phương thức này?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", style: "destructive", onPress: () => {
          setPaymentMethods(prev => prev.filter(method => method.id !== id));
        }}
      ]
    );
  };

  const connectedMethods = paymentMethods.filter(method => method.isConnected).length;
  const defaultMethods = paymentMethods.filter(method => method.isDefault).length;

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
            <Text style={styles.headerTitle}>Phương thức thanh toán</Text>
            <Text style={styles.headerSubtitle}>Quản lý cách thức thanh toán của bạn</Text>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <StatCard number={connectedMethods.toString()} label="PHƯƠNG THỨC" />
              <StatCard number={defaultMethods.toString()} label="MẶC ĐỊNH" />
              <StatCard number="0" label="KẾT NỐI" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Current Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phương thức hiện tại</Text>
            
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                {...method}
                onToggle={handleToggleMethod}
                onSetDefault={handleSetDefault}
                onRemove={handleRemoveMethod}
              />
            ))}
          </View>

          {/* Add New Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Thêm phương thức thanh toán</Text>
            
            <TouchableOpacity 
              onPress={handleAddPaymentMethod}
              style={styles.addMethodButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#609CEF" />
              <Text style={styles.addMethodText}>Thêm phương thức thanh toán</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
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
    textAlign: 'center',
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
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  methodType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  methodDetailsText: {
    fontSize: 12,
    color: '#9CA3AF',
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
  cardActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#609CEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#609CEF',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 12,
  },
  quickActions: {
    paddingHorizontal: 16,
  },
  quickActionButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
});

export default withCustomerAuth(PaymentMethods, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});