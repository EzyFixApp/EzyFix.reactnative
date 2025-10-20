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
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthActions, useAuth, useAuthStore } from '../store/authStore';
import type { UserType } from '../lib/api/config';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onBack: () => void;
  onLogin?: () => void;
  userType?: UserType;
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
  // Auth store
  const { isLoading, error } = useAuth();
  const { login, clearError } = useAuthActions();

  // Animation values
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const headerAnim = React.useRef(new Animated.Value(-50)).current;
  const formAnim = React.useRef(new Animated.Value(30)).current;

  const buttonAnim = React.useRef(new Animated.Value(0.9)).current;
  const googleAnim = React.useRef(new Animated.Value(0.9)).current;

  // Form states
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showError, setShowError] = React.useState(false);
  
  // Two-step login state
  const [currentStep, setCurrentStep] = React.useState<'email' | 'password'>('email');
  
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

  React.useEffect(() => {
    // Removed automatic error alert to prevent duplicate notifications
    // Error handling is now done directly in handleLogin
  }, []);

  React.useEffect(() => {
    if (error) {
      // Clear error immediately to prevent it from showing
      clearError();
    }
  }, [error, clearError]);

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

  const handleLogin = async () => {
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu để tiếp tục');
      setShowError(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 3000);
      return;
    }

    try {
      // Clear any previous errors
      clearError();
      setShowError(false);
      setErrorMessage('');
      
      // Call API login
      await login({ email: email.trim(), password }, userType);
      
      // Get the updated user data to check verification status
      const currentUser = useAuthStore.getState().user;
      
      // Check if user has verified their email
      // isVerify: false means user never verified their email after registration
      if (currentUser?.isVerify === false && currentUser?.email) {
        // User is not verified, redirect to verify page with email
        if (userType === 'technician') {
          router.replace(`/technician/verify?email=${encodeURIComponent(currentUser.email)}`);
        } else {
          router.replace(`/customer/verify?email=${encodeURIComponent(currentUser.email)}`);
        }
        return;
      }
      
      // User is verified or verification status unknown, proceed with normal navigation
      // Success - call onLogin callback if provided
      if (onLogin) {
        onLogin();
      } else {
        // Default navigation based on user type
        if (userType === 'technician') {
          router.replace('/technician/dashboard' as any);
        } else {
          router.replace('/(tabs)/' as any);
        }
      }
    } catch (error: any) {
      // Extract meaningful error message for user
      let userErrorMessage = '';
      
      if (error.status_code === 401) {
        userErrorMessage = 'Email hoặc mật khẩu không chính xác';
      } else if (error.status_code === 404) {
        userErrorMessage = 'Tài khoản không tồn tại';
      } else if (error.status_code === 400) {
        userErrorMessage = 'Thông tin đăng nhập không hợp lệ';
      } else if (error.status_code === 0) {
        userErrorMessage = 'Không thể kết nối đến server';
      } else {
        userErrorMessage = 'Đã có lỗi xảy ra, vui lòng thử lại';
      }
      
      // Show professional error message
      setErrorMessage(userErrorMessage);
      setShowError(true);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement social login
  };

  const handleContinue = () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email');
      setShowError(true);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Định dạng email không hợp lệ');
      setShowError(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowError(false);
        setErrorMessage('');
      }, 3000);
      return;
    }
    
    // Clear any existing errors
    setShowError(false);
    setErrorMessage('');
    
    // Professional slide transition to password step
    Animated.parallel([
      // Slide email step out to the left
      Animated.timing(phoneStepTransform, {
        toValue: -width * 0.3,
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      // Fade out email step
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
      setCurrentStep('email');
      // Reset email step position and animate in
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
                {currentStep === 'email' ? 'Đăng Nhập' : 'Nhập Mật Khẩu'}
              </Text>
              <Text style={styles.subtitle}>
                {currentStep === 'email' 
                  ? (subtitle || (userType === 'technician' ? 'Đăng nhập để bắt đầu công việc' : 'EzyFix - App trong tay thợ tới ngay'))
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
            {currentStep === 'email' ? (
              // Step 1: Email Input
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
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.phoneInputContainer}>
                    {/* Email Input */}
                    <TextInput
                      style={[
                        styles.phoneTextInput, 
                        { flex: 1, borderLeftWidth: 0 },
                        showError && styles.inputError
                      ]}
                      placeholder="Nhập địa chỉ email"
                      placeholderTextColor="#94a3b8"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        // Clear error when user starts typing
                        if (showError) {
                          setShowError(false);
                          setErrorMessage('');
                        }
                      }}
                      keyboardType="email-address"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus={currentStep === 'email'}
                      editable={!isLoading}
                    />
                  </View>
                  
                  {/* Inline Error Message for Email */}
                  {showError && currentStep === 'email' && (
                    <Animated.View style={styles.inlineError}>
                      <Text style={styles.errorIcon}>⚠️</Text>
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </Animated.View>
                  )}
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
                {/* Email Display */}
                <TouchableOpacity 
                  style={styles.phoneNumberDisplay}
                  onPress={handleBackToPhone}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneNumberText}>
                    {email}
                  </Text>
                  <Text style={styles.changePhoneText}>Thay đổi</Text>
                </TouchableOpacity>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.textInput, 
                        styles.passwordInput,
                        showError && styles.inputError
                      ]}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor="#94a3b8"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        // Clear error when user starts typing
                        if (showError) {
                          setShowError(false);
                          setErrorMessage('');
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      autoFocus={currentStep === 'password'}
                      editable={!isLoading}
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
                  
                  {/* Inline Error Message for Password */}
                  {showError && currentStep === 'password' && (
                    <Animated.View style={styles.inlineError}>
                      <Text style={styles.errorIcon}>⚠️</Text>
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </Animated.View>
                  )}
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
            {currentStep === 'email' ? (
              // Step 1: Always show "Quên mật khẩu?" and appropriate button
              <View style={styles.emailStepContainer}>
                {/* Forgot Password Link - Above button, aligned right - Always visible */}
                <TouchableOpacity 
                  style={styles.forgotPasswordLinkAbove}
                  activeOpacity={0.7}
                  onPress={() => {
                    const route = userType === 'customer' 
                      ? '/customer/forgot-password' 
                      : '/technician/forgot-password';
                    router.push(route);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
                
                {/* Button based on email input state */}
                {email.trim() && !isLoading ? (
                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinue}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.continueButtonText}>Tiếp theo</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.loginButton, styles.disabledButton]}
                    onPress={() => {
                      // Do nothing or show alert to enter email first
                      alert('Vui lòng nhập email để tiếp tục');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.loginButtonText, styles.disabledButtonText]}>Đăng nhập</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // Step 2: Always show "Đăng nhập"
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (isLoading || !password.trim()) && styles.disabledButton
                ]}
                onPress={handleLogin}
                disabled={isLoading || !password.trim()}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.loginButtonText,
                  (isLoading || !password.trim()) && styles.disabledButtonText
                ]}>
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Divider & Social Login - Only show in email step */}
          {currentStep === 'email' && (
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
    marginBottom: 28,
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
    marginBottom: 20,
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
    marginTop: 20,
    marginBottom: 24,
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
    marginBottom: 8,
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
    marginBottom: 20,
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
    paddingVertical: 16,
    marginTop: 8,
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
  forgotPasswordLink: {
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  
  // Email step container - vertical layout with forgot password above
  emailStepContainer: {
    width: '100%',
  },
  forgotPasswordLinkAbove: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: -50,
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

  // Inline Error Styles - Subtle và Professional
  inputError: {
    borderColor: '#fca5a5',
    borderWidth: 1.5,
    backgroundColor: '#fef7f7',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f87171',
  },
  errorIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
    lineHeight: 18,
  },
});