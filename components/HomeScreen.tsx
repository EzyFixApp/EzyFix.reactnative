import * as React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleThoPress = () => {
    // Navigation to technician/worker login flow
    console.log('Tôi là thợ pressed');
    router.push('./technician/login');
  };

  const handleKhachHangPress = () => {
    // Navigation to customer flow  
    console.log('Tôi là khách hàng pressed');
    router.push('./customer/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Main Content Container */}
      <View style={styles.mainContent}>
        
        {/* Logo Section */}
        <View style={styles.logoSection}>
          {/* EzyFix Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>EF</Text>
            </View>
          </View>
          
          {/* App Name */}
          <Text style={styles.appName}>EZYFIX</Text>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          
          {/* Greeting Text */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Xin chào !</Text>
            <Text style={styles.greetingSubtitle}>
              Vui lòng chọn vai trò của bạn:
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            
            {/* Tôi là thợ Button */}
            <TouchableOpacity
              onPress={handleThoPress}
              style={styles.primaryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                Tôi là thợ
              </Text>
            </TouchableOpacity>

            {/* Tôi là khách hàng Button */}
            <TouchableOpacity
              onPress={handleKhachHangPress}
              style={styles.secondaryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                Tôi là khách hàng
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>

      </View>

      {/* Bottom Home Indicator */}
      <View style={styles.bottomIndicator}>
        <View style={styles.homeIndicator} />
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 128,
    height: 128,
    backgroundColor: '#dbeafe',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoInner: {
    width: 80,
    height: 80,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appName: {
    color: '#60a5fa',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  welcomeCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  greetingSection: {
    marginBottom: 32,
  },
  greetingTitle: {
    color: '#1f2937',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  greetingSubtitle: {
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#374151',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomIndicator: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  homeIndicator: {
    width: 128,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
});