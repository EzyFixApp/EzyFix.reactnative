/**
 * Development Configuration
 * Controls development-time behaviors for better DX
 */

import { Platform } from 'react-native';

if (__DEV__ && Platform.OS !== 'web') {
  // Store original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // List of specific warnings to suppress (yellow box spam)
  const SUPPRESSED_WARNINGS = [
    'VirtualizedLists should never be nested',
    'Warning: Each child in a list should have a unique "key" prop',
    'Non-serializable values were found in the navigation state',
  ];

  // Override console.warn to suppress spam
  console.warn = (...args) => {
    const message = args.join(' ');
    const shouldSuppress = SUPPRESSED_WARNINGS.some(warning => 
      message.includes(warning)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };

  // Keep console.error for debugging - only suppress React Native's duplicate auth errors
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Only suppress specific React Native internal auth error duplicates
    const isReactNativeAuthError = (
      message.includes('Login failed: {"status_code":401') ||
      message.includes('reactConsoleErrorHandler') ||
      message.includes('addConsoleLog')
    ) && message.includes('Wrong password');
    
    if (!isReactNativeAuthError) {
      originalError.apply(console, args);
    }
  };
}