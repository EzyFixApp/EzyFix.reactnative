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
    icon: 'phone-portrait-outline',
    color: '#609CEF',
  },
  {
    id: 'cooling',
    title: 'Điện Lạnh', 
    icon: 'snow-outline',
    color: '#609CEF',
  },
  {
    id: 'appliances',
    title: 'Điện Gia Dụng',
    icon: 'home-outline',
    color: '#609CEF',
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
        <Text style={styles.title}>Sự cố bạn gặp phải</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>Xem thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Grid */}
      <View style={styles.categoriesContainer}>
        {defaultCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => onCategoryPress?.(category.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <Ionicons 
                name={category.icon} 
                size={32} 
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
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
});