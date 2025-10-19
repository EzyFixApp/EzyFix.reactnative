import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { servicesService } from '../../lib/api/services';
import type { Service, Category } from '../../types/api';

interface ServiceItemProps {
  service: Service;
  bgColor?: string;
  iconBg?: string;
  onPress?: () => void;
}

function ServiceItem({ service, bgColor, iconBg, onPress }: ServiceItemProps) {
  const formatPrice = (price: number) => {
    return `${price.toLocaleString('vi-VN')} VND`;
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

  return (
    <TouchableOpacity style={styles.serviceItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[
        styles.serviceImageContainer,
        { backgroundColor: bgColor || '#F8FAFF' }
      ]}>
        <View style={[
          styles.serviceIconOverlay,
          { backgroundColor: iconBg || '#609CEF' }
        ]} />
        <Image 
          source={service.serviceIconUrl ? { uri: service.serviceIconUrl } : getDefaultImage(service.categoryId)} 
          style={styles.serviceImage} 
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle} numberOfLines={2}>{service.serviceName}</Text>
        <Text style={styles.serviceDescription} numberOfLines={3}>{service.description}</Text>
        
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePriceLabel}>Từ</Text>
          <Text style={styles.servicePrice}>{formatPrice(service.basePrice)}</Text>
        </View>
        
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.8}>
          <Text style={styles.bookButtonText}>Đặt ngay</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

interface ServiceCategoryProps {
  title: string;
  services: Service[];
}

function ServiceCategory({ title, services }: ServiceCategoryProps) {
  const getCategoryIcon = (title: string) => {
    switch (title) {
      case 'Điện':
        return 'flash-outline';
      case 'Nước':
        return 'water-outline';
      case 'Điện lạnh':
        return 'snow-outline';
      case 'Thiết bị':
        return 'construct-outline';
      default:
        return 'construct-outline';
    }
  };

  const getCategoryColor = (title: string) => {
    switch (title) {
      case 'Điện':
        return '#F59E0B';
      case 'Nước':
        return '#06B6D4';
      case 'Điện lạnh':
        return '#06D6A0';
      case 'Thiết bị':
        return '#8B5CF6';
      default:
        return '#609CEF';
    }
  };

  const getServiceColors = (categoryId: string, index: number) => {
    const colorSets = {
      'Electrical': [
        { bgColor: '#FFF3CD', iconBg: '#F59E0B' }, // Vàng cho điện
        { bgColor: '#FFE5B4', iconBg: '#D97706' }
      ],
      'Plumbing': [
        { bgColor: '#CFFAFE', iconBg: '#06B6D4' }, // Xanh nước biển
        { bgColor: '#B0F2FF', iconBg: '#0891B2' }
      ],
      'HVAC': [
        { bgColor: '#D1FAE5', iconBg: '#06D6A0' }, // Xanh lá
        { bgColor: '#A7F3D0', iconBg: '#059669' }
      ],
      'Appliances': [
        { bgColor: '#EDE9FE', iconBg: '#8B5CF6' }, // Tím
        { bgColor: '#DDD6FE', iconBg: '#7C3AED' }
      ]
    };
    
    const colors = colorSets[categoryId as keyof typeof colorSets] || colorSets['Appliances'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <LinearGradient
          colors={[getCategoryColor(title), `${getCategoryColor(title)}CC`]}
          style={styles.categoryIconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons 
            name={getCategoryIcon(title) as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color="white" 
          />
        </LinearGradient>
        <View style={styles.categoryTitleContainer}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.categorySubtitle}>{services.length} dịch vụ có sẵn</Text>
        </View>
      </View>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => {
          const colors = getServiceColors(service.categoryId, index);
          return (
            <ServiceItem
              key={service.serviceId}
              service={service}
              bgColor={colors.bgColor}
              iconBg={colors.iconBg}
              onPress={() => {
                router.push({
                  pathname: '../customer/book-service' as any,
                  params: {
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.basePrice.toString()
                  }
                });
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function AllServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
    return Object.entries(grouped).map(([categoryId, services]) => ({
      title: getCategoryName(categoryId),
      services: services
    }));
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
            <Text style={styles.headerTitle}>Dịch vụ của chúng tôi</Text>
            <Text style={styles.headerSubtitle}>Tìm kiếm dịch vụ phù hợp với bạn</Text>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
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
        </View>

        {/* Services Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
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
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
  },
  categoryContainer: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  serviceItem: {
    flexDirection: 'column',
    backgroundColor: 'white',
    width: '47%',
    marginHorizontal: '1.5%',
    marginVertical: 8,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
    transform: [{ scale: 1 }],
  },
  serviceImageContainer: {
    width: 85,
    height: 85,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(96, 156, 239, 0.1)',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    opacity: 0.15,
  },
  serviceImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },
  serviceBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 2,
  },
  serviceContent: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '500',
    flex: 1,
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  servicePriceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginRight: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#609CEF',
  },
  bookButton: {
    backgroundColor: '#609CEF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
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
    height: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
});