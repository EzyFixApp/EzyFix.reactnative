import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { walletService } from '../../lib/api/wallet';
import type { WalletSummary, BankInfo, CreatePayoutRequest } from '../../lib/api/wallet';
import { Picker } from '@react-native-picker/picker';

function Withdraw() {
  // Wallet state
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Banks state
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Form state
  const [amount, setAmount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [note, setNote] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadWalletSummary();
    loadBanks();
  }, []);

  const loadWalletSummary = async () => {
    try {
      setLoadingWallet(true);
      const summary = await walletService.getWalletSummary();
      setWalletSummary(summary);
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load wallet:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);
      const bankList = await walletService.getBanks();
      // Filter only TRANSFER_SUPPORTED banks
      const supportedBanks = bankList.filter(
        (bank) => bank.vietQrStatus === 'TRANSFER_SUPPORTED'
      );
      setBanks(supportedBanks);
      if (supportedBanks.length > 0) {
        setSelectedBankCode(supportedBanks[0].bin);
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load banks:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const parseAmount = (text: string): number => {
    const cleaned = text.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  };

  const handleAmountChange = (text: string) => {
    const numericValue = parseAmount(text);
    setAmount(numericValue.toString());
  };

  const getSelectedBank = () => {
    return banks.find((bank) => bank.bin === selectedBankCode);
  };

  const validateForm = (): string | null => {
    if (!amount || parseAmount(amount) === 0) {
      return 'Vui lòng nhập số tiền rút';
    }

    const withdrawAmount = parseAmount(amount);

    if (withdrawAmount < 50000) {
      return 'Số tiền rút tối thiểu là 50,000đ';
    }

    if (!walletSummary) {
      return 'Không thể tải thông tin ví';
    }

    if (withdrawAmount > walletSummary.availableBalance) {
      return `Số dư không đủ. Khả dụng: ${formatCurrency(walletSummary.availableBalance)}`;
    }

    if (!receiverName.trim()) {
      return 'Vui lòng nhập tên chủ tài khoản';
    }

    if (!receiverAccount.trim()) {
      return 'Vui lòng nhập số tài khoản';
    }

    if (receiverAccount.length < 6 || receiverAccount.length > 20) {
      return 'Số tài khoản không hợp lệ (6-20 ký tự)';
    }

    if (!selectedBankCode) {
      return 'Vui lòng chọn ngân hàng';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setShowErrorModal(true);
      return;
    }

    try {
      setSubmitting(true);

      const request: CreatePayoutRequest = {
        amount: parseAmount(amount),
        receiverName: receiverName.trim(),
        receiverAccount: receiverAccount.trim(),
        bankCode: selectedBankCode,
        note: note.trim() || undefined,
      };

      const result = await walletService.createPayout(request);

      if (__DEV__) {
        console.log('✅ Payout created:', result);
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to create payout:', error);
      setErrorMessage(error.message || 'Không thể tạo yêu cầu rút tiền. Vui lòng thử lại.');
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Rút tiền</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Wallet Balance Card */}
        {loadingWallet ? (
          <View style={styles.balanceCard}>
            <ActivityIndicator size="small" color="#609CEF" />
          </View>
        ) : walletSummary ? (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(walletSummary.availableBalance)}
            </Text>
            {walletSummary.holdAmount > 0 && (
              <View style={styles.holdInfo}>
                <Ionicons name="lock-closed-outline" size={14} color="#F59E0B" />
                <Text style={styles.holdText}>
                  Đang giữ: {formatCurrency(walletSummary.holdAmount)}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Thông tin rút tiền</Text>

          {/* Amount Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Số tiền rút <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền"
                keyboardType="numeric"
                value={amount ? formatCurrency(parseAmount(amount)) : ''}
                onChangeText={handleAmountChange}
                editable={!submitting}
              />
            </View>
            <Text style={styles.hint}>Tối thiểu 50,000đ</Text>
          </View>

          {/* Receiver Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Tên chủ tài khoản <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn A"
                value={receiverName}
                onChangeText={setReceiverName}
                editable={!submitting}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Account Number */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Số tài khoản <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="0123456789"
                keyboardType="numeric"
                value={receiverAccount}
                onChangeText={setReceiverAccount}
                editable={!submitting}
                maxLength={20}
              />
            </View>
          </View>

          {/* Bank Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Ngân hàng <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => !submitting && !loadingBanks && setShowBankPicker(true)}
              disabled={submitting || loadingBanks}
            >
              {loadingBanks ? (
                <ActivityIndicator size="small" color="#609CEF" />
              ) : (
                <>
                  <Text style={styles.pickerButtonText}>
                    {getSelectedBank()?.shortName || 'Chọn ngân hàng'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Note */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ghi chú về yêu cầu rút tiền (không bắt buộc)"
                value={note}
                onChangeText={setNote}
                editable={!submitting}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={submitting ? ['#94A3B8', '#94A3B8'] : ['#FFA500', '#FF8C00']}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="cash-outline" size={24} color="white" />
                  <Text style={styles.submitText}>Xác nhận rút tiền</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Yêu cầu rút tiền sẽ được xem xét và xử lý trong vòng 1-3 ngày làm việc
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bank Picker Modal */}
      <Modal visible={showBankPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngân hàng</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bankList}>
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.bin}
                  style={styles.bankItem}
                  onPress={() => {
                    setSelectedBankCode(bank.bin);
                    setShowBankPicker(false);
                  }}
                >
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{bank.shortName}</Text>
                    <Text style={styles.bankFullName} numberOfLines={1}>
                      {bank.name}
                    </Text>
                  </View>
                  {selectedBankCode === bank.bin && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.alertTitle}>Yêu cầu thành công!</Text>
            <Text style={styles.alertMessage}>
              Yêu cầu rút tiền của bạn đã được gửi. Chúng tôi sẽ xử lý trong vòng 1-3 ngày làm
              việc.
            </Text>
            <TouchableOpacity style={styles.alertButton} onPress={handleSuccessClose}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.alertButtonGradient}>
                <Text style={styles.alertButtonText}>Đóng</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} animationType="fade" transparent={true}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="alert-circle" size={64} color="#EF4444" />
            </View>
            <Text style={styles.alertTitle}>Lỗi</Text>
            <Text style={styles.alertMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowErrorModal(false)}
            >
              <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.alertButtonGradient}>
                <Text style={styles.alertButtonText}>Đóng</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerWrapper: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  holdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  holdText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bankList: {
    maxHeight: 500,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bankFullName: {
    fontSize: 13,
    color: '#6B7280',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  alertButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default withTechnicianAuth(Withdraw);
