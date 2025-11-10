import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { servicesService } from '../../lib/api/services';
import type { Service, Category } from '../../types/api';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface ServiceItemProps {
  service: Service;
  onPress?: () => void;
}

function ServiceItem({ service, onPress }: ServiceItemProps) {
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

  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.8}>
      <Image 
        source={service.serviceIconUrl ? { uri: service.serviceIconUrl } : getDefaultImage(service.categoryId)} 
        style={styles.serviceImage} 
        resizeMode="cover"
      />
      <Text style={styles.serviceName} numberOfLines={2}>{service.serviceName}</Text>
    </TouchableOpacity>
  );
}

interface ServiceCategoryProps {
  title: string;
  services: Service[];
}

function ServiceCategory({ title, services }: ServiceCategoryProps) {
  return (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <ServiceItem
            key={service.serviceId}
            service={service}
            onPress={() => {
              router.push({
                pathname: '../customer/service-detail' as any,
                params: {
                  serviceId: service.serviceId,
                }
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

function AllServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackPress = () => {
    router.back();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both services and categories in parallel
      const [servicesData, categoriesData] = await Promise.all([
        servicesService.getAllServices(),
        servicesService.getAllCategories()
      ]);
      
      setServices(servicesData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
      Alert.alert(
        'Lỗi', 
        'Không thể tải danh sách dịch vụ. Vui lòng kiểm tra kết nối internet và thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Fetch both services and categories in parallel
      const [servicesData, categoriesData] = await Promise.all([
        servicesService.getAllServices(),
        servicesService.getAllCategories()
      ]);
      
      setServices(servicesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err: any) {
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    } finally {
      setRefreshing(false);
    }
  };

  // Organize services by category using real category names
  const organizeServicesByCategory = () => {
    const grouped = services.reduce((acc, service) => {
      const categoryId = service.categoryId;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(service);
      return acc;
    }, {} as Record<string, Service[]>);

    // Map categoryId to category name from categories data
    const getCategoryName = (categoryId: string): string => {
      const category = categories.find(cat => cat.categoryId === categoryId);
      return category?.categoryName || `Danh mục ${categoryId.substring(0, 8)}...`;
    };

    // Return all categories with real category names
    const allCategories = Object.entries(grouped).map(([categoryId, services]) => ({
      title: getCategoryName(categoryId),
      services: services,
      categoryId: categoryId
    }));

    // Define custom order: Điện lạnh → Điện → Nước
    const categoryOrder = ['Điện lạnh', 'Điện', 'Nước'];
    
    // Sort categories based on custom order (by title/categoryName)
    return allCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.title);
      const indexB = categoryOrder.indexOf(b.title);
      
      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, A comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, B comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order
      return 0;
    });
  };

  // Filter services based on search query
  const filteredCategories = organizeServicesByCategory().map(category => ({
    ...category,
    services: category.services.filter(service => 
      service.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.services.length > 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm kiếm dịch vụ</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Services Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#609CEF']}
              tintColor="#609CEF"
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#609CEF" />
              <Text style={styles.loadingText}>Đang tải dịch vụ...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.errorText}>Đã xảy ra lỗi</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <ServiceCategory
                key={index}
                title={category.title}
                services={category.services}
              />
            ))
          ) : searchQuery ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Không tìm thấy dịch vụ</Text>
              <Text style={styles.emptySubtext}>
                Hãy thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Chưa có dịch vụ</Text>
              <Text style={styles.emptySubtext}>
                Danh sách dịch vụ sẽ được cập nhật sớm
              </Text>
            </View>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '31%',
    alignItems: 'center',
    marginBottom: 24,
  },
  serviceImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default withCustomerAuth(AllServices, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});