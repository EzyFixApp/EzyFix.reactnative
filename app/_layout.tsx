import 'react-native-reanimated';
import '../global.css';
import 'expo-dev-client';
// Development configuration
import '../lib/devConfig';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Icon } from '@roninoss/icons';

import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeToggle } from '~/components/ThemeToggle';
import { cn } from '~/lib/cn';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';
import { useNotifications } from '~/hooks/useNotifications';
import { useAuthStore, getIsManualLogoutInProgress } from '~/store/authStore';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const { isAuthenticated, user, error, clearError } = useAuthStore();
  
  // Track if we've already shown the session expired alert
  const hasShownAlertRef = useRef(false);
  
  // Initialize push notifications
  const { isInitialized } = useNotifications();

  // Handle authentication state changes and auto-redirect on session expiry
  useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = [
      'login', 
      'register', 
      'forgot-password', 
      'reset-password', 
      'otp-verification',
      'verify'
    ];
    
    // Check if current route is public
    const currentRoute = segments[1]; // segments[0] = 'customer' or 'technician', segments[1] = actual page
    const isPublicRoute = currentRoute ? publicRoutes.includes(currentRoute) : false;
    
    // Check if user is on protected route
    const isProtectedRoute = (segments[0] === 'customer' || segments[0] === 'technician') && !isPublicRoute;
    
    // ✅ Role-based access control: Check if user is accessing wrong role routes
    if (isAuthenticated && user?.userType && isProtectedRoute) {
      const routeRole = segments[0]; // 'customer' or 'technician'
      const userRole = user.userType; // 'customer' or 'technician'
      
      // Redirect if user role doesn't match route role
      if (routeRole === 'customer' && userRole === 'technician') {
        if (__DEV__) console.log('🚫 Technician trying to access customer routes, redirecting...');
        router.replace('/technician/dashboard' as any);
        return;
      } else if (routeRole === 'technician' && userRole === 'customer') {
        if (__DEV__) console.log('🚫 Customer trying to access technician routes, redirecting...');
        router.replace('/(tabs)/' as any);
        return;
      }
      
      // Special case: (tabs) route is for customers only
      // Check pathname for (tabs) instead of segments
      if (pathname.includes('(tabs)') && userRole !== 'customer') {
        if (__DEV__) console.log('🚫 Technician trying to access customer tabs, redirecting...');
        router.replace('/technician/dashboard' as any);
        return;
      }
    }
    
    if (!isAuthenticated && isProtectedRoute) {
      // User is not authenticated and trying to access protected route
      // Check if this is a manual logout (synchronous flag)
      const isManualLogout = getIsManualLogoutInProgress();
      
      // ✅ CRITICAL: Do NOT redirect during manual logout
      // Let the logout handler (profile.tsx) manage navigation
      if (isManualLogout) {
        if (__DEV__) console.log('⏭️ Manual logout in progress, skipping _layout redirect');
        return; // Exit early, don't redirect
      }
      
      // Show alert ONLY if there's a session expired error (not normal logout)
      // AND we haven't shown the alert yet (prevent infinite loop)
      if (error && error.includes('hết hạn') && !hasShownAlertRef.current) {
        hasShownAlertRef.current = true; // Mark as shown
        
        // Clear error and redirect immediately to prevent app freeze
        clearError();
        
        // Show alert and redirect regardless of button press
        Alert.alert(
          'Phiên đăng nhập không hợp lệ',
          error,
          [
            {
              text: 'Đăng nhập lại',
              onPress: () => {
                hasShownAlertRef.current = false; // Reset for next time
                router.replace('/');
              }
            }
          ],
          { 
            cancelable: false,
            onDismiss: () => {
              // Fallback: redirect even if alert is dismissed somehow
              hasShownAlertRef.current = false;
              router.replace('/');
            }
          }
        );
        
        // Fallback redirect after 5 seconds if user doesn't press button
        setTimeout(() => {
          if (hasShownAlertRef.current && !isAuthenticated) {
            hasShownAlertRef.current = false;
            router.replace('/');
          }
        }, 5000);
      } else {
        // Redirect to home silently (auto session expiry, no error message)
        if (__DEV__) console.log('🔒 Auto session expired, redirecting to home from:', segments.join('/'));
        clearError(); // Clear any error before redirecting
        hasShownAlertRef.current = false; // Reset flag
        router.replace('/');
      }
    }
    
    // Reset alert flag when user is authenticated (for next session expiry)
    if (isAuthenticated) {
      hasShownAlertRef.current = false;
    }
  }, [isAuthenticated, user?.userType, segments, error]);

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}

      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ActionSheetProvider>
            <NavThemeProvider value={NAV_THEME[colorScheme]}>
              <Stack screenOptions={SCREEN_OPTIONS}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="home/index" options={{ headerShown: false }} />
                <Stack.Screen name="customer/login" options={{ headerShown: false }} />
                <Stack.Screen name="customer/dashboard" options={{ headerShown: false }} />
                <Stack.Screen name="customer/reset-password" options={{ headerShown: false }} />
                <Stack.Screen 
                  name="customer/ai-assistant" 
                  options={{ 
                    headerShown: true,
                    headerStyle: { backgroundColor: '#609CEF' },
                    headerTintColor: 'white',
                    headerShadowVisible: false, // Remove shadow line
                    headerTitleAlign: 'center',
                    headerBackTitle: '',
                    title: 'Trợ Lý EzyFix AI',
                  }} 
                />
                <Stack.Screen 
                  name="customer/book-service" 
                  options={{ 
                    headerShown: false,
                    gestureEnabled: false, // Disable swipe back gesture
                    headerLeft: () => null, // Remove back button
                  }} 
                />
                <Stack.Screen name="(tabs)" options={TABS_OPTIONS} />
                <Stack.Screen name="technician/index" options={{ headerShown: false }} />
                <Stack.Screen name="technician/login" options={{ headerShown: false }} />
                <Stack.Screen name="technician/dashboard" options={{ headerShown: false }} />
                <Stack.Screen name="technician/profile" options={{ headerShown: false }} />
                <Stack.Screen name="technician/reset-password" options={{ headerShown: false }} />
                <Stack.Screen name="technician/personal-info" options={{ headerShown: false }} />
                <Stack.Screen name="technician/activity" options={{ headerShown: false }} />
                <Stack.Screen name="technician/order-history-detail" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={MODAL_OPTIONS} />
              </Stack>
            </NavThemeProvider>
          </ActionSheetProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>

      {/* </ExampleProvider> */}
    </>
  );
}

const SCREEN_OPTIONS = {
  animation: 'ios_from_right', // for android
} as const;

const TABS_OPTIONS = {
  headerShown: false,
} as const;

const MODAL_OPTIONS = {
  presentation: 'modal',
  animation: 'fade_from_bottom', // for android
  title: 'Settings',
  headerRight: () => <ThemeToggle />,
} as const;
