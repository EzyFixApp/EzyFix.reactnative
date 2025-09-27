import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

interface TechnicianCardProps {
  id: string;
  name: string;
  service: string;
  location: string;
  rating: number;
  completedJobs: number;
  avatar: string;
  onRemove: (id: string) => void;
}

function TechnicianCard({ id, name, service, location, rating, completedJobs, avatar, onRemove }: TechnicianCardProps) {
  return (
    <View style={styles.technicianCard}>
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.technicianInfo}>
          <Text style={styles.technicianName}>{name}</Text>
          <Text style={styles.serviceType}>{service}</Text>
          <Text style={styles.location}>{location}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingScore}>{rating}</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(rating) ? "star" : "star-outline"}
                    size={12}
                    color="#FFA500"
                    style={styles.star}
                  />
                ))}
              </View>
            </View>
            
            <Text style={styles.completedJobs}>{completedJobs} việc hoàn thành</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        onPress={() => onRemove(id)}
        style={styles.removeButton}
      >
        <Ionicons name="trash-outline" size={20} color="#FF4757" />
      </TouchableOpacity>
    </View>
  );
}

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function FavoriteTechnicians() {
  const [technicians, setTechnicians] = useState([
    {
      id: '1',
      name: 'Lê Văn Long',
      service: 'ĐIỆN LẠNH',
      location: 'Quận 1, TPHCM',
      rating: 4.9,
      completedJobs: 127,
      avatar: 'L'
    },
    {
      id: '2',
      name: 'Trần Minh Tuấn',
      service: 'SỬA CHỮA ĐIỆN',
      location: 'Quận 7, TPHCM',
      rating: 4.7,
      completedJobs: 89,
      avatar: 'T'
    }
  ]);

  const handleBackPress = () => {
    router.back();
  };

  const handleRemoveTechnician = (id: string) => {
    setTechnicians(prev => prev.filter(tech => tech.id !== id));
  };

  const favoriteCount = technicians.length;
  const averageRating = technicians.length > 0 
    ? (technicians.reduce((sum, tech) => sum + tech.rating, 0) / technicians.length).toFixed(1)
    : '0';
  const totalJobs = technicians.reduce((sum, tech) => sum + tech.completedJobs, 0);

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
            <Text style={styles.headerTitle}>Thợ Yêu Thích</Text>
            <Text style={styles.headerSubtitle}>Danh sách thợ đã lưu</Text>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <StatCard number={favoriteCount.toString()} label="ĐÃ LƯU" />
              <StatCard number={averageRating} label="ĐÁNH GIÁ TB" />
              <StatCard number={totalJobs.toString()} label="ƯY TÍN TB" />
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {technicians.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Chưa có thợ yêu thích</Text>
              <Text style={styles.emptySubtitle}>
                Hãy lưu những thợ ưa thích để dễ dàng liên hệ lại
              </Text>
            </View>
          ) : (
            <>
              {technicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  id={technician.id}
                  name={technician.name}
                  service={technician.service}
                  location={technician.location}
                  rating={technician.rating}
                  completedJobs={technician.completedJobs}
                  avatar={technician.avatar}
                  onRemove={handleRemoveTechnician}
                />
              ))}
            </>
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
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  technicianCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 12,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    marginRight: 4,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  star: {
    marginLeft: 1,
  },
  completedJobs: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
});