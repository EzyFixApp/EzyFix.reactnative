import * as React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AnimatedDots from './AnimatedDots';
import LoadingSpinner from './LoadingSpinner';
import AnimatedText from './AnimatedText';

const { width, height } = Dimensions.get('window');

type AnimationStage = 'logo' | 'welcome' | 'selection';
type TransitionState = 'idle' | 'customer-transition' | 'technician-transition';

export default function AnimatedHomeScreen() {
  const [currentStage, setCurrentStage] = React.useState<AnimationStage>('logo');
  const [transitionState, setTransitionState] = React.useState<TransitionState>('idle');
  
  // Animation values với initial values tối ưu
  const logoOpacity = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.3)).current; // Bắt đầu nhỏ hơn cho effect dramatic hơn
  
  const welcomeOpacity = React.useRef(new Animated.Value(0)).current;
  const welcomeTranslateY = React.useRef(new Animated.Value(20)).current; // Giảm distance cho smooth hơn
  
  const selectionOpacity = React.useRef(new Animated.Value(0)).current;
  const selectionTranslateY = React.useRef(new Animated.Value(30)).current; // Giảm distance
  const cardScale = React.useRef(new Animated.Value(0.95)).current; // Bắt đầu gần scale cuối
  
  const button1Scale = React.useRef(new Animated.Value(0.9)).current; // Bắt đầu gần scale cuối
  const button2Scale = React.useRef(new Animated.Value(0.9)).current;

  // Transition animation values
  const transitionOpacity = React.useRef(new Animated.Value(0)).current;
  const transitionScale = React.useRef(new Animated.Value(0.8)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    // Stage 1: Logo Animation với hiệu ứng mượt mà hơn
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Easing mượt mà hơn
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setCurrentStage('welcome');
        animateToWelcome();
      }, 1200); // Giảm thời gian chờ cho flow mượt hơn
    });
  };

  const animateToWelcome = () => {
    // Stage 2: Welcome Animation với transition mượt mà
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 0.75, // Scale down logo với tỉ lệ đẹp hơn
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Easing mượt mà
        useNativeDriver: true,
      }),
      Animated.spring(welcomeTranslateY, {
        toValue: 0,
        tension: 90,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        setCurrentStage('selection');
        animateToSelection();
      }, 1800); // Thời gian hợp lý để user đọc content
    });
  };

  const animateToSelection = () => {
    // Stage 3: Selection Animation (like Figma screen 3)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(selectionOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(selectionTranslateY, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(200, [
        Animated.spring(button1Scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(button2Scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleThoPress = () => {
    console.log('Tôi là thợ pressed');
    startTechnicianTransition();
  };

  const startTechnicianTransition = () => {
    setTransitionState('technician-transition');
    
    // Phase 1: Show overlay and transition text
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(transitionOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(transitionScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Hold text for enough time to see full animation
      setTimeout(() => {
        // Phase 2.5: Fade out loading elements smoothly
        setTimeout(() => {
          // Phase 3: Transition to technician screen
          Animated.parallel([
            Animated.timing(transitionOpacity, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Navigate to technician login screen
            router.push('./technician/login');
            setTransitionState('idle');
            // Reset transition animations
            resetTransitionAnimations();
          });
        }, 200); // Short pause for smooth transition
      }, 2300); // Adjusted to 2.3s for better timing
    });
  };

  const handleKhachHangPress = () => {
    console.log('Tôi là khách hàng pressed');
    startCustomerTransition();
  };

  const startCustomerTransition = () => {
    setTransitionState('customer-transition');
    
    // Phase 1: Show overlay and transition text
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(transitionOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(transitionScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Hold text for enough time to see full animation
      setTimeout(() => {
        // Phase 2.5: Fade out loading elements smoothly
        setTimeout(() => {
          // Phase 3: Transition to login screen
          Animated.parallel([
            Animated.timing(transitionOpacity, {
              toValue: 0,
              duration: 300,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 400,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Navigate to customer login screen
            router.push('./customer/login');
            setTransitionState('idle');
            // Reset transition animations
            resetTransitionAnimations();
          });
        }, 200); // Short pause for smooth transition
      }, 2300); // Adjusted to 2.3s for better timing
    });
  };

  const resetTransitionAnimations = () => {
    transitionOpacity.setValue(0);
    transitionScale.setValue(0.8);
    overlayOpacity.setValue(0);
  };

  const onButtonPressIn = (buttonScale: Animated.Value) => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onButtonPressOut = (buttonScale: Animated.Value) => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.content}>
        
        {/* Logo Section - Always visible */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../assets/Logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Welcome Section - Screen 2 */}
        {(currentStage === 'welcome' || currentStage === 'selection') && (
          <Animated.View
            style={[
              styles.welcomeContainer,
              {
                opacity: welcomeOpacity,
                transform: [{ translateY: welcomeTranslateY }]
              }
            ]}
          >
            <Text style={styles.welcomeTitle}>Chào mừng bạn đến với</Text>
            <Text style={styles.welcomeBrand}>EZYFIX</Text>
            <Text style={styles.welcomeSubtitle}>App trên tay - thợ tới ngay</Text>
            
            {currentStage === 'welcome' && (
              <View style={styles.loadingContainer}>
                <LoadingSpinner 
                  size={32} 
                  colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
                  style={styles.loadingSpinner}
                />
                <AnimatedText 
                  text="Khởi tạo ứng dụng..."
                  style={styles.loadingText}
                  typingSpeed={80}
                  showCursor={false}
                />
                <AnimatedDots 
                  size={6} 
                  color="#94a3b8"
                  style={styles.loadingDots}
                  animationDuration={800}
                />
              </View>
            )}
          </Animated.View>
        )}

        {/* Selection Section - Screen 3 */}
        {currentStage === 'selection' && (
          <Animated.View
            style={[
              styles.selectionContainer,
              {
                opacity: selectionOpacity,
                transform: [
                  { translateY: selectionTranslateY },
                  { scale: cardScale }
                ]
              }
            ]}
          >
            <View style={styles.selectionCard}>
              
              <View style={styles.greetingSection}>
                <Text style={styles.greetingText}>Xin chào !</Text>
                <Text style={styles.instructionText}>
                  Vui lòng chọn vai trò của bạn:
                </Text>
              </View>

              <View style={styles.buttonsContainer}>
                
                {/* Tôi là thợ Button */}
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    {
                      transform: [{ scale: button1Scale }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleThoPress}
                    onPressIn={() => onButtonPressIn(button1Scale)}
                    onPressOut={() => onButtonPressOut(button1Scale)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.buttonText, styles.primaryButtonText]}>
                      Tôi là thợ
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Tôi là khách hàng Button */}
                <Animated.View
                  style={[
                    styles.buttonWrapper,
                    {
                      transform: [{ scale: button2Scale }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={handleKhachHangPress}
                    onPressIn={() => onButtonPressIn(button2Scale)}
                    onPressOut={() => onButtonPressOut(button2Scale)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                      Tôi là khách hàng
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
                
              </View>
            </View>
          </Animated.View>
        )}

      </View>

      {/* Professional Transition Overlay */}
      {transitionState !== 'idle' && (
        <Animated.View 
          style={[
            styles.transitionOverlay,
            {
              opacity: overlayOpacity,
            }
          ]}
        >
          <LinearGradient
            colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            <Animated.View
              style={[
                styles.transitionContent,
                {
                  opacity: transitionOpacity,
                  transform: [{ scale: transitionScale }]
                }
              ]}
            >
              {/* Modern Loading Spinner */}
              <View style={styles.transitionLoadingContainer}>
                <LoadingSpinner 
                  size={64} 
                  colors={['#FFFFFF', '#F0F8FF', '#E6F3FF']}
                  strokeWidth={4}
                  style={styles.transitionSpinner}
                />
              </View>
              
              {/* Welcome Message */}
              <View style={styles.transitionWelcomeContainer}>
                <Text style={styles.transitionWelcomeTitle}>Chào mừng!</Text>
                <AnimatedText 
                  text={transitionState === 'customer-transition' ? 'Đang chuyển đến trang khách hàng...' : 'Đang chuyển đến trang thợ...'}
                  style={styles.transitionText}
                  typingSpeed={40}
                  showCursor={false}
                />
              </View>
              
              {/* Enhanced dots animation */}
              <AnimatedDots 
                size={10} 
                color="rgba(255, 255, 255, 0.9)"
                animationDuration={500}
                style={styles.transitionDots}
              />
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light gray/white background like Figma
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Logo Section Styles
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },

  // Welcome Section Styles
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeBrand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#609CEF', // Blue brand color
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingDots: {
    marginTop: 8,
  },

  // Selection Section Styles
  selectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  greetingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },

  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#609CEF',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#609CEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#609CEF',
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
  
  // Transition overlay styles
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  gradientOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  transitionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  transitionLoadingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  transitionSpinner: {
    marginBottom: 8,
  },
  
  transitionWelcomeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  transitionWelcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  
  transitionText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  
  transitionDots: {
    marginTop: 20,
  },
});