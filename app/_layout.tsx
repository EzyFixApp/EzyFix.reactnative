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
import { useAuthStore } from '~/store/authStore';
import { useRouter, useSegments } from 'expo-router';
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
  const { isAuthenticated, error, clearError } = useAuthStore();
  
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
    
    if (!isAuthenticated && isProtectedRoute) {
      // User is not authenticated and trying to access protected route
      // Show alert ONLY if there's a session expired error (not normal logout)
      // AND we haven't shown the alert yet (prevent infinite loop)
      if (error && error.includes('hết hạn') && !hasShownAlertRef.current) {
        hasShownAlertRef.current = true; // Mark as shown
        
        Alert.alert(
          'Phiên đăng nhập không hợp lệ',
          error,
          [
            {
              text: 'Đăng nhập lại',
              onPress: () => {
                clearError();
                hasShownAlertRef.current = false; // Reset for next time
                router.replace('/');
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Redirect to home silently (normal logout or no error)
        if (__DEV__) console.log('🔒 Not authenticated, redirecting to home from:', segments.join('/'));
        clearError(); // Clear any error before redirecting
        router.replace('/');
      }
    }
    
    // Reset alert flag when user is authenticated (for next session expiry)
    if (isAuthenticated) {
      hasShownAlertRef.current = false;
    }
  }, [isAuthenticated, segments, error]);

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
