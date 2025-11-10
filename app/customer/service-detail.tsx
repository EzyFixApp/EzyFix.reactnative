import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { servicesService } from '../../lib/api/services';
import type { Service } from '../../types/api';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

function ServiceDetail() {
  const params = useLocalSearchParams();
  const { serviceId } = params;
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetail();
    }
  }, [serviceId]);

  const fetchServiceDetail = async () => {
    try {
      setLoading(true);
      const serviceData = await servicesService.getServiceById(serviceId as string);
      setService(serviceData);
    } catch (error) {
      console.error('Error fetching service detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleBookService = () => {
    if (service) {
      router.push({
        pathname: '../customer/book-service' as any,
        params: {
          serviceId: service.serviceId,
          serviceName: service.serviceName,
          servicePrice: service.basePrice.toString()
        }
      });
    }
  };

  const getDefaultImage = (categoryId: string) => {
    switch (categoryId) {
      case 'HVAC':
        return require('../../assets/airconditionerrepair.png');
      case 'Plumbing':
        return require('../../assets/plumbingrepair.png');
      default:
        return require('../../assets/airconditionerrepair.png');
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </>
    );
  }

  if (!service) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Không tìm thấy dịch vụ</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin dịch vụ</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Service Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={service.serviceIconUrl ? { uri: service.serviceIconUrl } : getDefaultImage(service.categoryId)} 
              style={styles.serviceImage} 
              resizeMode="contain"
            />
          </View>

          {/* Service Name */}
          <Text style={styles.serviceName}>{service.serviceName}</Text>

          {/* Description */}
          {service.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Mô tả</Text>
              <Text style={styles.descriptionText}>{service.description}</Text>
            </View>
          )}

          {/* Price Info */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá khởi điểm</Text>
            <Text style={styles.priceValue}>
              {service.basePrice.toLocaleString('vi-VN')} VND
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Book Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookService} activeOpacity={0.8}>
            <Text style={styles.bookButtonText}>Đặt ngay</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 50,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 40,
  },
  serviceImage: {
    width: 280,
    height: 280,
    borderRadius: 20,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'justify',
  },
  priceContainer: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#609CEF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bookButton: {
    backgroundColor: '#609CEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
});

export default withCustomerAuth(ServiceDetail, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
