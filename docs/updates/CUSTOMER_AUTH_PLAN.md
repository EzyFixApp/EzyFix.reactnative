# 🔐 Customer Authentication Implementation Plan

## 📋 Tổng quan
Áp dụng hệ thống authentication chặt chẽ cho **TẤT CẢ** màn hình customer, tương tự như technician đã làm.

---

## 🎯 Mục tiêu
1. **Role-based Access Control**: Chỉ customer mới được truy cập
2. **Token Validation**: Kiểm tra token expiration real-time
3. **Auto Redirect**: Tự động đăng xuất + popup thông báo khi có lỗi
4. **Cache Optimization**: Không hiển thị loading screen mỗi lần navigate
5. **Reuse Components**: Sử dụng lại `AuthErrorModal` và `tokenUtils`

---

## 📂 Phân loại màn hình

### ✅ PUBLIC SCREENS (Không cần auth - 6 màn)
```
❌ login.tsx                 → Màn đăng nhập
❌ register.tsx              → Màn đăng ký  
❌ forgot-password.tsx       → Quên mật khẩu
❌ otp-verification.tsx      → Xác thực OTP
❌ verify.tsx                → Xác thực
❌ reset-password.tsx        → Đặt lại mật khẩu
```

### 🔒 PROTECTED SCREENS (Cần auth - 17 màn)

#### Batch 1: Core Screens (6 màn)
```
1. dashboard.tsx             → Trang chủ customer
2. profile.tsx               → Trang cá nhân
3. personal-info.tsx         → Thông tin cá nhân
4. booking-history.tsx       → Lịch sử đặt dịch vụ
5. booking-detail.tsx        → Chi tiết booking
6. order-tracking.tsx        → Theo dõi đơn hàng
```

#### Batch 2: Booking & Service (5 màn)
```
7. book-service.tsx          → Đặt dịch vụ
8. booking-confirmation.tsx  → Xác nhận đặt dịch vụ
9. quote-review.tsx          → Xem báo giá
10. all-services.tsx         → Danh sách dịch vụ
11. promotions.tsx           → Khuyến mãi
```

#### Batch 3: Additional Features (6 màn)
```
12. favorite-technicians.tsx → Thợ yêu thích
13. saved-addresses.tsx      → Địa chỉ đã lưu
14. add-address.tsx          → Thêm địa chỉ
15. payment-methods.tsx      → Phương thức thanh toán
16. notifications.tsx        → Thông báo
17. notification-settings.tsx → Cài đặt thông báo
```

---

## 🏗️ Kiến trúc Implementation

### 1️⃣ Tạo Infrastructure (2 files mới)

#### File: `hooks/useCustomerAuth.ts`
```typescript
/**
 * Customer Authentication Hook
 * Validates customer role and token expiration
 * Optimized with global cache (5 seconds)
 */

Features:
- ✅ Validate isAuthenticated
- ✅ Check userType === 'customer'
- ✅ Check token expiration
- ✅ Auto-logout if expired
- ✅ Global cache (5s duration)
- ✅ Background validation (60s interval)
- ✅ Fast path for instant validation

Error Types:
- UNAUTHORIZED: Chưa đăng nhập
- ROLE_MISMATCH: Không phải customer (là technician)
- TOKEN_EXPIRED: Token hết hạn
- SESSION_INVALID: Lỗi session
```

#### File: `lib/auth/withCustomerAuth.tsx`
```typescript
/**
 * Customer Authentication HOC
 * Wraps customer screens with auth validation
 * Cache first check to avoid loading flash
 */

Features:
- ✅ Use useCustomerAuth hook
- ✅ Show AuthErrorModal on error
- ✅ Auto redirect after error
- ✅ Cache first check (no loading screen)
- ✅ Render immediately after first auth

Options:
- redirectOnError: true (default)
- autoCloseSeconds: 3 (default)
```

### 2️⃣ Reuse Existing Components

#### ✅ Already Created:
```
- components/AuthErrorModal.tsx  → Popup thông báo lỗi
- lib/auth/tokenUtils.ts         → JWT parsing & validation
```

---

## 🔄 Apply Pattern (cho 17 màn hình)

### Before:
```typescript
export default function CustomerDashboard() {
  // No auth check
  return <View>...</View>;
}
```

### After:
```typescript
import withCustomerAuth from '@/lib/auth/withCustomerAuth';

function CustomerDashboard() {
  return <View>...</View>;
}

export default withCustomerAuth(CustomerDashboard, {
  redirectOnError: true,
  autoCloseSeconds: 3
});
```

---

## 🎯 Implementation Steps

### Phase 1: Infrastructure ✅
- [ ] Create `hooks/useCustomerAuth.ts`
- [ ] Create `lib/auth/withCustomerAuth.tsx`

### Phase 2: Apply Batch 1 (6 core screens) ✅
- [ ] dashboard.tsx
- [ ] profile.tsx
- [ ] personal-info.tsx
- [ ] booking-history.tsx
- [ ] booking-detail.tsx
- [ ] order-tracking.tsx

### Phase 3: Apply Batch 2 (5 booking screens) ✅
- [ ] book-service.tsx
- [ ] booking-confirmation.tsx
- [ ] quote-review.tsx
- [ ] all-services.tsx
- [ ] promotions.tsx

### Phase 4: Apply Batch 3 (6 additional screens) ✅
- [ ] favorite-technicians.tsx
- [ ] saved-addresses.tsx
- [ ] add-address.tsx
- [ ] payment-methods.tsx
- [ ] notifications.tsx
- [ ] notification-settings.tsx

### Phase 5: Documentation & Testing ✅
- [ ] Create `CUSTOMER_AUTH_COMPLETE.md`
- [ ] Test role mismatch (technician → customer screen)
- [ ] Test token expiry
- [ ] Test cache optimization

---

## 🧪 Testing Scenarios

### 1. Role Mismatch Test
```
1. Đăng nhập với tài khoản technician
2. Navigate đến /customer/dashboard
3. Expected: Popup "Tài khoản của bạn không có quyền truy cập"
4. Auto redirect về home sau 3 giây
```

### 2. Token Expiry Test
```
1. Đăng nhập customer
2. Manually expire token in AsyncStorage
3. Navigate giữa các màn customer
4. Expected: Popup "Phiên đăng nhập đã hết hạn"
5. Auto logout + redirect to login
```

### 3. Cache Optimization Test
```
1. Đăng nhập customer
2. Navigate: dashboard → profile → booking-history
3. Expected: Không có loading screen "Đang xác thực..."
4. Navigation mượt mà, instant render
```

### 4. Background Validation Test
```
1. Đăng nhập customer
2. Ở màn dashboard 2 phút
3. Check console: "🔍 Periodic auth check for customer..."
4. Token vẫn valid → không có popup
```

---

## 📊 Expected Results

### Security:
- ✅ Technician không access được customer screens
- ✅ Customer không access được technician screens
- ✅ Token expired → auto logout
- ✅ Real-time validation mỗi 60 giây

### UX:
- ✅ Không có loading flash khi navigate
- ✅ Popup rõ ràng khi có lỗi
- ✅ Auto redirect, không cần user click
- ✅ Smooth navigation giữa các màn

### Performance:
- ✅ Global cache → validate 1 lần, dùng cho 5 giây
- ✅ Instant render sau first auth
- ✅ Background check không block UI

---

## 🔗 Related Files

### Will Create:
- `hooks/useCustomerAuth.ts` (NEW)
- `lib/auth/withCustomerAuth.tsx` (NEW)
- `docs/updates/CUSTOMER_AUTH_COMPLETE.md` (NEW)

### Will Modify (17 files):
- `app/customer/dashboard.tsx`
- `app/customer/profile.tsx`
- `app/customer/personal-info.tsx`
- `app/customer/booking-history.tsx`
- `app/customer/booking-detail.tsx`
- `app/customer/order-tracking.tsx`
- `app/customer/book-service.tsx`
- `app/customer/booking-confirmation.tsx`
- `app/customer/quote-review.tsx`
- `app/customer/all-services.tsx`
- `app/customer/promotions.tsx`
- `app/customer/favorite-technicians.tsx`
- `app/customer/saved-addresses.tsx`
- `app/customer/add-address.tsx`
- `app/customer/payment-methods.tsx`
- `app/customer/notifications.tsx`
- `app/customer/notification-settings.tsx`

### Will Reuse:
- `components/AuthErrorModal.tsx` (EXISTING)
- `lib/auth/tokenUtils.ts` (EXISTING)

---

## ⏱️ Timeline
- Infrastructure: ~10 phút
- Apply Batch 1: ~5 phút
- Apply Batch 2: ~5 phút
- Apply Batch 3: ~5 phút
- Documentation: ~5 phút
- **Total: ~30 phút**

---

## 🎯 Success Criteria
- [x] Infrastructure created (2 files)
- [ ] All 17 protected screens wrapped
- [ ] No TypeScript errors
- [ ] Documentation complete
- [ ] All 4 test scenarios passed
