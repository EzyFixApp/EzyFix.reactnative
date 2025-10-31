/**
 * Review Modal Component
 * Allows customers to rate and review technicians after service completion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { reviewService, ReviewResponse } from '../lib/api/reviews';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onReviewSubmit: () => void;
  appointmentId: string;
  providerId: string;
  technicianName: string;
  serviceName: string;
  existingReview?: ReviewResponse | null; // If provided, show read-only view
}

export default function ReviewModal({
  visible,
  onClose,
  onReviewSubmit,
  appointmentId,
  providerId,
  technicianName,
  serviceName,
  existingReview,
}: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.ratingOverall || 5);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  
  // Read-only mode when existingReview is provided
  const isReadOnly = !!existingReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!comment.trim()) {
      alert('Vui lòng nhập nhận xét');
      return;
    }

    try {
      setSubmitting(true);

      await reviewService.createReview({
        appointmentId,
        providerId,
        ratingOverall: rating,
        comment: comment.trim(),
      });

      console.log('✅ Review submitted successfully');
      
      // Reset form
      setRating(5);
      setComment('');
      
      // Notify parent and close
      onReviewSubmit();
      onClose();
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      
      // Check if review already exists
      if (error.status_code === 400 || error.status_code === 409 || 
          error.message?.includes('already') || error.message?.includes('exists')) {
        alert('Bạn đã đánh giá đơn hàng này rồi.');
      } else {
        alert(error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => !isReadOnly && setRating(star)}
            activeOpacity={isReadOnly ? 1 : 0.7}
            style={styles.starButton}
            disabled={isReadOnly}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={40}
              color={star <= rating ? '#FFB800' : '#E5E7EB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isReadOnly ? 'Đánh giá của bạn' : 'Đánh giá dịch vụ'}
              </Text>
              <Text style={styles.subtitle}>
                {isReadOnly 
                  ? `Đánh giá cho ${technicianName}` 
                  : `Chia sẻ trải nghiệm của bạn với ${technicianName}`
                }
              </Text>
            </View>

            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>Dịch vụ</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>

            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đánh giá chất lượng</Text>
              {renderStars()}
              <Text style={styles.ratingText}>
                {rating === 5 && 'Xuất sắc! ⭐'}
                {rating === 4 && 'Rất tốt! 👍'}
                {rating === 3 && 'Tốt 😊'}
                {rating === 2 && 'Khá 🙂'}
                {rating === 1 && 'Cần cải thiện 😕'}
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nhận xét chi tiết</Text>
              <TextInput
                style={[styles.commentInput, isReadOnly && styles.commentInputReadOnly]}
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={500}
                editable={!isReadOnly}
              />
              {!isReadOnly && (
                <Text style={styles.characterCount}>
                  {comment.length}/500 ký tự
                </Text>
              )}
              {isReadOnly && existingReview && (
                <Text style={styles.reviewDate}>
                  Đánh giá vào:{' '}
                  {new Date(existingReview.reviewDate).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {isReadOnly ? (
                // Read-only mode: Only show Close button
                <TouchableOpacity
                  style={[styles.cancelButton, styles.closeButtonFull]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, styles.closeButtonText]}>Đóng</Text>
                </TouchableOpacity>
              ) : (
                // Edit mode: Show Cancel and Submit buttons
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#609CEF', '#3B82F6']}
                      style={styles.submitGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                          <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  serviceInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
  },
  commentInputReadOnly: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    color: '#475569',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonFull: {
    backgroundColor: '#609CEF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  closeButtonText: {
    color: '#FFFFFF',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
