import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { serviceRequestService } from '../../lib/api';
import { useAuth } from '../../store/authStore';
import type { ServiceRequestData } from '../../types/api';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import CustomModal from '../../components/CustomModal';

interface DaySlot {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfWeek: string;
  dayNumber: number;
  isToday: boolean;
  isTomorrow: boolean;
}

interface TimeSlot {
  value: string; // HH:mm format
  hour: number;
  minute: number;
  available: boolean;
}

function SelectSchedule() {
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // Parse params - getting all booking data from previous screen
  const bookingData = {
    customerName: params.customerName as string,
    phoneNumber: params.phoneNumber as string,
    serviceName: params.serviceName as string,
    serviceId: params.serviceId as string,
    servicePrice: params.servicePrice as string,
    serviceDescription: params.serviceDescription as string,
    address: params.address as string,
    addressID: params.addressID as string,
    addressNote: params.addressNote as string,
    mediaUrls: params.mediaUrls ? JSON.parse(params.mediaUrls as string) : []
  };

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTimeValue, setPickerTimeValue] = useState<Date>(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  
  // Custom Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAutoClose, setModalAutoClose] = useState(false);

  // Get current Vietnam time (UTC+7)
  const getVietnamDate = (): Date => {
    return new Date(); // React Native uses device local time
  };

  // Generate 7 days from today (skip today if after 23:00)
  const generateDaySlots = (): DaySlot[] => {
    const today = getVietnamDate();
    const currentHour = today.getHours();
    const daySlots: DaySlot[] = [];
    
    // Nếu sau 23h thì bỏ hôm nay, bắt đầu từ ngày mai
    const startIndex = currentHour >= 23 ? 1 : 0;

    for (let i = startIndex; i < startIndex + 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
      const dateString = date.toISOString().split('T')[0];
      
      daySlots.push({
        date,
        dateString,
        dayOfWeek,
        dayNumber: date.getDate(),
        isToday: i === 0 && startIndex === 0,
        isTomorrow: i === 1 && startIndex === 0
      });
    }

    return daySlots;
  };

  const daySlots = useMemo(() => generateDaySlots(), []);

  // Get month range display (e.g., "Tháng 10/2025" or "Tháng 10-11/2025")
  const getMonthRangeDisplay = (): string => {
    const firstDay = daySlots[0].date;
    const lastDay = daySlots[daySlots.length - 1].date;
    
    const firstMonth = firstDay.getMonth() + 1;
    const lastMonth = lastDay.getMonth() + 1;
    const year = firstDay.getFullYear();

    if (firstMonth === lastMonth) {
      return `Tháng ${firstMonth}/${year}`;
    } else {
      return `Tháng ${firstMonth}-${lastMonth}/${year}`;
    }
  };

  // Check if a time is available based on current time and selected date
  const isTimeAvailable = (hour: number, minute: number): boolean => {
    if (!selectedDate) return false;

    const now = getVietnamDate();
    const selectedDateObj = new Date(selectedDate);
    const isSelectedToday = selectedDateObj.toDateString() === now.toDateString();

    if (!isSelectedToday) return true; // All times available for future dates

    // Rule: Only allow booking 1 hour from now
    const slotTime = new Date(now);
    slotTime.setHours(hour, minute, 0, 0);
    
    const oneHourFromNow = new Date(now);
    oneHourFromNow.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);

    return slotTime >= oneHourFromNow;
  };

  // Phân tích giờ cao điểm (thị trường Việt Nam)
  const isPeakHour = (): boolean => {
    if (!selectedDate || !selectedTime) return false;

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay(); // 0 = CN, 6 = T7
    const [hours] = selectedTime.split(':').map(Number);

    // Cuối tuần (Thứ 7 & Chủ nhật): Giờ cao điểm cả ngày 8h-20h
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return hours >= 8 && hours <= 20;
    }

    // Ngày thường: Giờ cao điểm sáng 7h-10h và chiều 17h-20h
    const isMorningPeak = hours >= 7 && hours <= 10;
    const isEveningPeak = hours >= 17 && hours <= 20;
    
    return isMorningPeak || isEveningPeak;
  };

  const showPeakHourWarning = useMemo(() => isPeakHour(), [selectedDate, selectedTime]);

  // Auto-select today on mount
  useEffect(() => {
    if (daySlots.length > 0) {
      setSelectedDate(daySlots[0].dateString);
    }
  }, []);

  const handleDaySelect = (dateString: string) => {
    setSelectedDate(dateString);
    setSelectedTime(''); // Reset time when date changes
  };

  const showAlertModal = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalAutoClose(true); // Always auto-close for non-confirm modals
    setShowModal(true);
  };

  const handleOpenTimePicker = () => {
    if (!selectedDate) {
      showAlertModal('info', 'Thông báo', 'Vui lòng chọn ngày trước');
      return;
    }

    // Set initial time based on current selection or minimum available time
    if (selectedTime) {
      // Nếu đã có giờ được chọn, dùng giờ đó
      const [hours, minutes] = selectedTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setPickerTimeValue(date);
    } else {
      // Chưa chọn giờ -> set về giờ khả dụng đầu tiên
      const now = getVietnamDate();
      const selectedDateObj = new Date(selectedDate);
      const isSelectedToday = selectedDateObj.toDateString() === now.toDateString();
      
      if (isSelectedToday) {
        // Hôm nay: phải ít nhất 1 tiếng sau
        const oneHourFromNow = new Date(now);
        oneHourFromNow.setHours(now.getHours() + 1);
        // Round up minutes to nearest 5
        const minutes = Math.ceil(oneHourFromNow.getMinutes() / 5) * 5;
        oneHourFromNow.setMinutes(minutes, 0, 0);
        setPickerTimeValue(oneHourFromNow);
      } else {
        // Ngày sau: mặc định 9:00 AM
        const date = new Date();
        date.setHours(9, 0, 0, 0);
        setPickerTimeValue(date);
      }
    }
    
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, newTime?: Date) => {
    if (!newTime) return;

    // iOS: Luôn update pickerTimeValue khi user scroll
    // Android: Chỉ update khi user bấm OK
    if (Platform.OS === 'ios') {
      setPickerTimeValue(newTime);
    } else if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set') {
        const hours = newTime.getHours();
        const minutes = newTime.getMinutes();
        
        // Check if time is available
        if (isTimeAvailable(hours, minutes)) {
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          setSelectedTime(timeString);
        } else {
          showAlertModal('warning', 'Thời gian không khả dụng', 'Vui lòng chọn thời gian ít nhất 1 tiếng kể từ bây giờ');
        }
      }
    }
  };

  const handleCloseTimePicker = () => {
    setShowTimePicker(false);
    // Reset về thời gian đã chọn trước đó nếu có
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setPickerTimeValue(date);
    }
  };

  const handleConfirmTimePicker = () => {
    const hours = pickerTimeValue.getHours();
    const minutes = pickerTimeValue.getMinutes();
    
    // Validate time availability
    if (!isTimeAvailable(hours, minutes)) {
      showAlertModal('warning', 'Thời gian không khả dụng', 'Vui lòng chọn thời gian ít nhất 1 tiếng kể từ bây giờ');
      return;
    }

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setSelectedTime(timeString);
    setShowTimePicker(false);
  };

  const handleBookNow = async () => {
    if (!selectedDate || !selectedTime) {
      showAlertModal('info', 'Thông báo', 'Vui lòng chọn ngày và giờ làm việc');
      return;
    }

    try {
      setLoading(true);

      // Create datetime object from selected date and time (Vietnam timezone UTC+7)
      const [year, month, day] = selectedDate.split('-').map(Number);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      
      // Create date in local timezone (Vietnam)
      const localDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      
      // Convert to ISO string (UTC) for PostgreSQL
      // PostgreSQL requires UTC format: "2025-10-24T16:34:23.850Z"
      const requestedDateTimeUTC = localDateTime.toISOString();
      const expectedStartTimeUTC = localDateTime.toISOString();

      const requestData: ServiceRequestData = {
        fullName: bookingData.customerName,
        phoneNumber: bookingData.phoneNumber,
        serviceId: bookingData.serviceId || '',
        serviceDescription: bookingData.serviceDescription,
        addressID: bookingData.addressID || '',
        addressNote: bookingData.addressNote || '',
        requestedDate: requestedDateTimeUTC,
        expectedStartTime: expectedStartTimeUTC,
        mediaUrls: bookingData.mediaUrls
      };

      console.log('📤 Creating service request:', requestData);

      const response = await serviceRequestService.createServiceRequest(requestData);

      console.log('✅ Service request created:', response);

      // Chuyển sang trang booking-confirmation với đầy đủ thông tin
      router.replace({
        pathname: '/customer/booking-confirmation',
        params: {
          requestId: response.requestID,
          serviceName: bookingData.serviceName,
          customerName: bookingData.customerName,
          phoneNumber: bookingData.phoneNumber,
          requestedDate: requestedDateTimeUTC,
          expectedStartTime: selectedTime, // Hiển thị giờ local (HH:mm)
          addressNote: bookingData.addressNote || '',
          serviceDescription: bookingData.serviceDescription,
          imageCount: bookingData.mediaUrls?.length || 0,
        }
      });
    } catch (error: any) {
      console.error('❌ Service request creation failed:', error);
      showAlertModal('error', 'Đặt lịch thất bại', error.message || 'Không thể tạo yêu cầu dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const canSubmit = selectedDate && selectedTime && !loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      
      {/* Header */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn thời gian làm việc</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian làm việc</Text>
        </View>

        {/* Date Selection */}
        <View style={styles.dateSection}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateLabel}>Chọn ngày làm</Text>
            <Text style={styles.monthDisplay}>{getMonthRangeDisplay()}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysContainer}
          >
            {daySlots.map((day) => {
              const isSelected = selectedDate === day.dateString;
              return (
                <TouchableOpacity
                  key={day.dateString}
                  style={[
                    styles.daySlot,
                    isSelected && styles.daySlotSelected,
                    day.isToday && styles.daySlotToday
                  ]}
                  onPress={() => handleDaySelect(day.dateString)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayOfWeek,
                    isSelected && styles.dayOfWeekSelected
                  ]}>
                    {day.dayOfWeek}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected
                  ]}>
                    {day.dayNumber}
                  </Text>
                  {day.isToday && !isSelected && (
                    <View style={styles.todayDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.timeSection}>
          <TouchableOpacity
            style={[
              styles.newTimePickerButton,
              !selectedDate && styles.timePickerButtonDisabled
            ]}
            onPress={handleOpenTimePicker}
            disabled={!selectedDate}
            activeOpacity={0.7}
          >
            <View style={styles.newTimePickerContent}>
              <View style={styles.timeIconWrapper}>
                <Ionicons name="time" size={24} color="#609CEF" />
              </View>
              <Text style={styles.newTimePickerLabel}>Chọn giờ làm</Text>
              <View style={styles.timeDisplayContainer}>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>
                    {selectedTime ? selectedTime.split(':')[0] : '00'}
                  </Text>
                </View>
                <Text style={styles.timeSeparator}>|</Text>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>
                    {selectedTime ? selectedTime.split(':')[1] : '00'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {!selectedDate && (
            <View style={styles.timeHelperText}>
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.helperText}>Vui lòng chọn ngày trước</Text>
            </View>
          )}
        </View>

        {/* Warning Note - Chỉ hiện khi là giờ cao điểm */}
        {showPeakHourWarning && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Giá tăng do nhu cầu công việc tăng cao vào thời điểm này.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseTimePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseTimePicker}>
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Chọn giờ làm</Text>
                <TouchableOpacity onPress={handleConfirmTimePicker}>
                  <Text style={styles.modalConfirmText}>Đồng ý</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerTimeValue}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                minuteInterval={5}
                textColor="#1F2937"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={pickerTimeValue}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
          minuteInterval={5}
          is24Hour={true}
        />
      )}

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled
          ]}
          onPress={handleBookNow}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canSubmit ? ['#609CEF', '#4F8BE8', '#3D7CE0'] : ['#CBD5E1', '#94A3B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Đặt lịch ngay</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Custom Modal */}
      <CustomModal
        visible={showModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        autoClose={modalAutoClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    backgroundColor: '#609CEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateSection: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  monthDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  daysContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  daySlot: {
    width: 64,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  daySlotSelected: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
  },
  daySlotToday: {
    borderColor: '#10B981',
  },
  dayOfWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  dayOfWeekSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  timeSection: {
    marginBottom: 20,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  newTimePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  timePickerButtonDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  newTimePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 50,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTimePickerLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  timeDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValueBox: {
    minWidth: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timeValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  timePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timePickerInfo: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timePickerValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  timePickerPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  timeHelperText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#609CEF',
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 1,
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default withCustomerAuth(SelectSchedule);
