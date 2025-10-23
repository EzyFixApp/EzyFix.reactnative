import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { serviceRequestService } from '../../lib/api/serviceRequests';
// import withCustomerAuth from '../../lib/auth/withCustomerAuth'; // REMOVED - causes hooks mismatch

interface ProfileItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  isLogout?: boolean;
  isLast?: boolean;
}

function ProfileItem({ icon, title, subtitle, onPress, showArrow = true, isLogout = false, isLast = false }: ProfileItemProps) {
  if (isLogout) {
    return (
      <TouchableOpacity 
        style={styles.logoutItem} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutTitle}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        styles.profileItem,
        isLast && styles.lastItem
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={icon} 
            size={22} 
            color="#609CEF" 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.itemTitle}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {showArrow && (
        <Ionicons 
          name="chevron-forward" 
          size={18} 
          color="#64748b" 
        />
      )}
    </TouchableOpacity>
  );
}

function CustomerProfile() {
  const { user, isAuthenticated, logout } = useAuth();
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load user service requests count
  const loadOrderCount = async () => {
    if (!user || !isAuthenticated) return;
    
    try {
      setLoading(true);
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      setOrderCount(serviceRequests.length);
    } catch (error: any) {
      // Don't show error alert for order count as it's not critical
      setOrderCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (user && isAuthenticated) {
        loadOrderCount();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isAuthenticated])
  );

  // Get user display name
  const getDisplayName = () => {
    if (!user) return 'Người dùng';
    
    // Ưu tiên firstName + lastName nếu có
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    // Fallback về fullName từ API
    if (user.fullName && user.fullName.trim()) {
      return user.fullName.trim();
    }
    
    // Cuối cùng mới hiển thị email
    return user.email || 'Người dùng';
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Properly logout: Clear tokens, call API, clear storage
              await logout();
              
              // Navigate to home screen
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              // Still navigate even if logout fails
              router.replace('/');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleItemPress = (item: string) => {
    // Navigate to specific screens based on item
    switch (item) {
      case 'profile':
        router.push('./personal-info' as any);
        break;
      case 'favorites':
        router.push('./favorite-technicians' as any);
        break;
      case 'addresses':
        router.push('./saved-addresses' as any);
        break;
      case 'payment':
        router.push('./payment-methods' as any);
        break;
      case 'notifications':
        router.push('./notification-settings' as any);
        break;
      case 'promotions':
        router.push('./promotions' as any);
        break;
      case 'invite':
        // TODO: Navigate to invite friends page
        break;
      case 'customer-support':
        // TODO: Navigate to customer support
        break;
      case 'rate-app':
        // TODO: Open app store for rating
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
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
        
        {/* Profile Avatar & Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getDisplayName().charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{getDisplayName()}</Text>
          <Text style={styles.profileSubtitle}>Khách hàng thân thiết</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{loading ? '...' : orderCount}</Text>
              <Text style={styles.statLabel}>Đơn hàng</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100</Text>
              <Text style={styles.statLabel}>Điểm</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Thợ yêu thích</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {/* Service Cards Row */}
        <View style={styles.serviceCards}>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="document-text-outline" size={24} color="#609CEF" />
            <Text style={styles.serviceCardText}>Yêu cầu sửa chữa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="receipt-outline" size={24} color="#609CEF" />
            <Text style={styles.serviceCardText}>Lịch sử đơn hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Second Row Service Cards */}
        <View style={styles.serviceCards}>
          <TouchableOpacity style={styles.serviceCard}>
            <Ionicons name="construct-outline" size={24} color="#609CEF" />
            <Text style={styles.serviceCardText}>Đánh giá thợ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.serviceCard}
            onPress={() => handleItemPress('promotions')}
          >
            <Ionicons name="gift-outline" size={24} color="#609CEF" />
            <Text style={styles.serviceCardText}>Ưu đãi</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Menu Items - Section 1: Cài đặt tài khoản */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
          
          <ProfileItem
            icon="person-outline"
            title="Hồ sơ"
            subtitle="Thông tin cá nhân"
            onPress={() => handleItemPress('profile')}
          />
          
          <ProfileItem
            icon="heart-outline"
            title="Thợ yêu thích"
            subtitle="Danh sách thợ được lưu"
            onPress={() => handleItemPress('favorites')}
          />
          
          <ProfileItem
            icon="location-outline"
            title="Địa chỉ đã lưu"
            subtitle="Quản lý các địa chỉ"
            onPress={() => handleItemPress('addresses')}
          />
          
          <ProfileItem
            icon="card-outline"
            title="Phương thức thanh toán"
            subtitle="Thẻ và ví điện tử"
            onPress={() => handleItemPress('payment')}
          />
          
          <ProfileItem
            icon="notifications-outline"
            title="Thông báo"
            subtitle="Cài đặt thông báo"
            onPress={() => handleItemPress('notifications')}
            isLast={true}
          />
        </View>

        {/* Profile Menu Items - Section 2: Nâng cấp & Hỗ trợ */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Nâng cấp & Hỗ trợ</Text>
          
          <ProfileItem
            icon="people-outline"
            title="Mời bạn bè"
            subtitle="Nhận 50.000đ cho mỗi lời mời"
            onPress={() => handleItemPress('invite')}
          />
          
          <ProfileItem
            icon="help-circle-outline"
            title="Hỗ trợ khách hàng"
            subtitle="Liên hệ với chúng tôi"
            onPress={() => handleItemPress('customer-support')}
          />
          
          <ProfileItem
            icon="star-outline"
            title="Đánh giá ứng dụng"
            subtitle="Chia sẻ trải nghiệm của bạn"
            onPress={() => handleItemPress('rate-app')}
            isLast={true}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <ProfileItem
            icon="log-out-outline"
            title="Đăng xuất"
            onPress={() => handleItemPress('logout')}
            showArrow={false}
            isLogout={true}
          />
        </View>
        
        {/* Bottom Spacing */}
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
  profileSection: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#609CEF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#609CEF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 16,
  },
  serviceCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  menuSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 16,
  },
  logoutSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutItem: {
    backgroundColor: '#FF4757',
    borderRadius: 16,
    shadowColor: '#FF4757',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 80,
  },
});

// Export directly without HOC - HOC causes hooks mismatch during unmount
// Auth check is handled internally via useEffect
export default CustomerProfile;