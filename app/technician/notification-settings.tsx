import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

interface NotificationSettingProps {
  id: string;
  title: string;
  description: string;
  isEnabled: boolean;
  onToggle: (id: string) => void;
}

function NotificationSetting({ id, title, description, isEnabled, onToggle }: NotificationSettingProps) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={isEnabled}
        onValueChange={() => onToggle(id)}
        trackColor={{ false: '#E5E7EB', true: '#609CEF' }}
        thumbColor={isEnabled ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TechnicianNotificationSettings() {
  const [settings, setSettings] = useState([
    {
      id: 'push_notifications',
      title: 'Thông báo đẩy',
      description: 'Nhận thông báo trực tiếp trên thiết bị',
      isEnabled: true
    },
    {
      id: 'job_updates',
      title: 'Cập nhật đơn hàng',
      description: 'Thông báo về trạng thái đơn hàng và kỹ thuật viên',
      isEnabled: true
    },
    {
      id: 'promotions',
      title: 'Khuyến mãi & Ưu đãi',
      description: 'Nhận thông báo về các chương trình khuyến mãi',
      isEnabled: false
    },
    {
      id: 'system_notifications',
      title: 'Thông báo hệ thống',
      description: 'Cập nhật ứng dụng và bảo trì hệ thống',
      isEnabled: true
    },
    {
      id: 'email_notifications',
      title: 'Thông báo Email',
      description: 'Nhận thông báo qua email',
      isEnabled: false
    }
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleToggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, isEnabled: !setting.isEnabled }
          : setting
      )
    );
  };

  const handleTurnOnAll = () => {
    setSettings(prev => 
      prev.map(setting => ({ ...setting, isEnabled: true }))
    );
  };

  const handleTurnOffAll = () => {
    setSettings(prev => 
      prev.map(setting => ({ ...setting, isEnabled: false }))
    );
  };

  const handleResetDefault = () => {
    setSettings([
      {
        id: 'push_notifications',
        title: 'Thông báo đẩy',
        description: 'Nhận thông báo trực tiếp trên thiết bị',
        isEnabled: true
      },
      {
        id: 'job_updates',
        title: 'Cập nhật đơn hàng',
        description: 'Thông báo về trạng thái đơn hàng và kỹ thuật viên',
        isEnabled: true
      },
      {
        id: 'promotions',
        title: 'Khuyến mãi & Ưu đãi',
        description: 'Nhận thông báo về các chương trình khuyến mãi',
        isEnabled: false
      },
      {
        id: 'system_notifications',
        title: 'Thông báo hệ thống',
        description: 'Cập nhật ứng dụng và bảo trì hệ thống',
        isEnabled: true
      },
      {
        id: 'email_notifications',
        title: 'Thông báo Email',
        description: 'Nhận thông báo qua email',
        isEnabled: false
      }
    ]);
  };

  const enabledCount = settings.filter(setting => setting.isEnabled).length;
  const totalCount = settings.length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
            <Text style={styles.headerSubtitle}>Quản lý thông báo kỹ thuật viên</Text>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <StatCard number={enabledCount.toString()} label="BẬT" />
              <StatCard number={(totalCount - enabledCount).toString()} label="TẮT" />
              <StatCard number={totalCount.toString()} label="TỔNG CỘNG" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt thông báo</Text>
            
            {settings.map((setting) => (
              <NotificationSetting
                key={setting.id}
                {...setting}
                onToggle={handleToggleSetting}
              />
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.quickActionsTitle}>Thao tác nhanh</Text>
            
            <TouchableOpacity 
              onPress={handleTurnOnAll}
              style={[styles.quickActionButton, styles.enableAllButton]}
            >
              <Text style={styles.enableAllText}>Bật tất cả thông báo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleTurnOffAll}
              style={[styles.quickActionButton, styles.disableAllButton]}
            >
              <Text style={styles.disableAllText}>Tắt tất cả thông báo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleResetDefault}
              style={[styles.quickActionButton, styles.resetButton]}
            >
              <Text style={styles.resetText}>Khôi phục mặc định</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  quickActions: {
    paddingHorizontal: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enableAllButton: {
    borderColor: '#baf1df',
    backgroundColor: '#F0FDF4',
  },
  enableAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5dcca7',
  },
  disableAllButton: {
    borderColor: '#f0c0c0',
    backgroundColor: '#FEF2F2',
  },
  disableAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#db9191',
  },
  resetButton: {
    borderColor: '#d0dbeb',
    backgroundColor: '#F0F8FF',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94b5e2',
  },
  bottomSpacing: {
    height: 80,
  },
});