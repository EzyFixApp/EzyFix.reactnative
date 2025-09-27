import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import BottomNavigation from './BottomNavigation';

export default function DarkThemeExample() {
  const [activeTab, setActiveTab] = useState('home');

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    console.log('Tab pressed:', tabId);
  };

  const handleLogoPress = () => {
    console.log('Logo pressed - show main menu');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Main Content Area - Dark Theme */}
      <View style={styles.content}>
        {/* Your dark theme content here */}
      </View>

      {/* Bottom Navigation with Dark Theme */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onLogoPress={handleLogoPress}
        theme="dark"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937', // Dark background like in image 1
  },
  content: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
});