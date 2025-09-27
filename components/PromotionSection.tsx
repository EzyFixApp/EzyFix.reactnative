import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PromotionCardProps {
  discount: string;
  title: string;
  description: string;
  code: string;
  expiryDate: string;
  onApplyPress?: () => void;
}

export default function PromotionCard({ 
  discount, 
  title, 
  description, 
  code, 
  expiryDate,
  onApplyPress 
}: PromotionCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.discountGradient}
          >
            <Text style={styles.discountText}>{discount}</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Mã:</Text>
            <Text style={styles.code}>{code}</Text>
          </View>
          <Text style={styles.expiry}>Hết hạn: {expiryDate}</Text>
        </View>

        {/* Apply Button */}
        <TouchableOpacity 
          onPress={onApplyPress}
          style={styles.applyButton}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>Áp dụng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface PromotionSectionProps {
  promotions?: PromotionCardProps[];
  onViewAllPress?: () => void;
}

export function PromotionSection({ 
  promotions = [
    {
      discount: '-50K',
      title: 'Ưu đãi mùa hè',
      description: 'Giảm 50.000đ cho đơn từ 300K',
      code: 'SUMMER',
      expiryDate: '31/12',
      onApplyPress: () => console.log('Apply summer promotion'),
    }
  ],
  onViewAllPress 
}: PromotionSectionProps) {
  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Ưu đãi</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <View style={styles.expandIcon}>
            <Text style={styles.expandText}>⌄</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Promotions List */}
      {promotions.map((promotion, index) => (
        <PromotionCard
          key={index}
          {...promotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Section Styles
  sectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  expandIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },

  // Card Styles
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  discountBadge: {
    marginRight: 16,
  },
  discountGradient: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginRight: 4,
  },
  code: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
  expiry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  applyButton: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});