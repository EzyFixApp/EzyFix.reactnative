import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../lib/services/notificationService';

export default function TestNotificationScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(message);
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
      addLog(`✅ Permission status: ${status}`);
      Alert.alert('Trạng thái quyền', `Status: ${status}`);
    } catch (error: any) {
      addLog(`❌ Error checking permissions: ${error.message}`);
    }
  };

  const requestPermissions = async () => {
    try {
      addLog('📲 Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      addLog(`✅ Permission granted: ${status}`);
      Alert.alert('Kết quả', `Permission: ${status}`);
    } catch (error: any) {
      addLog(`❌ Error requesting permissions: ${error.message}`);
      Alert.alert('Lỗi', error.message);
    }
  };

  const sendSimpleNotification = async () => {
    try {
      addLog('🔔 Sending simple notification...');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'Đây là notification test đơn giản!',
          data: { test: true },
        },
        trigger: null, // Show immediately
      });

      addLog(`✅ Notification sent! ID: ${notificationId}`);
      Alert.alert('Thành công', `Đã gửi notification: ${notificationId}`);
    } catch (error: any) {
      addLog(`❌ Error sending notification: ${error.message}`);
      Alert.alert('Lỗi', error.message);
    }
  };

  const sendNotificationWithChannel = async () => {
    try {
      addLog('🔔 Sending notification with channel...');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test với Channel',
          body: 'Notification này sử dụng order-updates channel',
          data: { test: true },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });

      addLog(`✅ Notification with channel sent! ID: ${notificationId}`);
      Alert.alert('Thành công', `Đã gửi: ${notificationId}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      Alert.alert('Lỗi', error.message);
    }
  };

  const initializeService = async () => {
    try {
      addLog('🚀 Initializing notification service...');
      await notificationService.initialize();
      addLog('✅ Service initialized!');
      Alert.alert('Thành công', 'Notification service đã khởi tạo!');
    } catch (error: any) {
      addLog(`❌ Error initializing: ${error.message}`);
      Alert.alert('Lỗi', error.message);
    }
  };

  const testOrderNotification = async () => {
    try {
      addLog('📦 Testing order notification...');
      const result = await notificationService.notifyOrderAccepted(
        'test-123',
        'Sửa điện thoại',
        'Nguyễn Văn A'
      );
      addLog(`✅ Order notification sent! ID: ${result}`);
      Alert.alert('Thành công', `Notification ID: ${result}`);
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
      Alert.alert('Lỗi', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">🧪 Test Notifications</Text>
        
        <View className="mb-4 p-4 bg-blue-100 rounded-lg">
          <Text className="text-sm font-semibold">Trạng thái quyền:</Text>
          <Text className="text-lg font-bold text-blue-600">{permissionStatus}</Text>
        </View>

        <View className="space-y-3">
          <TouchableOpacity
            onPress={checkPermissions}
            className="bg-blue-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              1. Kiểm tra quyền thông báo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={requestPermissions}
            className="bg-green-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              2. Yêu cầu quyền thông báo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={initializeService}
            className="bg-purple-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              3. Khởi tạo Notification Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={sendSimpleNotification}
            className="bg-orange-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              4. Gửi notification đơn giản
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={sendNotificationWithChannel}
            className="bg-pink-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              5. Gửi notification với channel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={testOrderNotification}
            className="bg-red-500 p-4 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              6. Test Order Notification
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6">
          <Text className="text-lg font-bold mb-2">📋 Logs:</Text>
          <View className="bg-gray-900 p-3 rounded-lg">
            {logs.length === 0 ? (
              <Text className="text-gray-400">Chưa có logs...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} className="text-xs text-green-400 mb-1">
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
