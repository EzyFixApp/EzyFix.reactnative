# Hướng Dẫn Thay Thế Alert.alert Bằng Custom Modal

## 📌 Tổng Quan

Đã tạo **CustomModal component** chuyên nghiệp thay thế cho Alert hệ thống với các tính năng:
- ✅ 5 loại modal: `success`, `error`, `warning`, `info`, `confirm`
- ✅ Icon tự động theo type với màu sắc phù hợp
- ✅ Gradient buttons theo app design
- ✅ Hỗ trợ confirm với cancel button
- ✅ Animation smooth

## 🎯 Files Đã Hoàn Thành

### 1. ✅ components/CustomModal.tsx
**Component tái sử dụng** - Đã tạo xong

### 2. ✅ app/customer/profile.tsx  
- **Alerts thay thế**: 1
- **Loại**: Logout confirmation
- **Pattern**: Confirm modal với 2 buttons

### 3. ✅ app/customer/select-schedule.tsx
- **Alerts thay thế**: 5
- **Loại**: Validation + booking error
- **Pattern**: Info/Warning/Error modals

### 4. ✅ app/customer/saved-addresses.tsx
- **Alerts thay thế**: 10
- **Loại**: Validation + delete confirmation + API errors
- **Pattern**: Confirm + Success/Error modals

---

## 📖 Pattern Thay Thế Alert

### **Bước 1: Import CustomModal**
```typescript
import CustomModal from '../../components/CustomModal';
```

Xóa import Alert:
```typescript
// XÓA dòng này
import { View, Text, ..., Alert, ... } from 'react-native';

// THAY BẰNG (không có Alert)
import { View, Text, ..., ... } from 'react-native';
```

### **Bước 2: Thêm States**
```typescript
// Custom Modal states
const [showModal, setShowModal] = useState(false);
const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
const [modalTitle, setModalTitle] = useState('');
const [modalMessage, setModalMessage] = useState('');
const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>();
const [showCancelButton, setShowCancelButton] = useState(false);
```

### **Bước 3: Tạo Helper Function**
```typescript
const showAlertModal = (
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
  title: string,
  message: string,
  onConfirm?: () => void,
  showCancel = false
) => {
  setModalType(type);
  setModalTitle(title);
  setModalMessage(message);
  setModalOnConfirm(onConfirm ? () => onConfirm : undefined);
  setShowCancelButton(showCancel);
  setShowModal(true);
};
```

### **Bước 4: Thay Thế Alert.alert**

#### **4.1. Simple Alert (Chỉ thông báo)**
```typescript
// CŨ:
Alert.alert('Lỗi', 'Vui lòng nhập tên');

// MỚI:
showAlertModal('error', 'Lỗi', 'Vui lòng nhập tên');
```

#### **4.2. Alert với OK button**
```typescript
// CŨ:
Alert.alert('Thành công', 'Đã lưu địa chỉ', [{ text: 'OK' }]);

// MỚI:
showAlertModal('success', 'Thành công', 'Đã lưu địa chỉ');
```

#### **4.3. Confirm Alert (Có Cancel + Confirm)**
```typescript
// CŨ:
Alert.alert(
  'Xác nhận',
  'Bạn có chắc chắn muốn xóa?',
  [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Xóa', style: 'destructive', onPress: () => handleDelete() }
  ]
);

// MỚI:
showAlertModal(
  'confirm',
  'Xác nhận',
  'Bạn có chắc chắn muốn xóa?',
  () => handleDelete(),
  true  // showCancel = true
);
```

#### **4.4. Alert với callback sau khi đóng**
```typescript
// CŨ:
Alert.alert(
  'Đăng xuất',
  'Bạn có muốn đăng xuất?',
  [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', onPress: async () => {
        await logout();
        router.replace('/');
      }
    }
  ]
);

// MỚI:
showAlertModal(
  'confirm',
  'Đăng xuất',
  'Bạn có muốn đăng xuất?',
  async () => {
    await logout();
    router.replace('/');
  },
  true
);
```

### **Bước 5: Thêm CustomModal vào JSX**
Thêm trước closing tag của container chính:
```tsx
return (
  <View style={styles.container}>
    {/* ... existing code ... */}

    {/* Custom Modal - THÊM VÀO ĐÂY */}
    <CustomModal
      visible={showModal}
      type={modalType}
      title={modalTitle}
      message={modalMessage}
      onClose={() => setShowModal(false)}
      onConfirm={modalOnConfirm}
      showCancel={showCancelButton}
      confirmText={modalType === 'confirm' ? 'Xác nhận' : 'OK'}
      cancelText="Hủy"
    />
  </View>
);
```

---

## 🎨 Modal Types & Colors

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `success` | checkmark-circle | Green (#10B981) | Thành công, hoàn thành |
| `error` | alert-circle | Red (#EF4444) | Lỗi, thất bại |
| `warning` | warning | Orange (#F59E0B) | Cảnh báo, lưu ý |
| `info` | information-circle | Blue (#609CEF) | Thông tin, hướng dẫn |
| `confirm` | help-circle | Blue (#609CEF) | Xác nhận, confirm action |

---

## 📝 Examples Cụ Thể

### Example 1: Validation Error
```typescript
// file: book-service.tsx
// CŨ:
if (!customerName.trim()) {
  Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
  return;
}

// MỚI:
if (!customerName.trim()) {
  showAlertModal('error', 'Lỗi', 'Vui lòng nhập tên khách hàng');
  return;
}
```

### Example 2: Success Message
```typescript
// file: add-address.tsx
// CŨ:
Alert.alert('Thành công', 'Đã lấy vị trí và địa chỉ hiện tại!');

// MỚI:
showAlertModal('success', 'Thành công', 'Đã lấy vị trí và địa chỉ hiện tại!');
```

### Example 3: Delete Confirmation
```typescript
// file: technician-order-tracking.tsx
// CŨ:
const handleDelete = () => {
  Alert.alert(
    'Xóa ảnh',
    'Bạn có chắc chắn muốn xóa ảnh này?',
    [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => removePhoto(id) }
    ]
  );
};

// MỚI:
const handleDelete = () => {
  showAlertModal(
    'confirm',
    'Xóa ảnh',
    'Bạn có chắc chắn muốn xóa ảnh này?',
    () => removePhoto(id),
    true
  );
};
```

### Example 4: API Error Handling
```typescript
// file: quote-selection.tsx
// CŨ:
try {
  await submitQuote();
  Alert.alert('Thành công', 'Đã gửi báo giá');
} catch (error: any) {
  Alert.alert('Lỗi', error.message || 'Không thể gửi báo giá');
}

// MỚI:
try {
  await submitQuote();
  showAlertModal('success', 'Thành công', 'Đã gửi báo giá');
} catch (error: any) {
  showAlertModal('error', 'Lỗi', error.message || 'Không thể gửi báo giá');
}
```

---

## 🚀 Files Cần Xử Lý Tiếp

### 1. app/customer/add-address.tsx (11 Alerts)
**Locations**:
- Lines 123, 132: Edit mode validation warnings
- Lines 197, 201, 205, 209: Form validation errors
- Lines 227, 238, 245, 256, 261: API errors
- Lines 390, 417, 419, 423, 427: GPS/location errors

**Pattern**: Chủ yếu là `error` type, một số `success` cho GPS

### 2. app/customer/book-service.tsx (13 Alerts)
**Locations**:
- Lines 222, 234, 243: Permission/media errors
- Lines 260, 269, 289, 308: Camera/photo picker errors
- Lines 379, 399, 428, 468: Validation errors
- Lines 478, 483, 488: Form validation

**Pattern**: `error` type cho validation, `confirm` type cho media actions

### 3. app/technician/technician-order-tracking.tsx (21 Alerts)
**Locations**:
- Lines 749-1216: Nhiều validation, confirmation, success messages
- Includes: photo validation, status updates, completion confirmations

**Pattern**: Mix of `error`, `warning`, `success`, `confirm` types

### 4. app/technician/quote-selection.tsx (10 Alerts)
**Locations**:
- Lines 109-542: Form validation, submit confirmations, success/error messages

**Pattern**: `info` for validation, `confirm` for submissions, `success`/`error` for results

---

## ✅ Checklist

Để thay thế Alert trong một file:

- [ ] Import CustomModal
- [ ] Xóa import Alert
- [ ] Thêm modal states (showModal, modalType, modalTitle, modalMessage, modalOnConfirm, showCancelButton)
- [ ] Tạo showAlertModal helper function
- [ ] Tìm tất cả Alert.alert trong file
- [ ] Thay thế từng Alert.alert bằng showAlertModal với type phù hợp
- [ ] Thêm <CustomModal> vào JSX (trước closing </View>)
- [ ] Test các trường hợp: validation, success, error, confirmation

---

## 🎯 Tips

1. **Chọn Type phù hợp**:
   - Validation error → `error`
   - Permission/warning → `warning`
   - Success action → `success`
   - User confirmation → `confirm`
   - General info → `info`

2. **Với Confirm Modal**:
   - Always set `showCancel = true`
   - Provide `onConfirm` callback
   - Use descriptive confirmText (e.g., "Xóa", "Đăng xuất", "Xác nhận")

3. **Error Handling**:
   ```typescript
   catch (error: any) {
     showAlertModal('error', 'Lỗi', error.message || 'Có lỗi xảy ra');
   }
   ```

4. **Success với Navigation**:
   ```typescript
   showAlertModal('success', 'Thành công', 'Đã lưu!');
   // Không cần wait modal close, có thể navigate ngay
   router.back();
   ```

---

## 🔍 Debugging

Nếu gặp lỗi compile:
1. Check đã remove `Alert` from imports
2. Check states đã declare đủ
3. Check `showAlertModal` function đã tạo
4. Check `<CustomModal>` đã thêm vào JSX với đủ props
5. Check type casting: `'success' | 'error' | ...` phải match

---

**Note**: Không sử dụng emoji trong title/message của modal (theo rule user đã yêu cầu).
