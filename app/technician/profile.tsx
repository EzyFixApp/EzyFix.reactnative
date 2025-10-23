import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { useAuthStore } from '~/store/authStore';

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

function TechnicianProfile() {
  const { logout } = useAuthStore();
  
  const handleBackPress = () => {
    router.back();
  };

  const handleLogout = async () => {
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
    console.log(`Pressed: ${item}`);
    // Navigate to specific screens based on item
    switch (item) {
      case 'profile':
        router.push('./personal-info' as any);
        break;
      case 'payment':
        // TODO: Navigate to payment methods
        break;
      case 'notifications':
        router.push('./notification-settings' as any);
        break;
      case 'add-certificate':
        // TODO: Navigate to add certificate page
        break;
      case 'support':
        // TODO: Navigate to customer support
        break;
      case 'rate-app':
        // TODO: Navigate to app store rating
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
              <Text style={styles.avatarText}>M</Text>
            </View>
            <Text style={styles.profileName}>Zun Zun</Text>
            <Text style={styles.profileSubtitle}>Thợ sửa chữa chuyên nghiệp</Text>
            
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>128</Text>
                <Text style={styles.statLabel}>Việc đã làm</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>năm kinh nghiệm</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {/* Wallet Section */}
          <View style={styles.walletSection}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet-outline" size={20} color="#609CEF" />
              <Text style={styles.walletTitle}>Ví EzyFix</Text>
            </View>
            
            <Text style={styles.walletAmount}>2.500.000 đ</Text>
            
            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.topUpButton}>
                <Text style={styles.topUpText}>Nạp tiền</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawText}>Rút tiền</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Access Menu */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
            
            <ProfileItem
              icon="person-outline"
              title="Hồ sơ"
              subtitle="Thông tin cá nhân"
              onPress={() => handleItemPress('profile')}
            />
            
            <ProfileItem
              icon="card-outline"
              title="Nạp/rút tiền"
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

          {/* Skills & Certificates Section */}
          <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleInHeader}>Kỹ năng & Chứng chỉ</Text>
              <TouchableOpacity onPress={() => handleItemPress('add-certificate')}>
                <Text style={styles.addCertificateLink}>thêm chứng chỉ</Text>
              </TouchableOpacity>
            </View>
            
            <ProfileItem
              icon="construct-outline"
              title="Kỹ năng chính"
              subtitle="Điện lạnh, sửa máy giặt, điều hòa"
              showArrow={false}
            />
            
            <ProfileItem
              icon="ribbon-outline"
              title="Chứng chỉ"
              subtitle="Kỹ thuật viên điện lạnh (2022)"
              showArrow={false}
              isLast={true}
            />
          </View>

          {/* Electronic Contract Section */}
          <View style={styles.contractSection}>
            <View style={styles.contractHeader}>
              <View style={styles.contractLeft}>
                <Text style={styles.contractTitle}>Hợp đồng lao động điện tử</Text>
                <Text style={styles.contractSubtitle}>Đã ký - Hiệu lực đến 31/12/2025</Text>
              </View>
            </View>
            
            <View style={styles.contractActions}>
              <TouchableOpacity style={styles.viewContractButton}>
                <Text style={styles.viewContractText}>Xem chi tiết</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.downloadButton}>
                <Text style={styles.downloadText}>Tải về PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Support & Upgrade Section */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Nâng cấp & Hỗ trợ</Text>
            
            <View style={styles.premiumItem}>
              <View style={styles.premiumItemLeft}>
                <Text style={styles.premiumItemTitle}>EzyFix Premium</Text>
                <Text style={styles.premiumItemSubtitle}>Nâng cấp để có nhiều tính năng hơn</Text>
              </View>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            </View>
            
            <ProfileItem
              icon="headset-outline"
              title="Hỗ trợ khách hàng"
              subtitle="Liên hệ với chúng tôi"
              onPress={() => handleItemPress('support')}
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
  walletSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  topUpButton: {
    flex: 1,
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  topUpText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#FFA500',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  sectionTitleInHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
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
  premiumSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  premiumLeft: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  premiumBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  
  // Skills & Certificates Section Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  addCertificateLink: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '500',
  },
  skillsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  skillsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  skillsText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  certificatesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  certificatesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  certificatesText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  
  // Electronic Contract Section Styles
  contractSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  contractHeader: {
    marginBottom: 16,
  },
  contractLeft: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '500',
  },
  contractActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewContractButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewContractText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  downloadText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Premium Item Styles (inside menu section)
  premiumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  premiumItemLeft: {
    flex: 1,
  },
  premiumItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  premiumItemSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 16,
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianProfile, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});