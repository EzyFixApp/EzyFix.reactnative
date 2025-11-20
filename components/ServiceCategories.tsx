import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { servicesService } from '../lib/api/services';
import type { Category } from '../types/api';

interface ServiceCategoriesProps {
  onCategoryPress?: (categoryId: string) => void;
  onViewAllPress?: () => void;
}

// Icon mapping for categories
const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();
  if (name.includes('điện tử') || name.includes('electronic')) return 'phone-portrait';
  if (name.includes('điện lạnh') || name.includes('cooling')) return 'snow';
  if (name.includes('điện gia dụng') || name.includes('appliance')) return 'home';
  if (name.includes('nước') || name.includes('ống') || name.includes('plumb')) return 'water';
  if (name.includes('điện dân dụng') || name.includes('electrical')) return 'flash';
  if (name.includes('vệ sinh') || name.includes('clean')) return 'sparkles';
  return 'construct-outline'; // Default icon
};

// Color mapping for categories
const getCategoryColor = (index: number): string => {
  const colors = ['#609CEF', '#06D6A0', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];
  return colors[index % colors.length];
};

export default function ServiceCategories({ 
  onCategoryPress, 
  onViewAllPress 
}: ServiceCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await servicesService.getAllCategories();
      setCategories(data);
      if (__DEV__) console.log('✅ [ServiceCategories] Loaded categories:', data.length);
    } catch (error) {
      console.error('❌ [ServiceCategories] Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>Đang tải danh mục...</Text>
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    return null; // Hide if no categories
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sự cố bạn gặp phải</Text>
          <Text style={styles.subtitle}>Chọn loại sự cố để được hỗ trợ nhanh nhất</Text>
        </View>
        <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Categories Grid - 2 rows x 3 columns */}
      <View style={styles.categoriesContainer}>
        {categories.slice(0, 6).map((category, index) => {
          const icon = getCategoryIcon(category.categoryName);
          const color = getCategoryColor(index);
          
          return (
            <TouchableOpacity
              key={category.categoryId}
              style={[
                styles.categoryItem,
                index >= 3 && styles.categoryItemSecondRow
              ]}
              onPress={() => onCategoryPress?.(category.categoryId)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconContainer, 
                { backgroundColor: `${color}15` }
              ]}>
                <Ionicons 
                  name={icon} 
                  size={28} 
                  color={color} 
                />
              </View>
              <Text style={styles.categoryTitle}>{category.categoryName}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#609CEF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryItemSecondRow: {
    marginBottom: 0,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    // Removed white background and shadows - only category color background
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
  },
});