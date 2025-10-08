import * as React from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  FlatList,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Country codes data with flags
interface CountryCode {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', dialCode: '+84' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'China', code: 'CN', flag: '🇨🇳', dialCode: '+86' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', dialCode: '+82' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', dialCode: '+66' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dialCode: '+60' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', dialCode: '+63' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
];

interface LoginScreenProps {
  onBack: () => void;
  onLogin?: () => void;
  userType?: 'customer' | 'technician';
  title?: string;
  subtitle?: string;
}

export default function LoginScreen({ 
  onBack, 
  onLogin, 
  userType = 'customer',
  title,
  subtitle 
}: LoginScreenProps) {
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const headerAnim = React.useRef(new Animated.Value(-50)).current;
  const formAnim = React.useRef(new Animated.Value(30)).current;
  const buttonAnim = React.useRef(new Animated.Value(0.9)).current;
  const googleAnim = React.useRef(new Animated.Value(0.9)).current;

  // Form states
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  
  // Country code state
  const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(COUNTRY_CODES[0]); // Default: Vietnam
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);
  
  // Two-step login state
  const [currentStep, setCurrentStep] = React.useState<'phone' | 'password'>('phone');
  
  // Step animation values
  const stepSlideAnim = React.useRef(new Animated.Value(0)).current;
  const phoneStepOpacity = React.useRef(new Animated.Value(1)).current;
  const passwordStepOpacity = React.useRef(new Animated.Value(0)).current;
  const phoneStepTransform = React.useRef(new Animated.Value(0)).current;
  const passwordStepTransform = React.useRef(new Animated.Value(50)).current;
  const titleOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    startEnterAnimation();
  }, []);

  const startEnterAnimation = () => {
    Animated.parallel([
      // Slide in from right
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animate content after slide in
      animateContent();
    });
  };

  const animateContent = () => {
    Animated.sequence([
      // Header animation
      Animated.spring(headerAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      // Form fields animation
      Animated.parallel([
        Animated.spring(formAnim, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Social buttons animation
      Animated.spring(googleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBack = () => {
    if (currentStep === 'password') {
      // If on password step, go back to phone step
      handleBackToPhone();
    } else {
      // If on phone step, exit to previous screen
      handleExitToHome();
    }
  };

  const handleExitToHome = () => {
    // Exit animation to previous screen
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onBack();
    });
  };

  const handleLogin = () => {
    console.log('Login with:', { phoneNumber, password, userType });
    // TODO: Implement actual login logic
    
    if (onLogin) {
      onLogin();
    } else {
      // Default navigation based on user type
      if (userType === 'technician') {
        router.push('/technician/dashboard' as any);
      } else {
        router.push('/customer/dashboard' as any);
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
    // TODO: Implement social login
  };

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return;
    }
    
    // Basic phone number validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      alert('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số');
      return;
    }
    
    // Professional slide transition to password step
    Animated.parallel([
      // Slide phone step out to the left
      Animated.timing(phoneStepTransform, {
        toValue: -width * 0.3,
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      // Fade out phone step
      Animated.timing(phoneStepOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Fade out title for smooth text change
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep('password');
      // Reset password step position and animate in
      passwordStepTransform.setValue(width * 0.3);
      Animated.parallel([
        // Slide password step in from right
        Animated.timing(passwordStepTransform, {
          toValue: 0,
          duration: 500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        // Fade in password step
        Animated.timing(passwordStepOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fade in title with new text
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleBackToPhone = () => {
    // Professional slide transition back to phone step
    Animated.parallel([
      // Slide password step out to the right
      Animated.timing(passwordStepTransform, {
        toValue: width * 0.3,
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      // Fade out password step
      Animated.timing(passwordStepOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // Fade out title for smooth text change
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep('phone');
      // Reset phone step position and animate in
      phoneStepTransform.setValue(-width * 0.3);
      Animated.parallel([
        // Slide phone step in from left
        Animated.timing(phoneStepTransform, {
          toValue: 0,
          duration: 500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        // Fade in phone step
        Animated.timing(phoneStepOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Fade in title with new text
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ translateY: headerAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <View style={styles.backIconContainer}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          
          {/* Welcome Section */}
          <Animated.View 
            style={[
              styles.welcomeSection,
              {
                transform: [{ translateY: headerAnim }]
              }
            ]}
          >
            <Text style={styles.greeting}>
              {title || (userType === 'technician' ? 'Chào mừng thợ sửa chữa!' : 'Chào mừng bạn! ')}
            </Text>
            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.title}>
                {currentStep === 'phone' ? 'Đăng Nhập' : 'Nhập Mật Khẩu'}
              </Text>
              <Text style={styles.subtitle}>
                {currentStep === 'phone' 
                  ? (subtitle || (userType === 'technician' ? 'Đăng nhập để bắt đầu công việc' : 'App trong tay thợ tới ngay'))
                  : 'Vui lòng nhập mật khẩu để hoàn tất đăng nhập'
                }
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Form Section - Two Step Layout */}
          <Animated.View 
            style={[
              styles.formSection,
              {
                transform: [{ translateY: formAnim }]
              }
            ]}
          >
            {/* Conditional Step Display */}
            {currentStep === 'phone' ? (
              // Step 1: Phone Number Input
              <Animated.View 
                style={[
                  styles.stepContainer,
                  {
                    opacity: phoneStepOpacity,
                    transform: [
                      { translateX: phoneStepTransform },
                      { scale: phoneStepOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      }) }
                    ],
                  }
                ]}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Số điện thoại</Text>
                  <View style={styles.phoneInputContainer}>
                    {/* Country Code Picker */}
                    <TouchableOpacity 
                      style={styles.countryCodeButton}
                      onPress={() => setShowCountryPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                      <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
                      <Text style={styles.chevronDown}>▼</Text>
                    </TouchableOpacity>
                    
                    {/* Phone Number Input */}
                    <TextInput
                      style={styles.phoneTextInput}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor="#94a3b8"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      autoFocus={currentStep === 'phone'}
                    />
                  </View>
                </View>
              </Animated.View>
            ) : (
              // Step 2: Password Input
              <Animated.View 
                style={[
                  styles.stepContainer,
                  {
                    opacity: passwordStepOpacity,
                    transform: [
                      { translateX: passwordStepTransform },
                      { scale: passwordStepOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1],
                      }) }
                    ],
                  }
                ]}
              >
                {/* Phone Number Display */}
                <TouchableOpacity 
                  style={styles.phoneNumberDisplay}
                  onPress={handleBackToPhone}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneNumberText}>
                    ({selectedCountry.dialCode}) {phoneNumber}
                  </Text>
                  <Text style={styles.changePhoneText}>Thay đổi</Text>
                </TouchableOpacity>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      autoFocus={currentStep === 'password'}
                    />
                    <TouchableOpacity 
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.eyeIcon}>
                        {showPassword ? '👁️' : '🙈'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity 
                  style={styles.forgotPassword} 
                  activeOpacity={0.7}
                  onPress={() => {
                    const route = userType === 'customer' 
                      ? '/customer/forgot-password' 
                      : '/technician/forgot-password';
                    router.push(route);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu ?</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>

          {/* Step-based Button */}
          <Animated.View 
            style={[
              styles.buttonSection,
              {
                transform: [{ scale: buttonAnim }]
              }
            ]}
          >
            {currentStep === 'phone' ? (
              // Step 1: Show "Tiếp theo" if phone number entered, disabled "Đăng nhập" if empty
              phoneNumber.trim() ? (
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text style={styles.continueButtonText}>Tiếp theo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.loginButton, styles.disabledButton]}
                  onPress={() => {
                    // Do nothing or show alert to enter phone number first
                    alert('Vui lòng nhập số điện thoại để tiếp tục');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.loginButtonText, styles.disabledButtonText]}>Đăng nhập</Text>
                </TouchableOpacity>
              )
            ) : (
              // Step 2: Always show "Đăng nhập"
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Divider & Social Login - Only show in phone step */}
          {currentStep === 'phone' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.dividerLine} />
              </View>

              <Animated.View 
                style={[
                  styles.googleSection,
                  {
                    transform: [{ scale: googleAnim }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => handleSocialLogin('google')}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleIconContainer}>
                    <Image 
                      source={require('../assets/logogoogle.png')}
                      style={styles.googleIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.registerLink} 
                  activeOpacity={0.7}
                  onPress={() => {
                    const route = userType === 'customer' 
                      ? '/customer/register' 
                      : '/technician/register';
                    router.push(route);
                  }}
                >
                  <Text style={styles.registerText}>
                    Bạn chưa có tài khoản? <Text style={styles.registerLinkText}>Đăng ký ngay</Text>
                  </Text>
                </TouchableOpacity>

              </Animated.View>
            </>
          )}

        </View>
      </SafeAreaView>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn quốc gia</Text>
              <TouchableOpacity 
                onPress={() => setShowCountryPicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Country List */}
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                  {selectedCountry.code === item.code && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  backIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 24,
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#609CEF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },

  // Form Section
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#609CEF',
  },

  // Button Section
  buttonSection: {
    marginBottom: 32,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#609CEF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Divider
  divider: {
    marginBottom: 32,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginHorizontal: 16,
  },

  // Google Section
  googleSection: {
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  googleIconImage: {
    width: 20,
    height: 20,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285f4',
  },
  googleButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
    textAlign: 'center',
    marginRight: 24, // Để text căn giữa với icon
  },
  registerLink: {
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  registerLinkText: {
    color: '#609CEF',
    fontWeight: '600',
  },

  // Two-step login styles
  stepContainer: {
    width: '100%',
    paddingHorizontal: 2, // Slight padding to prevent clipping during transform
  },
  stepHint: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  phoneNumberDisplay: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  changePhoneText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#609CEF',
  },

  // Step buttons
  continueButton: {
    width: '100%',
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  passwordButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  backStepButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backStepButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },

  // Disabled button styles
  disabledButton: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0.1,
  },
  disabledButtonText: {
    color: '#94a3b8',
  },

  // Phone input with country code
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
  },
  flagText: {
    fontSize: 24,
  },
  dialCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  chevronDown: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 2,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },

  // Country picker modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  countryDialCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  checkMark: {
    fontSize: 20,
    color: '#609CEF',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72, // Align with text after flag
  },

  // Home Indicator
  homeIndicator: {
    alignItems: 'center',
    paddingBottom: 12,
    paddingTop: 8,
  },
  homeIndicatorBar: {
    width: 134,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 3,
    opacity: 0.3,
  },
});