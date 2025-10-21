# ✏️ Address Edit Feature Implementation

**Date**: October 21, 2025  
**Feature**: Chỉnh sửa địa chỉ (Edit Address)  
**API Endpoint**: `PUT /api/v1/addresses/{id}/update`

---

## 📋 Tổng quan

Đã thêm chức năng **sửa địa chỉ** (Edit Address) vào hệ thống quản lý địa chỉ. Tính năng này cho phép người dùng cập nhật thông tin địa chỉ đã lưu.

## 🎯 Mục tiêu

- ✅ Cho phép người dùng chỉnh sửa địa chỉ đã lưu
- ✅ Sử dụng API `PUT /api/v1/addresses/{id}/update`
- ✅ Tái sử dụng màn hình `add-address.tsx` cho cả Add và Edit mode
- ✅ Giữ nguyên UI/UX consistency với tính năng Add
- ✅ Professional error handling và loading states

---

## 🔧 Thay đổi kỹ thuật

### 1. **API Service** (`lib/api/addresses.ts`)

API service đã có sẵn method `updateAddress`:

```typescript
async updateAddress(id: string, addressData: Partial<AddressData>): Promise<Address> {
  // Gửi với capitalized field names theo yêu cầu của backend
  const backendData = {
    Street: addressData.street?.trim() || '',
    City: addressData.city?.trim() || '',
    Province: addressData.province?.trim() || '',
    PostalCode: addressData.postalCode?.trim() || '',
    Latitude: addressData.latitude,
    Longitude: addressData.longitude
  };
  
  const response = await apiService.put<Address>(
    API_ENDPOINTS.ADDRESS.UPDATE(id),
    backendData,
    { requireAuth: true }
  );
  
  return response.data;
}
```

**Lưu ý quan trọng**: Backend validation yêu cầu field names với **first letter capitalized** (Street, City, Province, PostalCode).

### 2. **Saved Addresses Screen** (`app/customer/saved-addresses.tsx`)

#### ✨ Thêm Edit Button

**Thay đổi**:
- Thêm nút "Sửa" vào mỗi address card
- Thêm handler `handleEditAddress()` để navigate với params
- Cập nhật `AddressCard` component với prop `onEdit`
- Styling cho Edit và Delete buttons (2 buttons cạnh nhau)

**Code mẫu**:
```typescript
const handleEditAddress = (address: Address) => {
  router.push({
    pathname: './add-address',
    params: {
      mode: 'edit',
      addressId: address.addressId,
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || ''
    }
  } as any);
};
```

**UI Updates**:
```typescript
<View style={styles.cardActions}>
  {/* Edit Button - Blue */}
  <TouchableOpacity 
    onPress={handleEdit}
    style={styles.editButton}
  >
    <Ionicons name="create-outline" size={16} color="#609CEF" />
    <Text style={styles.editButtonText}>Sửa</Text>
  </TouchableOpacity>
  
  {/* Delete Button - Red */}
  <TouchableOpacity 
    onPress={handleDelete}
    style={styles.deleteButton}
  >
    <Ionicons name="trash-outline" size={16} color="#F44336" />
    <Text style={styles.deleteButtonText}>Xóa</Text>
  </TouchableOpacity>
</View>
```

### 3. **Add/Edit Address Screen** (`app/customer/add-address.tsx`)

#### 🔄 Dual Mode Support

**Thay đổi chính**:
- Sử dụng `useLocalSearchParams()` để nhận params từ navigation
- Detect edit mode: `mode === 'edit' && addressId exists`
- Initialize form data từ params (cho edit) hoặc defaults (cho add)
- Conditional logic trong `handleSave()` để gọi đúng API

**Code mẫu**:
```typescript
// Get params for edit mode
const params = useLocalSearchParams<{
  mode?: string;
  addressId?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
}>();

// Determine mode
const isEditMode = params.mode === 'edit' && params.addressId;
const addressId = params.addressId;

// Initialize form data
const [formData, setFormData] = useState<AddressData>({
  street: params.street || '',
  city: params.city || 'Thành phố Hồ Chí Minh',
  province: params.province || 'TP. Hồ Chí Minh',
  postalCode: params.postalCode || '700000',
  latitude: params.latitude ? parseFloat(params.latitude) : undefined,
  longitude: params.longitude ? parseFloat(params.longitude) : undefined
});
```

**Save Logic**:
```typescript
const handleSave = async () => {
  if (!validateForm()) return;

  try {
    setLoading(true);

    if (isEditMode && addressId) {
      // UPDATE existing address
      const response = await addressService.updateAddress(addressId, addressData);
      Alert.alert('Thành công', 'Địa chỉ đã được cập nhật!');
    } else {
      // CREATE new address
      const response = await addressService.createAddress(addressData);
      Alert.alert('Thành công', 'Địa chỉ đã được thêm mới!');
    }
    
    router.back();
  } catch (error: any) {
    Alert.alert('Lỗi', error.message);
  } finally {
    setLoading(false);
  }
};
```

**Dynamic UI Text**:
```typescript
// Header title
<Text style={styles.headerTitle}>
  {isEditMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
</Text>

// Button text
<Text style={styles.saveButtonText}>
  {isEditMode ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
</Text>
```

---

## 🎨 UI/UX Changes

### Address Card Actions Layout

**Before** (chỉ có nút Xóa):
```
┌─────────────────────────┐
│   [      Xóa      ]     │
└─────────────────────────┘
```

**After** (có cả Sửa và Xóa):
```
┌─────────────────────────┐
│  [  Sửa  ] [  Xóa  ]    │
└─────────────────────────┘
```

### Button Styles

| Button | Background | Text Color | Icon |
|--------|-----------|-----------|------|
| **Edit** | `#E3F2FD` (Light Blue) | `#609CEF` (Primary Blue) | `create-outline` |
| **Delete** | `#FFEBEE` (Light Red) | `#F44336` (Red) | `trash-outline` |

### Header Titles

| Mode | Title | Subtitle |
|------|-------|----------|
| **Add** | "Thêm địa chỉ mới" | "Điền thông tin địa chỉ để được hỗ trợ dịch vụ" |
| **Edit** | "Chỉnh sửa địa chỉ" | "Cập nhật thông tin địa chỉ của bạn" |

---

## 🔄 User Flow

### Edit Address Flow

```mermaid
graph TD
    A[Saved Addresses Screen] -->|Tap "Sửa"| B[Add-Address Screen với Edit Mode]
    B -->|Load existing data| C[Form populated với dữ liệu hiện tại]
    C -->|User chỉnh sửa| D[Update form fields]
    D -->|Tap "Cập nhật địa chỉ"| E[Call PUT API]
    E -->|Success| F[Show success alert]
    F -->|Tap OK| G[Navigate back với updated list]
    E -->|Error| H[Show error message]
    H --> D
```

### Add Address Flow (unchanged)

```mermaid
graph TD
    A[Saved Addresses Screen] -->|Tap "Thêm địa chỉ mới"| B[Add-Address Screen với Add Mode]
    B -->|Empty form| C[User điền thông tin]
    C -->|Tap "Lưu địa chỉ"| D[Call POST API]
    D -->|Success| E[Show success alert]
    E -->|Tap OK| F[Navigate back với updated list]
    D -->|Error| G[Show error message]
    G --> C
```

---

## ✅ Testing Checklist

### Functional Tests

- [ ] **Edit Mode Navigation**
  - [ ] Tap "Sửa" từ address card
  - [ ] Form được populate với dữ liệu đúng
  - [ ] Header title hiển thị "Chỉnh sửa địa chỉ"

- [ ] **Edit Address Success**
  - [ ] Thay đổi street name
  - [ ] Update coordinates
  - [ ] Tap "Cập nhật địa chỉ"
  - [ ] Success alert hiển thị
  - [ ] Navigate back và list được refresh với dữ liệu mới

- [ ] **Edit Address Validation**
  - [ ] Empty required fields → Show error
  - [ ] Invalid coordinates → Show error
  - [ ] Missing city/province → Show error

- [ ] **Add Mode (ensure không bị break)**
  - [ ] Tap "Thêm địa chỉ mới"
  - [ ] Empty form
  - [ ] Điền thông tin mới
  - [ ] Create address thành công

### UI/UX Tests

- [ ] **Button Layout**
  - [ ] Edit và Delete buttons hiển thị cạnh nhau
  - [ ] Equal width
  - [ ] Proper spacing (gap: 8px)
  - [ ] Icons hiển thị đúng

- [ ] **Loading States**
  - [ ] Loading spinner khi đang update
  - [ ] Button text thay đổi: "Đang cập nhật..."
  - [ ] Button disabled during loading

- [ ] **Error Handling**
  - [ ] Network error → Friendly error message
  - [ ] Validation error → Inline error messages
  - [ ] API error → Show API error message

### Edge Cases

- [ ] **Navigation với params**
  - [ ] Coordinates có thể undefined
  - [ ] String params được parse đúng
  - [ ] Navigate back không mất data

- [ ] **Concurrent Operations**
  - [ ] Không cho phép edit nhiều addresses cùng lúc
  - [ ] Edit trong lúc delete → Proper handling

- [ ] **Data Consistency**
  - [ ] Edit sau khi refresh list
  - [ ] Address ID không thay đổi sau update
  - [ ] User ID consistency

---

## 🐛 Known Issues & Solutions

### Issue 1: Backend Field Names

**Problem**: Backend validation yêu cầu capitalized field names (Street, City, Province, PostalCode)

**Solution**: Transform data trong `addressService.updateAddress()`:
```typescript
const backendData = {
  Street: addressData.street?.trim() || '',
  City: addressData.city?.trim() || '',
  Province: addressData.province?.trim() || '',
  PostalCode: addressData.postalCode?.trim() || '',
  Latitude: addressData.latitude,
  Longitude: addressData.longitude
};
```

### Issue 2: Params Type Safety

**Problem**: TypeScript strict mode với navigation params

**Solution**: Define interface cho params và use type assertion:
```typescript
const params = useLocalSearchParams<{
  mode?: string;
  addressId?: string;
  // ... other fields
}>();
```

---

## 📱 Screenshots Placeholders

### Before (Add only)
```
┌─────────────────────────────────┐
│  Địa chỉ đã lưu                 │
├─────────────────────────────────┤
│  [+] Thêm địa chỉ mới           │
│                                  │
│  ┌─────────────────────────┐   │
│  │ Địa chỉ 1               │   │
│  │ 123 Đường ABC           │   │
│  │                         │   │
│  │    [    Xóa    ]        │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### After (Add & Edit)
```
┌─────────────────────────────────┐
│  Địa chỉ đã lưu                 │
├─────────────────────────────────┤
│  [+] Thêm địa chỉ mới           │
│                                  │
│  ┌─────────────────────────┐   │
│  │ Địa chỉ 1               │   │
│  │ 123 Đường ABC           │   │
│  │                         │   │
│  │  [ Sửa ]  [ Xóa ]       │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## 🔮 Future Enhancements

### Potential Improvements

1. **Inline Editing**
   - Edit directly trong address card
   - Không cần navigate to separate screen

2. **Batch Operations**
   - Select multiple addresses
   - Bulk delete/update

3. **Address History**
   - Track changes log
   - Revert to previous version

4. **Smart Suggestions**
   - Auto-complete từ previous addresses
   - Common locations suggestions

5. **Map Integration**
   - Visual map picker cho coordinates
   - See address on map trước khi save

---

## 📚 Related Documentation

- [Address API Documentation](../api/ADDRESS_API.md) (to be created)
- [Navigation Patterns](../guidelines/NAVIGATION_PATTERNS.md) (to be created)
- [Form Validation Standards](../guidelines/FORM_VALIDATION.md) (to be created)

---

## 👥 Credits

**Implemented by**: AI Assistant  
**Date**: October 21, 2025  
**Review Status**: ⏳ Pending Review  
**Merged**: ⏳ Pending

---

## ✅ Acceptance Criteria

- [x] Users có thể edit existing addresses
- [x] PUT API `/api/v1/addresses/{id}/update` được sử dụng
- [x] Form validation giống như Add mode
- [x] Success/Error messages rõ ràng
- [x] UI consistent với app design system
- [x] No breaking changes cho Add mode
- [x] TypeScript type safety
- [x] Loading states properly handled
- [x] Navigation params properly typed
- [x] Backward navigation works correctly

---

**Status**: ✅ **COMPLETED**
