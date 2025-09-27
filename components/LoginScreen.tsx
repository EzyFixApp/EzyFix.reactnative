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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onBack: () => void;
}

export default function LoginScreen({ onBack }: LoginScreenProps) {
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
    // Exit animation
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
    console.log('Login with:', { phoneNumber, password });
    // TODO: Implement actual login logic
    
    // Navigate to customer dashboard after successful login
    router.push('/customer/dashboard');
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
    // TODO: Implement social login
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
            <Text style={styles.greeting}>Xin chào !</Text>
            <Text style={styles.title}>Đăng Nhập</Text>
            <Text style={styles.subtitle}>Hãy để chúng tôi giúp bạn!</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formSection,
              {
                transform: [{ translateY: formAnim }]
              }
            ]}
          >
            
            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94a3b8"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
            </View>

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
            <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Quên mật khẩu ?</Text>
            </TouchableOpacity>

          </Animated.View>

          {/* Login Button */}
          <Animated.View 
            style={[
              styles.buttonSection,
              {
                transform: [{ scale: buttonAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Login */}
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

            <TouchableOpacity style={styles.registerLink} activeOpacity={0.7}>
              <Text style={styles.registerText}>
                Bạn chưa có tài khoản? <Text style={styles.registerLinkText}>Đăng ký ngay</Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>

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
    fontWeight: '300',
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