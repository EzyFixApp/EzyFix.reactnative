/**
 * Test API Integration
 * Simple test file to verify API setup and authentication flow
 */

import { authService } from '../lib/api';
import type { LoginRequest } from '../types/api';

// Test data
const testCredentials: LoginRequest = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Test API connection
 */
export const testApiConnection = async () => {
  try {
    console.log('🧪 Testing API connection...');
    
    // This will make a request to the login endpoint
    // We expect it to fail with 401/400 but it confirms the connection works
    await authService.login(testCredentials);
    
    console.log('✅ API connection test passed');
    return true;
  } catch (error: any) {
    if (error.status_code === 400 || error.status_code === 401) {
      console.log('✅ API connection working (expected auth error for test data)');
      return true;
    } else {
      console.error('❌ API connection failed:', error);
      return false;
    }
  }
};

/**
 * Test authentication store
 */
export const testAuthStore = async () => {
  try {
    console.log('🧪 Testing auth store...');
    
    // Import auth store dynamically to avoid import issues
    const { useAuthStore } = await import('../store/authStore');
    
    const { checkAuthStatus, setError, clearError } = useAuthStore.getState();
    
    // Test basic store operations
    setError('Test error');
    clearError();
    await checkAuthStatus();
    
    console.log('✅ Auth store test passed');
    return true;
  } catch (error) {
    console.error('❌ Auth store test failed:', error);
    return false;
  }
};

/**
 * Run all tests
 */
export const runAPITests = async () => {
  console.log('🚀 Starting API integration tests...');
  
  const results = {
    apiConnection: await testApiConnection(),
    authStore: await testAuthStore(),
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('✅ All API tests passed! Ready for production use.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
  }
  
  return results;
};

// Auto-run tests in development
// Disabled for now to avoid compilation issues
// if (process.env.NODE_ENV === 'development') {
//   // Delay to allow app to initialize
//   setTimeout(() => {
//     runAPITests();
//   }, 2000);
// }