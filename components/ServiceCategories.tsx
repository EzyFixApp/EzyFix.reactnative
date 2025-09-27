import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ServiceCategory {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface ServiceCategoriesProps {
  onCategoryPress?: (categoryId: string) => void;
  onViewAllPress?: () => void;
}

const defaultCategories: ServiceCategory[] = [
  {
    id: 'electronics',
    title: 'Điện Tử',
    icon: 'phone-portrait',
    color: '#609CEF',
  },
  {
    id: 'cooling',
    title: 'Điện Lạnh', 
    icon: 'snow',
    color: '#06D6A0',
  },
  {
    id: 'appliances',
    title: 'Điện Gia Dụng',
    icon: 'home',
    color: '#FF6B6B',
  },
  {
    id: 'plumbing',
    title: 'Nước & Ống',
    icon: 'water',
    color: '#4ECDC4',
  },
  {
    id: 'electrical',
    title: 'Điện Dân Dụng',
    icon: 'flash',
    color: '#FFE66D',
  },
  {
    id: 'cleaning',
    title: 'Vệ Sinh',
    icon: 'sparkles',
    color: '#A8E6CF',
  },
];

export default function ServiceCategories({ 
  onCategoryPress, 
  onViewAllPress 
}: ServiceCategoriesProps) {
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
        {defaultCategories.map((category, index) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              index >= 3 && styles.categoryItemSecondRow
            ]}
            onPress={() => onCategoryPress?.(category.id)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.iconContainer, 
              { backgroundColor: `${category.color}15` }
            ]}>
              <Ionicons 
                name={category.icon} 
                size={28} 
                color={category.color} 
              />
            </View>
            <Text style={styles.categoryTitle}>{category.title}</Text>
          </TouchableOpacity>
        ))}
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