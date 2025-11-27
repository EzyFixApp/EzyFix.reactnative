import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { useAuthStore } from '~/store/authStore';
import CustomModal from '../../components/CustomModal';
import { techniciansService } from '../../lib/api/technicians';
import { walletService } from '../../lib/api/wallet';
import type { TechnicianProfile } from '../../types/api';
import type { WalletSummary } from '../../lib/api/wallet';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
  const { logout, user } = useAuthStore();
  
  // Profile data state
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // Wallet state
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [showCancelButton, setShowCancelButton] = useState(false);
  
  // Contract modal state
  const [showContractModal, setShowContractModal] = useState(false);
  
  // PDF download state
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  
  // Load technician profile on mount
  useEffect(() => {
    loadTechnicianProfile();
    loadWalletSummary();
  }, [user?.id]);
  
  const loadTechnicianProfile = async () => {
    try {
      if (!user?.id) {
        if (__DEV__) console.warn('⚠️ No user ID available for profile fetch');
        return;
      }

      setLoadingProfile(true);
      const profile = await techniciansService.getTechnicianProfile(user.id);
      setTechnicianProfile(profile);
      
      if (__DEV__) {
        console.log('✅ Profile loaded in profile page:', {
          name: `${profile.firstName} ${profile.lastName}`,
          rating: profile.averageRating,
          totalReviews: profile.totalReviews,
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load profile:', error);
      showAlertModal(
        'error',
        'Lỗi tải dữ liệu',
        'Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.'
      );
    } finally {
      setLoadingProfile(false);
    }
  };
  
  const loadWalletSummary = async () => {
    try {
      setLoadingWallet(true);
      const summary = await walletService.getWalletSummary();
      setWalletSummary(summary);
      
      if (__DEV__) {
        console.log('✅ Wallet summary loaded:', {
          balance: summary.balance,
          available: summary.availableBalance,
          hold: summary.holdAmount,
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load wallet:', error);
      // Don't show error modal, just log it
    } finally {
      setLoadingWallet(false);
    }
  };
  
  // Helper function to get avatar initial
  const getAvatarInitial = () => {
    if (technicianProfile) {
      return technicianProfile.firstName?.charAt(0)?.toUpperCase() || 'T';
    }
    return user?.fullName?.charAt(0)?.toUpperCase() || 'T';
  };
  
  // Helper function to get full name
  const getFullName = () => {
    if (technicianProfile) {
      return `${technicianProfile.firstName} ${technicianProfile.lastName}`;
    }
    return user?.fullName || 'Thợ sửa chữa';
  };
  
  // Format money helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  // Helper function to show modal
  const showAlertModal = (
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: string,
    message: string,
    onConfirm?: () => void,
    showCancel = false
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOnConfirm(() => onConfirm);
    setShowCancelButton(showCancel);
    setShowModal(true);
  };
  
  const handleBackPress = () => {
    router.back();
  };

  const handleLogout = async () => {
    showAlertModal(
      'confirm',
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      async () => {
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
      },
      true
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

  const handleViewContract = () => {
    setShowContractModal(true);
  };

  const generateContractHTML = () => {
    if (!technicianProfile) return '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hợp Đồng Lao Động Điện Tử - EzyFix</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #609CEF;
      padding-bottom: 20px;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #609CEF;
      font-size: 24px;
      margin: 10px 0;
    }
    .header h2 {
      color: #666;
      font-size: 18px;
      font-weight: normal;
      margin: 5px 0;
    }
    .section {
      margin: 25px 0;
    }
    .section-title {
      background: #609CEF;
      color: white;
      padding: 10px 15px;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .info-table td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    .info-table td:first-child {
      background: #f8f9fa;
      font-weight: bold;
      width: 35%;
    }
    .terms-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
    }
    .terms-title {
      color: #78350f;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .terms-text {
      color: #78716c;
      font-size: 13px;
      line-height: 1.8;
    }
    .accept-box {
      background: #dcfce7;
      border-left: 4px solid #16a34a;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .accept-text {
      color: #166534;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      background: ${technicianProfile.availabilityStatus === 'AVAILABLE' ? '#dcfce7' : '#fee2e2'};
      color: ${technicianProfile.availabilityStatus === 'AVAILABLE' ? '#16a34a' : '#dc2626'};
      padding: 5px 12px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://res.cloudinary.com/ezyfix/image/upload/v1763672087/ezyfix_evzx5j.jpg" alt="EzyFix Logo" class="logo" />
    <h1>HỢP ĐỒNG LAO ĐỘNG ĐIỆN TỬ</h1>
    <h2>EZYFIX TECHNICIAN AGREEMENT</h2>
    <p style="color: #666; margin-top: 15px;">Số hợp đồng: EZYFIX-${technicianProfile.id}</p>
  </div>

  <div class="section">
    <div class="section-title">THÔNG TIN THỢ SỬA CHỮA</div>
    <table class="info-table">
      <tr>
        <td>Họ và tên:</td>
        <td>${technicianProfile.firstName} ${technicianProfile.lastName}</td>
      </tr>
      <tr>
        <td>Số điện thoại:</td>
        <td>${technicianProfile.phone}</td>
      </tr>
      <tr>
        <td>Email:</td>
        <td>${technicianProfile.email}</td>
      </tr>
      <tr>
        <td>Chứng chỉ:</td>
        <td>${technicianProfile.certification || 'Chưa cập nhật'}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">ĐIỀU KHOẢN HỢP ĐỒNG</div>
    <table class="info-table">
      <tr>
        <td>Kinh nghiệm:</td>
        <td>${technicianProfile.yearsOfExperience} năm</td>
      </tr>
      <tr>
        <td>Giá mỗi giờ:</td>
        <td>${technicianProfile.hourlyRate.toLocaleString('vi-VN')} VND</td>
      </tr>
      <tr>
        <td>Đánh giá trung bình:</td>
        <td>⭐ ${technicianProfile.averageRating.toFixed(1)} (${technicianProfile.totalReviews} đánh giá)</td>
      </tr>
      <tr>
        <td>Trạng thái:</td>
        <td><span class="status-badge">${technicianProfile.availabilityStatus === 'AVAILABLE' ? 'Sẵn sàng nhận việc' : technicianProfile.availabilityStatus === 'BUSY' ? 'Đang bận' : 'Offline'}</span></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">THỜI HẠN HỢP ĐỒNG</div>
    <table class="info-table">
      <tr>
        <td>Ngày ký:</td>
        <td>01/01/2024</td>
      </tr>
      <tr>
        <td>Ngày hiệu lực:</td>
        <td>01/01/2024</td>
      </tr>
      <tr>
        <td>Ngày hết hạn:</td>
        <td>31/12/2025</td>
      </tr>
      <tr>
        <td>Trạng thái hợp đồng:</td>
        <td><span class="status-badge">✓ Đang hiệu lực</span></td>
      </tr>
    </table>
  </div>

  ${technicianProfile.skills && technicianProfile.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">KỸ NĂNG CHUYÊN MÔN</div>
    <p style="padding: 10px;">${technicianProfile.skills.join(', ')}</p>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">ĐIỀU KHOẢN & ĐIỀU KIỆN HỢP ĐỒNG</div>
    
    <div class="terms-box">
      <div class="terms-title">I. QUYỀN VÀ NGHĨA VỤ CỦA THỢ SỬA CHỮA</div>
      <div class="terms-text">
        1. Cam kết cung cấp dịch vụ chất lượng cao, đúng chuyên môn cho khách hàng<br>
        2. Tuân thủ nghiêm ngặt quy định và tiêu chuẩn an toàn lao động của EzyFix<br>
        3. Bảo mật tuyệt đối thông tin cá nhân khách hàng và dữ liệu công việc<br>
        4. Giữ thái độ chuyên nghiệp, lịch sự trong mọi tình huống giao tiếp<br>
        5. Thông báo trước tối thiểu 24h khi thay đổi lịch làm việc hoặc trạng thái<br>
        6. Hoàn thành công việc đúng thời gian đã cam kết với khách hàng<br>
        7. Sử dụng thiết bị, dụng cụ đảm bảo chất lượng và an toàn
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">II. CHÍNH SÁCH THANH TOÁN & PHÍ DỊCH VỤ</div>
      <div class="terms-text">
        1. Mức giá được niêm yết rõ ràng trên hệ thống (giá/giờ hoặc theo gói)<br>
        2. EzyFix thu phí hoa hồng 15% trên mỗi đơn hàng hoàn thành<br>
        3. Thanh toán được thực hiện trong vòng 7-10 ngày làm việc sau khi hoàn tất<br>
        4. Thợ có trách nhiệm xuất hóa đơn VAT theo quy định pháp luật<br>
        5. Mọi tranh chấp về thanh toán sẽ được giải quyết qua bộ phận hỗ trợ
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">III. CHÍNH SÁCH HỦY ĐƠN & HOÀN TIỀN</div>
      <div class="terms-text">
        1. Không được tự ý hủy đơn sau khi đã xác nhận nhận việc<br>
        2. Trường hợp hủy đơn vì lý do chính đáng phải thông báo trước 12h<br>
        3. Vi phạm hủy đơn quá 3 lần/tháng sẽ bị khóa tài khoản tạm thời<br>
        4. Khách hàng có quyền yêu cầu hoàn tiền nếu dịch vụ không đạt chất lượng<br>
        5. Thợ chịu trách nhiệm bồi thường thiệt hại do lỗi nghề nghiệp gây ra
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">IV. ĐÁNH GIÁ & XẾP HẠNG</div>
      <div class="terms-text">
        1. Khách hàng có quyền đánh giá chất lượng dịch vụ sau khi hoàn thành<br>
        2. Đánh giá dưới 3.0 sao liên tục sẽ ảnh hưởng đến ưu tiên nhận việc<br>
        3. Thợ có thể phản hồi đánh giá trong vòng 48h nếu có vấn đề<br>
        4. Hệ thống sẽ xem xét khiếu nại nếu đánh giá không công bằng<br>
        5. Duy trì rating cao sẽ được ưu tiên hiển thị và nhận thêm đơn
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">V. BẢO MẬT & BẢO MẬT DỮ LIỆU</div>
      <div class="terms-text">
        1. Không được sao chép, lưu trữ hoặc chia sẻ thông tin khách hàng<br>
        2. Không liên hệ khách hàng ngoài nền tảng EzyFix để giao dịch riêng<br>
        3. Vi phạm chính sách bảo mật sẽ bị chấm dứt hợp đồng ngay lập tức<br>
        4. Mọi dữ liệu trên hệ thống thuộc quyền sở hữu của EzyFix<br>
        5. Thợ chịu trách nhiệm pháp lý nếu làm lộ thông tin nhạy cảm
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">VI. CHẤM DỨT HỢP ĐỒNG</div>
      <div class="terms-text">
        1. Cả hai bên có quyền chấm dứt hợp đồng với thông báo trước 30 ngày<br>
        2. EzyFix có quyền chấm dứt ngay lập tức nếu phát hiện vi phạm nghiêm trọng<br>
        3. Các khoản thanh toán đang chờ sẽ được xử lý trong vòng 14 ngày<br>
        4. Sau khi chấm dứt, tài khoản sẽ bị vô hiệu hóa vĩnh viễn<br>
        5. Thợ có thể đăng ký lại sau 6 tháng kể từ ngày chấm dứt hợp đồng
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">VII. GIẢI QUYẾT TRANH CHẤP</div>
      <div class="terms-text">
        1. Mọi tranh chấp ưu tiên giải quyết thông qua hòa giải nội bộ<br>
        2. Nếu không thỏa thuận được, sẽ đưa ra Trọng tài Thương mại Việt Nam<br>
        3. Chi phí trọng tài sẽ do bên thua kiện chịu hoàn toàn<br>
        4. Luật áp dụng là Luật Dân sự và Luật Thương mại Việt Nam<br>
        5. Địa điểm giải quyết tranh chấp tại Thành phố Hồ Chí Minh
      </div>
    </div>

    <div class="accept-box">
      <div class="accept-text">
        ✓ Bằng việc ký hợp đồng điện tử này, tôi xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản nêu trên.
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>CÔNG TY TNHH EZYFIX</strong></p>
    <p>Địa chỉ: Thành phố Hồ Chí Minh, Việt Nam</p>
    <p>Email: support@ezyfix.vn | Hotline: 1900-xxxx</p>
    <p style="margin-top: 15px; font-style: italic;">Tài liệu này được tạo tự động từ hệ thống EzyFix</p>
    <p>Ngày xuất: ${new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${new Date().toLocaleTimeString('vi-VN')}</p>
  </div>
</body>
</html>
    `;
  };

  const handleDownloadContract = async () => {
    if (!technicianProfile) {
      showAlertModal('error', 'Lỗi', 'Không tìm thấy thông tin hợp đồng', undefined, false);
      return;
    }

    try {
      setDownloadingPDF(true);
      
      // Generate HTML content
      const htmlContent = generateContractHTML();
      
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share with a descriptive title that appears in share dialog
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Hợp đồng EzyFix - ${technicianProfile.firstName} ${technicianProfile.lastName}`,
          UTI: 'com.adobe.pdf',
        });
        
        showAlertModal(
          'success',
          'Thành công',
          'File PDF đã được tạo thành công. Bạn có thể mở, in hoặc chia sẻ file này.',
          undefined,
          false
        );
      } else {
        showAlertModal(
          'info',
          'Thông báo',
          'File PDF đã được tạo nhưng không thể chia sẻ trên thiết bị này.',
          undefined,
          false
        );
      }
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      showAlertModal(
        'error',
        'Lỗi',
        `Không thể tạo PDF: ${error.message}`,
        undefined,
        false
      );
    } finally {
      setDownloadingPDF(false);
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
            {loadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (
              <>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
                </View>
                <Text style={styles.profileName}>{getFullName()}</Text>
                <Text style={styles.profileSubtitle}>
                  {technicianProfile?.certification || 'Thợ sửa chữa chuyên nghiệp'}
                </Text>
                
                {/* Stats Row - Data from API */}
                {technicianProfile && (
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{technicianProfile.totalReviews}</Text>
                      <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{technicianProfile.averageRating.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Xếp hạng</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{technicianProfile.yearsOfExperience}</Text>
                      <Text style={styles.statLabel}>Năm KN</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {/* Wallet Section - EzyPay */}
          <View style={styles.walletSection}>
            <View style={styles.walletHeader}>
              <Ionicons name="wallet-outline" size={20} color="#609CEF" />
              <Text style={styles.walletTitle}>Ví EzyPay</Text>
            </View>
            
            {loadingWallet ? (
              <View style={styles.walletLoadingContainer}>
                <ActivityIndicator size="small" color="#609CEF" />
              </View>
            ) : walletSummary ? (
              <>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceLeft}>
                    <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                    <Text style={styles.walletAmount}>
                      {balanceVisible 
                        ? formatMoney(walletSummary.availableBalance)
                        : '••••••••'
                      }
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setBalanceVisible(!balanceVisible)}
                    style={styles.eyeButton}
                  >
                    <Ionicons 
                      name={balanceVisible ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color="#609CEF" 
                    />
                  </TouchableOpacity>
                </View>
                
                {walletSummary.holdAmount > 0 && (
                  <View style={styles.holdAmountInfo}>
                    <Ionicons name="lock-closed-outline" size={16} color="#F59E0B" />
                    <Text style={styles.holdAmountText}>
                      Đang giữ: {formatMoney(walletSummary.holdAmount)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={styles.walletActionButton}
                    onPress={() => router.push('/technician/wallet-history')}
                  >
                    <Ionicons name="time-outline" size={20} color="#609CEF" />
                    <Text style={styles.walletActionText}>Lịch sử ví</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.withdrawButton}
                    onPress={() => router.push('/technician/withdraw')}
                  >
                    <Ionicons name="cash-outline" size={20} color="white" />
                    <Text style={styles.withdrawText}>Rút tiền</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.walletAmount}>--</Text>
            )}
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
                <Text style={styles.addCertificateLink}>chỉnh sửa</Text>
              </TouchableOpacity>
            </View>
            
            {loadingProfile ? (
              <View style={styles.sectionLoadingContainer}>
                <ActivityIndicator size="small" color="#609CEF" />
              </View>
            ) : technicianProfile ? (
              <>
                {/* Certification */}
                {technicianProfile.certification && (
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="ribbon-outline" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Chứng chỉ</Text>
                      <Text style={styles.infoValue}>{technicianProfile.certification}</Text>
                    </View>
                  </View>
                )}
                
                {/* Skills */}
                {technicianProfile.skills && technicianProfile.skills.length > 0 ? (
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="construct-outline" size={20} color="#609CEF" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Kỹ năng</Text>
                      <Text style={styles.infoValue}>{technicianProfile.skills.join(', ')}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySkillsContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                    <Text style={styles.emptySkillsText}>Chưa có kỹ năng nào</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptySkillsContainer}>
                <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
                <Text style={styles.emptySkillsText}>Không thể tải dữ liệu</Text>
              </View>
            )}
          </View>

          {/* Electronic Contract Section */}
          <View style={styles.contractSection}>
            <View style={styles.contractHeaderRow}>
              <Ionicons name="document-text" size={24} color="#609CEF" />
              <Text style={styles.contractTitle}>Hợp đồng lao động điện tử</Text>
            </View>
            
            <Text style={styles.contractDescription}>
              Hợp đồng cộng tác viên giữa EzyFix và thợ sửa chữa. Nhấn để xem chi tiết hoặc tải về.
            </Text>
            
            {loadingProfile ? (
              <View style={styles.loadingContractContainer}>
                <ActivityIndicator size="small" color="#609CEF" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : technicianProfile ? (
              <View style={styles.contractActions}>
                <TouchableOpacity 
                  style={styles.viewContractButton}
                  onPress={handleViewContract}
                >
                  <Ionicons name="eye-outline" size={20} color="white" />
                  <Text style={styles.viewContractText}>Xem chi tiết</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.downloadButton, downloadingPDF && styles.downloadButtonDisabled]}
                  onPress={handleDownloadContract}
                  disabled={downloadingPDF}
                >
                  {downloadingPDF ? (
                    <ActivityIndicator size="small" color="#609CEF" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color="#609CEF" />
                  )}
                  <Text style={styles.downloadText}>
                    {downloadingPDF ? 'Đang tạo...' : 'Tải PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContractContainer}>
                <Text style={styles.emptyText}>Không thể tải thông tin hợp đồng</Text>
              </View>
            )}
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

        {/* Custom Modal */}
        <CustomModal
          visible={showModal}
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setShowModal(false)}
          onConfirm={modalOnConfirm}
          showCancel={showCancelButton}
          confirmText="OK"
          cancelText="Hủy"
        />
        
        {/* Contract Detail Modal */}
        <Modal
          visible={showContractModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowContractModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.contractModalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Chi tiết hợp đồng</Text>
                <TouchableOpacity 
                  onPress={() => setShowContractModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              {/* Modal Content */}
              <ScrollView style={styles.modalContent}>
                {technicianProfile && (
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>HỢP ĐỒNG LAO ĐỘNG ĐIỆN TỬ</Text>
                      <Text style={styles.modalSectionSubtitle}>EZYFIX TECHNICIAN AGREEMENT</Text>
                    </View>
                    
                    <View style={styles.modalDivider} />
                    
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>THÔNG TIN THỢ SỬACHỮA</Text>
                      <View style={styles.modalInfoBox}>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Họ và tên:</Text>
                          <Text style={styles.modalInfoValue}>
                            {technicianProfile.firstName} {technicianProfile.lastName}
                          </Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Số điện thoại:</Text>
                          <Text style={styles.modalInfoValue}>{technicianProfile.phone}</Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Email:</Text>
                          <Text style={styles.modalInfoValue}>{technicianProfile.email}</Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Chứng chỉ:</Text>
                          <Text style={styles.modalInfoValue}>
                            {technicianProfile.certification || 'Chưa cập nhật'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>ĐIỀU KHOẢN HỢP ĐỒNG</Text>
                      <View style={styles.modalInfoBox}>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Kinh nghiệm:</Text>
                          <Text style={styles.modalInfoValue}>
                            {technicianProfile.yearsOfExperience} năm
                          </Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Giá mỗi giờ:</Text>
                          <Text style={styles.modalInfoValue}>
                            {technicianProfile.hourlyRate.toLocaleString('vi-VN')} VND
                          </Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Đánh giá trung bình:</Text>
                          <Text style={styles.modalInfoValue}>
                            ⭐ {technicianProfile.averageRating.toFixed(1)} ({technicianProfile.totalReviews} đánh giá)
                          </Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Trạng thái:</Text>
                          <View style={styles.modalStatusBadge}>
                            <View style={[
                              styles.modalStatusDot,
                              technicianProfile.availabilityStatus === 'AVAILABLE' && styles.modalStatusDotActive
                            ]} />
                            <Text style={styles.modalStatusText}>
                              {technicianProfile.availabilityStatus === 'AVAILABLE' ? 'Sẵn sàng nhận việc' :
                               technicianProfile.availabilityStatus === 'BUSY' ? 'Đang bận' : 'Offline'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>THỜI HẠN HỢP ĐỒNG</Text>
                      <View style={styles.modalInfoBox}>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Ngày ký:</Text>
                          <Text style={styles.modalInfoValue}>01/01/2024</Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Ngày hiệu lực:</Text>
                          <Text style={styles.modalInfoValue}>01/01/2024</Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Ngày hết hạn:</Text>
                          <Text style={styles.modalInfoValue}>31/12/2025</Text>
                        </View>
                        <View style={styles.modalInfoRow}>
                          <Text style={styles.modalInfoLabel}>Trạng thái hợp đồng:</Text>
                          <View style={styles.contractActiveBadge}>
                            <Text style={styles.contractActiveText}>✓ Đang hiệu lực</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {technicianProfile.skills && technicianProfile.skills.length > 0 && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>KỸ NĂNG CHUYÊN MÔN</Text>
                        <View style={styles.modalSkillsContainer}>
                          {technicianProfile.skills.map((skill, index) => (
                            <View key={index} style={styles.modalSkillChip}>
                              <Text style={styles.modalSkillText}>{skill}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>ĐIỀU KHOẢN & ĐIỀU KIỆN HỢP ĐỒNG</Text>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>I. QUYỀN VÀ NGHĨA VỤ CỦA THỢ SỬA CHỮA</Text>
                        <Text style={styles.modalTermsText}>
                          1. Cam kết cung cấp dịch vụ chất lượng cao, đúng chuyên môn cho khách hàng{'\n'}
                          2. Tuân thủ nghiêm ngặt quy định và tiêu chuẩn an toàn lao động của EzyFix{'\n'}
                          3. Bảo mật tuyệt đối thông tin cá nhân khách hàng và dữ liệu công việc{'\n'}
                          4. Giữ thái độ chuyên nghiệp, lịch sự trong mọi tình huống giao tiếp{'\n'}
                          5. Thông báo trước tối thiểu 24h khi thay đổi lịch làm việc hoặc trạng thái{'\n'}
                          6. Hoàn thành công việc đúng thời gian đã cam kết với khách hàng{'\n'}
                          7. Sử dụng thiết bị, dụng cụ đảm bảo chất lượng và an toàn
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>II. CHÍNH SÁCH THANH TOÁN & PHÍ DỊCH VỤ</Text>
                        <Text style={styles.modalTermsText}>
                          1. Mức giá được niêm yết rõ ràng trên hệ thống (giá/giờ hoặc theo gói){'\n'}
                          2. EzyFix thu phí hoa hồng 20% trên mỗi đơn hàng hoàn thành{'\n'}
                          3. Thanh toán được thực hiện trong vòng 7-10 ngày làm việc sau khi hoàn tất{'\n'}
                          4. Thợ có trách nhiệm xuất hóa đơn VAT theo quy định pháp luật{'\n'}
                          5. Mọi tranh chấp về thanh toán sẽ được giải quyết qua bộ phận hỗ trợ
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>III. CHÍNH SÁCH HỦY ĐƠN & HOÀN TIỀN</Text>
                        <Text style={styles.modalTermsText}>
                          1. Không được tự ý hủy đơn sau khi đã xác nhận nhận việc{'\n'}
                          2. Trường hợp hủy đơn vì lý do chính đáng phải thông báo trước 12h{'\n'}
                          3. Vi phạm hủy đơn quá 3 lần/tháng sẽ bị khóa tài khoản tạm thời{'\n'}
                          4. Khách hàng có quyền yêu cầu hoàn tiền nếu dịch vụ không đạt chất lượng{'\n'}
                          5. Thợ chịu trách nhiệm bồi thường thiệt hại do lỗi nghề nghiệp gây ra
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>IV. ĐÁNH GIÁ & XẾP HẠNG</Text>
                        <Text style={styles.modalTermsText}>
                          1. Khách hàng có quyền đánh giá chất lượng dịch vụ sau khi hoàn thành{'\n'}
                          2. Đánh giá dưới 3.0 sao liên tục sẽ ảnh hưởng đến ưu tiên nhận việc{'\n'}
                          3. Thợ có thể phản hồi đánh giá trong vòng 48h nếu có vấn đề{'\n'}
                          4. Hệ thống sẽ xem xét khiếu nại nếu đánh giá không công bằng{'\n'}
                          5. Duy trì rating cao sẽ được ưu tiên hiển thị và nhận thêm đơn
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>V. BẢO MẬT & BẢO MẬT DỮ LIỆU</Text>
                        <Text style={styles.modalTermsText}>
                          1. Không được sao chép, lưu trữ hoặc chia sẻ thông tin khách hàng{'\n'}
                          2. Không liên hệ khách hàng ngoài nền tảng EzyFix để giao dịch riêng{'\n'}
                          3. Vi phạm chính sách bảo mật sẽ bị chấm dứt hợp đồng ngay lập tức{'\n'}
                          4. Mọi dữ liệu trên hệ thống thuộc quyền sở hữu của EzyFix{'\n'}
                          5. Thợ chịu trách nhiệm pháp lý nếu làm lộ thông tin nhạy cảm
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>VI. CHẤM DỨT HỢP ĐỒNG</Text>
                        <Text style={styles.modalTermsText}>
                          1. Cả hai bên có quyền chấm dứt hợp đồng với thông báo trước 30 ngày{'\n'}
                          2. EzyFix có quyền chấm dứt ngay lập tức nếu phát hiện vi phạm nghiêm trọng{'\n'}
                          3. Các khoản thanh toán đang chờ sẽ được xử lý trong vòng 14 ngày{'\n'}
                          4. Sau khi chấm dứt, tài khoản sẽ bị vô hiệu hóa vĩnh viễn{'\n'}
                          5. Thợ có thể đăng ký lại sau 6 tháng kể từ ngày chấm dứt hợp đồng
                        </Text>
                      </View>
                      
                      <View style={styles.modalTermsBox}>
                        <Text style={styles.modalTermsTitle}>VII. GIẢI QUYẾT TRANH CHẤP</Text>
                        <Text style={styles.modalTermsText}>
                          1. Mọi tranh chấp ưu tiên giải quyết thông qua hòa giải nội bộ{'\n'}
                          2. Nếu không thỏa thuận được, sẽ đưa ra Trọng tài Thương mại Việt Nam{'\n'}
                          3. Chi phí trọng tài sẽ do bên thua kiện chịu hoàn toàn{'\n'}
                          4. Luật áp dụng là Luật Dân sự và Luật Thương mại Việt Nam{'\n'}
                          5. Địa điểm giải quyết tranh chấp tại Thành phố Hồ Chí Minh
                        </Text>
                      </View>
                      
                      <View style={[styles.modalTermsBox, styles.modalAcceptBox]}>
                        <Text style={styles.modalAcceptText}>
                          ✓ Bằng việc ký hợp đồng điện tử này, tôi xác nhận đã đọc, hiểu và đồng ý với tất cả các điều khoản nêu trên.
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
              
              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.modalDownloadButton, downloadingPDF && styles.modalDownloadButtonDisabled]}
                  onPress={handleDownloadContract}
                  disabled={downloadingPDF}
                >
                  {downloadingPDF ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="download-outline" size={20} color="white" />
                  )}
                  <Text style={styles.modalDownloadText}>
                    {downloadingPDF ? 'Đang tạo PDF...' : 'Tải PDF'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalCloseFooterButton}
                  onPress={() => setShowContractModal(false)}
                >
                  <Text style={styles.modalCloseFooterText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  loadingContainer: {
    paddingVertical: 40,
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
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  walletAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    marginTop: -4,
  },
  holdAmountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  holdAmountText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  walletLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statusBadgeInWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  walletActionButton: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  walletActionText: {
    color: '#609CEF',
    fontWeight: '600',
    fontSize: 14,
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
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  sectionLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
  },
  emptySkillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptySkillsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
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
  contractHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  contractDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContractContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  contractTable: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  contractLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  contractValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1.5,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDotContract: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  statusDotContractActive: {
    backgroundColor: '#16a34a',
  },
  statusTextContract: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyContractContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  contractActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewContractButton: {
    flex: 1,
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewContractText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonDisabled: {
    opacity: 0.5,
    borderColor: '#94a3b8',
  },
  downloadText: {
    color: '#609CEF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Contract Detail Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contractModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: 500,
  },
  modalSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDivider: {
    height: 2,
    backgroundColor: '#609CEF',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 1,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#609CEF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  modalInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1.5,
    textAlign: 'right',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  modalStatusDotActive: {
    backgroundColor: '#16a34a',
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  contractActiveBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  contractActiveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  modalSkillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  modalSkillChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  modalSkillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
  modalTermsBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginBottom: 12,
  },
  modalTermsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
    marginBottom: 8,
  },
  modalTermsText: {
    fontSize: 13,
    color: '#78716c',
    lineHeight: 22,
  },
  modalAcceptBox: {
    backgroundColor: '#dcfce7',
    borderLeftColor: '#16a34a',
  },
  modalAcceptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    lineHeight: 20,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  modalDownloadButton: {
    flex: 1,
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalDownloadButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#94a3b8',
  },
  modalDownloadText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCloseFooterButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseFooterText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
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