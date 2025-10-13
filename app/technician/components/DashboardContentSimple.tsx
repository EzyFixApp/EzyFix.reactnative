import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DashboardContentProps {
  currentTime: Date;
  formatTime: () => string;
  formatDate: () => string;
}

export default function DashboardContent({ currentTime, formatTime, formatDate }: DashboardContentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard Content</Text>
      <Text style={styles.time}>Thời gian: {formatTime()}</Text>
      <Text style={styles.date}>Ngày: {formatDate()}</Text>
      <Text style={styles.status}>Đang hoạt động bình thường</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  time: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
});