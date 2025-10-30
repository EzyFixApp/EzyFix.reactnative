# Role-Based Access Control (RBAC) Implementation

## Tổng quan
Đã triển khai hệ thống kiểm soát truy cập dựa trên vai trò (Role-Based Access Control) để ngăn chặn người dùng truy cập vào trang không phù hợp với vai trò của họ.

## Vấn đề đã giải quyết
- **Trước đây**: Người dùng với role Technician vẫn có thể truy cập trang Customer và ngược lại
- **Hiện tại**: Hệ thống sẽ tự động phát hiện role mismatch, hiển thị popup cảnh báo, logout user và chuyển về trang chủ

## Các thay đổi chính

### 1. Authentication Hooks (`hooks/`)

#### `useCustomerAuth.ts`
- **Thêm auto-logout** khi phát hiện role mismatch (user không phải customer)
- Khi user có `userType !== 'customer'`:
  - Set error state: `ROLE_MISMATCH`
  - Tự động logout user
  - Cache kết quả để tránh kiểm tra lại liên tục

#### `useTechnicianAuth.ts`
- **Thêm auto-logout** khi phát hiện role mismatch (user không phải technician)
- Khi user có `userType !== 'technician'`:
  - Set error state: `ROLE_MISMATCH`
  - Tự động logout user
  - Cache kết quả để tránh kiểm tra lại liên tục

### 2. Higher-Order Components (`lib/auth/`)

#### `withCustomerAuth.tsx`
- **Cải tiến xử lý ROLE_MISMATCH**:
  - Khi có lỗi `ROLE_MISMATCH`, chuyển về trang chủ (`/`) thay vì trang login customer
  - Ngăn chặn multiple redirects với `hasRedirected` ref
  - Hiển thị modal cảnh báo trước khi redirect

#### `withTechnicianAuth.tsx`
- **Cải tiến xử lý ROLE_MISMATCH**:
  - Khi có lỗi `ROLE_MISMATCH`, chuyển về trang chủ (`/`) thay vì trang login technician
  - Ngăn chặn multiple redirects với state management
  - Hiển thị modal cảnh báo trước khi redirect

### 3. UI Components (`components/`)

#### `AuthErrorModal.tsx`
- **Cập nhật message cho ROLE_MISMATCH**:
  - **Trước**: "Bạn cần đăng nhập với tài khoản Thợ để sử dụng tính năng này."
  - **Sau**: "Bạn đang đăng nhập với tài khoản không phù hợp với trang này. Vui lòng đăng nhập lại với tài khoản đúng."
  - **Button text**: "Quay về trang chủ"

### 4. Protected Pages

#### Customer Profile (`app/customer/profile.tsx`)
- **Đã thêm HOC protection**: `withCustomerAuth`
- Trước đây trang này không được bảo vệ (HOC đã bị comment out)
- Hiện tại đã được bảo vệ đầy đủ

#### Các trang đã được verify có HOC:
- ✅ `app/customer/dashboard.tsx` - withCustomerAuth
- ✅ `app/customer/profile.tsx` - withCustomerAuth (vừa thêm)
- ✅ `app/customer/booking-detail.tsx` - withCustomerAuth
- ✅ `app/customer/book-service.tsx` - withCustomerAuth
- ✅ `app/customer/all-services.tsx` - withCustomerAuth
- ✅ `app/customer/order-tracking.tsx` - withCustomerAuth
- ✅ `app/customer/add-address.tsx` - withCustomerAuth
- ✅ `app/technician/dashboard.tsx` - withTechnicianAuth
- ✅ `app/technician/activity.tsx` - withTechnicianAuth
- ✅ `app/technician/order-details.tsx` - withTechnicianAuth
- ✅ và nhiều trang khác...

## Flow hoạt động

### Khi user với role sai truy cập trang:

1. **Hook phát hiện role mismatch**:
   ```typescript
   if (user.userType !== 'customer') {
     setError('ROLE_MISMATCH');
     setIsAuthorized(false);
     await logout(); // Auto logout
   }
   ```

2. **HOC hiển thị modal cảnh báo**:
   - Popup xuất hiện với thông báo lỗi
   - Countdown tự động (3 giây)
   - Button "Quay về trang chủ"

3. **Auto redirect về trang chủ**:
   ```typescript
   if (error === 'ROLE_MISMATCH') {
     router.replace('/'); // Về trang chủ, không phải login page
   }
   ```

4. **User cần đăng nhập lại**:
   - Từ trang chủ, user chọn đúng role để đăng nhập
   - Không bị redirect loop

## Các loại lỗi xác thực

1. **ROLE_MISMATCH**: Vai trò không khớp
   - Icon: ⚠️ (warning)
   - Màu: Orange (#FF9800)
   - Action: Logout + redirect về trang chủ

2. **TOKEN_EXPIRED**: Token hết hạn
   - Icon: ⏱️ (time)
   - Màu: Red (#F44336)
   - Action: Logout + redirect về login tương ứng

3. **UNAUTHORIZED**: Chưa đăng nhập
   - Icon: 🔒 (lock-closed)
   - Màu: Red (#F44336)
   - Action: Redirect về login tương ứng

4. **SESSION_INVALID**: Phiên không hợp lệ
   - Icon: ⚠️ (alert-circle)
   - Màu: Red (#F44336)
   - Action: Redirect về login tương ứng

## Performance & Caching

- **Cache duration**: 5 seconds
- **Global cache**: Shared across all screens cùng role
- **Instant validation**: Sử dụng cached result để tránh check lại liên tục
- **No loading flash**: Chỉ show loading ở lần check đầu tiên

## Testing

### Test case 1: Customer truy cập trang Technician
1. Đăng nhập với tài khoản Customer
2. Truy cập URL: `/technician/dashboard`
3. **Expected**: 
   - Modal hiển thị: "Bạn đang đăng nhập với tài khoản không phù hợp..."
   - Auto logout sau 3 giây
   - Redirect về trang chủ (`/`)

### Test case 2: Technician truy cập trang Customer
1. Đăng nhập với tài khoản Technician
2. Truy cập URL: `/customer/dashboard`
3. **Expected**:
   - Modal hiển thị: "Bạn đang đăng nhập với tài khoản không phù hợp..."
   - Auto logout sau 3 giây
   - Redirect về trang chủ (`/`)

### Test case 3: Direct URL access
1. Không đăng nhập
2. Truy cập URL: `/customer/profile` hoặc `/technician/orders`
3. **Expected**:
   - Modal hiển thị: "Phiên đăng nhập không hợp lệ"
   - Redirect về login page tương ứng

## Bảo mật

✅ **Prevented attacks**:
- URL manipulation
- Role escalation
- Direct page access
- Token stealing (auto-validate)

✅ **Security measures**:
- Auto logout on role mismatch
- Token expiration check (5 minutes buffer)
- Cache invalidation on logout
- Error boundary for hooks errors

## Maintenance

### Thêm HOC protection cho trang mới:

```typescript
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
// hoặc
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

function MyNewPage() {
  // Component code
}

// Cho customer
export default withCustomerAuth(MyNewPage, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});

// Cho technician
export default withTechnicianAuth(MyNewPage, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
```

## Notes

- **Không cần thêm manual auth check** trong component nữa
- HOC sẽ tự động xử lý tất cả authentication & authorization
- Modal sẽ tự động hiển thị khi có lỗi
- User sẽ được redirect an toàn về trang phù hợp
