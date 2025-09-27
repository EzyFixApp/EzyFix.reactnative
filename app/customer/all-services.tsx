import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

interface ServiceItemProps {
  title: string;
  description: string;
  price: string;
  imageSource: any;
  bgColor?: string;
  iconBg?: string;
  onPress?: () => void;
}

function ServiceItem({ title, description, price, imageSource, bgColor, iconBg, onPress }: ServiceItemProps) {
  return (
    <TouchableOpacity style={styles.serviceItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[
        styles.serviceImageContainer,
        { backgroundColor: bgColor || '#F8FAFF' }
      ]}>
        {iconBg && (
          <View style={[
            styles.serviceIconOverlay,
            { backgroundColor: iconBg }
          ]} />
        )}
        <Image source={imageSource} style={styles.serviceImage} />
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceTitle}>{title}</Text>
        <Text style={styles.serviceDescription}>{description}</Text>
        <Text style={styles.servicePrice}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

interface ServiceCategoryProps {
  title: string;
  services: {
    title: string;
    description: string;
    price: string;
    imageSource: any;
    bgColor?: string;
    iconBg?: string;
  }[];
}

function ServiceCategory({ title, services }: ServiceCategoryProps) {
  const getCategoryIcon = (title: string) => {
    switch (title) {
      case 'Điện lạnh':
        return 'snow-outline';
      case 'Nước':
        return 'water-outline';
      default:
        return 'construct-outline';
    }
  };

  const getCategoryColor = (title: string) => {
    switch (title) {
      case 'Điện lạnh':
        return '#06D6A0';
      case 'Nước':
        return '#4ECDC4';
      default:
        return '#609CEF';
    }
  };

  return (
    <View style={styles.categoryContainer}>
      <View style={styles.categoryHeader}>
        <View style={[
          styles.categoryIconContainer, 
          { backgroundColor: `${getCategoryColor(title)}15` }
        ]}>
          <Ionicons 
            name={getCategoryIcon(title) as keyof typeof Ionicons.glyphMap} 
            size={24} 
            color={getCategoryColor(title)} 
          />
        </View>
        <Text style={styles.categoryTitle}>{title}</Text>
      </View>
      <View style={styles.servicesGrid}>
        {services.map((service, index) => (
          <ServiceItem
            key={index}
            title={service.title}
            description={service.description}
            price={service.price}
            imageSource={service.imageSource}
            bgColor={service.bgColor}
            iconBg={service.iconBg}
            onPress={() => {
              console.log(`Selected: ${service.title}`);
              router.push({
                pathname: '../customer/book-service' as any,
                params: {
                  serviceName: service.title,
                  servicePrice: service.price
                }
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function AllServices() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleBackPress = () => {
    router.back();
  };

  // Service data organized by category
  const serviceCategories = [
    {
      title: 'Điện lạnh',
      services: [
        {
          title: 'Vệ sinh máy lạnh',
          description: 'Vệ sinh toàn bộ hệ thống máy lạnh',
          price: 'từ 150,000 VND',
          imageSource: require('../../assets/airconditionerrepair.png'),
          bgColor: '#f39a2d',
          iconBg: '#FF8C42'
        },
        {
          title: 'Sửa chữa máy lạnh',
          description: 'Sửa chữa các lỗi máy lạnh',
          price: 'từ 350,000 VND',
          imageSource: require('../../assets/airconditionerrepair.png'),
          bgColor: '#47a6eb', // Xanh dương cho sửa chữa
          iconBg: '#2196F3'
        },
        {
          title: 'Vệ sinh tủ lạnh',
          description: 'Vệ sinh và bảo dưỡng tủ lạnh',
          price: 'từ 250,000 VND',
          imageSource: require('../../assets/repairrefrigerator.png'),
          bgColor: '#f39a2d', // Cam đậm hơn cho vệ sinh
          iconBg: '#FF8C42'
        },
        {
          title: 'Sửa chữa tủ lạnh',
          description: 'Sửa chữa các lỗi tủ lạnh',
          price: 'từ 250,000 VND',
          imageSource: require('../../assets/repairrefrigerator.png'),
          bgColor: '#47a6eb', // Xanh dương cho sửa chữa
          iconBg: '#2196F3'
        }
      ]
    },
    {
      title: 'Nước',
      services: [
        {
          title: 'Sửa ống nước',
          description: 'Sửa chữa đường ống nước bị rò rỉ',
          price: 'từ 150,000 VND',
          imageSource: require('../../assets/plumbingrepair.png'),
          bgColor: '#47a6eb', // Xanh dương cho sửa chữa
          iconBg: '#2196F3'
        },
        {
          title: 'Thông cống',
          description: 'Thông tắc cống, đường ống thoát nước',
          price: 'từ 350,000 VND',
          imageSource: require('../../assets/plumbingrepair.png'),
          bgColor: '#a9e7dc', // Xanh lá mint cho thông cống
          iconBg: '#10B981'
        },
        {
          title: 'Sửa vòi nước',
          description: 'Sửa chữa, thay thế vòi nước',
          price: 'từ 100,000 VND',
          imageSource: require('../../assets/plumbingrepair.png'),
          bgColor: '#47a6eb', // Xanh dương cho sửa chữa
          iconBg: '#2196F3'
        },
        {
          title: 'Lắp đặt thiết bị',
          description: 'Lắp đặt thiết bị vệ sinh, ống nước',
          price: 'từ 200,000 VND',
          imageSource: require('../../assets/plumbingrepair.png'),
          bgColor: '#d9c1f3', // Tím nhạt cho lắp đặt
          iconBg: '#A855F7'
        }
      ]
    }
  ];

  const filteredCategories = serviceCategories.map(category => ({
    ...category,
    services: category.services.filter(service => 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <ServiceCategory
                key={index}
                title={category.title}
                services={category.services}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Không tìm thấy dịch vụ</Text>
              <Text style={styles.emptySubtext}>
                Hãy thử tìm kiếm với từ khóa khác
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.3,
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
    padding: 18,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  serviceImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(96, 156, 239, 0.1)',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  serviceIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    opacity: 0.1,
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  serviceContent: {
    alignItems: 'center',
    width: '100%',
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
    textAlign: 'center',
    minHeight: 36,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#609CEF',
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    textAlign: 'center',
    overflow: 'hidden',
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
});