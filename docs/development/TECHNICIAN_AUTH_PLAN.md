# 🔐 Kế Hoạch: Setup Authentication & Authorization cho Technician Screens

## 📋 Tổng Quan

**Mục tiêu:** Bảo vệ toàn bộ màn hình Technician với:
- ✅ Role-based access control (chỉ technician mới truy cập được)
- ✅ Token validation (check token hết hạn)
- ✅ Auto-redirect khi unauthorized
- ✅ Real-time popup notification
- ✅ Force re-login khi cần

---

## 🎯 Phạm Vi Áp Dụng

### Danh Sách Màn Hình Technician Cần Bảo Vệ

```
app/technician/
├── ✅ dashboard.tsx          - Main dashboard thợ
├── ✅ orders.tsx             - Quản lý đơn hàng
├── ✅ profile.tsx            - Hồ sơ cá nhân
├── ✅ activity.tsx           - Hoạt động gần đây
├── ✅ statistics.tsx         - Thống kê
├── ✅ order-details.tsx      - Chi tiết đơn hàng
├── ✅ order-tracking.tsx     - Theo dõi đơn hàng
├── ✅ order-history-detail.tsx
├── ✅ quote-selection.tsx    - Chọn báo giá
├── ✅ technician-order-tracking.tsx
├── ✅ personal-info.tsx      - Thông tin cá nhân
├── ✅ notification-settings.tsx
└── components/               - Components riêng của thợ
```

**Không cần bảo vệ:**
- `login.tsx` - Public
- `register.tsx` - Public
- `forgot-password.tsx` - Public
- `otp-verification.tsx` - Public
- `verify.tsx` - Public
- `reset-password.tsx` - Public

---

## 🏗️ Kiến Trúc Solution

### 1. Tạo HOC (Higher-Order Component) - `withTechnicianAuth`

```typescript
// lib/auth/withTechnicianAuth.tsx

Chức năng:
- Check isAuthenticated
- Validate userType === 'technician'
- Check token expiration
- Auto-redirect nếu unauthorized
- Show popup notification khi cần re-login
```

### 2. Tạo Auth Guard Hook - `useTechnicianAuth`

```typescript
// hooks/useTechnicianAuth.ts

Chức năng:
- Real-time monitoring auth state
- Token expiration detection
- Role validation
- Auto-logout expired sessions
```

### 3. Tạo Popup Notification Component

```typescript
// components/AuthErrorModal.tsx

Features:
- Animated modal
- Clear error messages
- Auto-redirect to login
- User-friendly UI
```

### 4. Enhance AuthStore

```typescript
// store/authStore.ts

Thêm:
- isTokenExpired() method
- validateRole(requiredRole) method
- Auto-refresh token logic
- onAuthError callbacks
```

---

## 📝 Implementation Plan

### Phase 1: Core Auth Infrastructure (30 phút)

#### Step 1.1: Create Auth Guard Hook
```typescript
File: hooks/useTechnicianAuth.ts

Features:
- useEffect monitor auth state
- Check user.userType === 'technician'
- Check token expiration every 1 minute
- Return { isAuthorized, error, redirectToLogin }
```

#### Step 1.2: Create HOC Wrapper
```typescript
File: lib/auth/withTechnicianAuth.tsx

HOC wraps any component:
- Use useTechnicianAuth hook
- Show loading while checking
- Show error modal if unauthorized
- Render component if authorized
```

#### Step 1.3: Create Error Modal
```typescript
File: components/AuthErrorModal.tsx

Props:
- visible: boolean
- errorType: 'ROLE_MISMATCH' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED'
- onClose: () => void
- onLoginPress: () => void

UI:
- Animated slide-up modal
- Icon based on error type
- Clear message
- "Đăng nhập lại" button
```

---

### Phase 2: Enhance Auth Store (20 phút)

#### Step 2.1: Add Token Validation
```typescript
store/authStore.ts

Add methods:
- isTokenExpired(): boolean
- getTokenExpirationTime(): Date | null
- validateUserRole(role: UserType): boolean
- scheduleTokenRefresh(): void
```

#### Step 2.2: Add Auto-Refresh Logic
```typescript
Implement:
- Background timer to check token every 5 minutes
- Auto-refresh before expiration
- Clear timer on logout
```

---

### Phase 3: Apply to All Technician Screens (40 phút)

#### Step 3.1: Wrap All Protected Screens
```typescript
Áp dụng cho từng file:

// Before
export default function Dashboard() {
  return <View>...</View>
}

// After
function Dashboard() {
  return <View>...</View>
}

export default withTechnicianAuth(Dashboard);
```

#### Step 3.2: Add Loading States
```typescript
Mỗi screen thêm:
- Loading indicator khi checking auth
- Skeleton screens
- Smooth transitions
```

---

### Phase 4: Testing & Error Scenarios (30 phút)

#### Test Cases:
1. ✅ Customer login → access technician screen → show error
2. ✅ Technician login → access screens → OK
3. ✅ Token expired → auto-detect → show popup → redirect
4. ✅ Manual logout → clear all data
5. ✅ Network error → retry logic
6. ✅ Refresh token flow

---

## 🛠️ Technical Implementation Details

### 1. Token Expiration Detection

```typescript
// Parse JWT token
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Check if expired
const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  // Add 5 minute buffer
  return currentTime >= (expirationTime - 5 * 60 * 1000);
};
```

### 2. Role Validation

```typescript
const validateTechnicianRole = (user: UserData | null): boolean => {
  if (!user) return false;
  return user.userType === 'technician';
};
```

### 3. Auto-Redirect Logic

```typescript
const handleUnauthorized = (
  error: 'ROLE_MISMATCH' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED'
) => {
  // Show popup
  setShowAuthError(true);
  setErrorType(error);
  
  // Auto-redirect after 3 seconds
  setTimeout(() => {
    logout();
    router.replace('/technician/login');
  }, 3000);
};
```

---

## 📦 File Structure

```
EzyFix.reactnative/
├── hooks/
│   └── useTechnicianAuth.ts          [NEW] ⭐
│
├── lib/
│   └── auth/
│       ├── withTechnicianAuth.tsx    [NEW] ⭐
│       └── tokenUtils.ts             [NEW] ⭐
│
├── components/
│   └── AuthErrorModal.tsx            [NEW] ⭐
│
├── store/
│   └── authStore.ts                  [MODIFY] 🔧
│
└── app/
    └── technician/
        ├── dashboard.tsx             [MODIFY] 🔧
        ├── orders.tsx                [MODIFY] 🔧
        ├── profile.tsx               [MODIFY] 🔧
        ├── activity.tsx              [MODIFY] 🔧
        ├── statistics.tsx            [MODIFY] 🔧
        └── ... (all protected screens)
```

---

## 🎨 Error Messages

### 1. Role Mismatch
```
⚠️ Không có quyền truy cập

Bạn cần đăng nhập với tài khoản Thợ 
để sử dụng tính năng này.

[Đăng nhập lại]
```

### 2. Token Expired
```
🔒 Phiên đăng nhập hết hạn

Vui lòng đăng nhập lại để tiếp tục 
sử dụng dịch vụ.

[Đăng nhập lại]
```

### 3. Unauthorized
```
❌ Phiên đăng nhập không hợp lệ

Vui lòng đăng nhập lại.

[Đăng nhập lại]
```

---

## 🔄 User Flow

### Scenario 1: Wrong Role
```
Customer logged in
    ↓
Navigate to /technician/dashboard
    ↓
withTechnicianAuth detects role mismatch
    ↓
Show "Không có quyền truy cập" popup
    ↓
Auto-redirect to /technician/login (3s)
```

### Scenario 2: Token Expired
```
Technician logged in
    ↓
Token expires (background check)
    ↓
useTechnicianAuth detects expiration
    ↓
Show "Phiên đăng nhập hết hạn" popup
    ↓
Call logout() to clear data
    ↓
Redirect to /technician/login
```

### Scenario 3: Valid Access
```
Technician logged in
    ↓
Navigate to protected screen
    ↓
withTechnicianAuth validates:
  ✅ isAuthenticated = true
  ✅ userType = 'technician'
  ✅ token valid
    ↓
Render screen normally
```

---

## ⚡ Performance Optimizations

1. **Memoization**
   - Cache validation results
   - Prevent unnecessary re-renders

2. **Lazy Token Checks**
   - Only check on route change
   - Background check every 1 minute

3. **Debounce**
   - Debounce rapid auth checks
   - Prevent flash of unauthorized content

4. **Preload**
   - Validate auth before navigation
   - Smooth transitions

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Token parsing function
- [ ] Expiration calculation
- [ ] Role validation logic

### Integration Tests
- [ ] Login → navigate → protected screen
- [ ] Logout → redirect
- [ ] Token refresh flow

### E2E Tests
- [ ] Customer access technician screen → blocked
- [ ] Technician access → allowed
- [ ] Token expiry during session → handled
- [ ] Network error → graceful degradation

---

## 📊 Timeline Estimate

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create auth hook | 15 min | ⏳ Pending |
| 1 | Create HOC wrapper | 15 min | ⏳ Pending |
| 1 | Create error modal | 15 min | ⏳ Pending |
| 2 | Enhance auth store | 20 min | ⏳ Pending |
| 3 | Apply to screens (15 files) | 40 min | ⏳ Pending |
| 4 | Testing | 30 min | ⏳ Pending |
| **Total** | | **~2 hours** | |

---

## 🚀 Execution Order

1. ✅ Tạo `hooks/useTechnicianAuth.ts`
2. ✅ Tạo `components/AuthErrorModal.tsx`
3. ✅ Tạo `lib/auth/tokenUtils.ts`
4. ✅ Tạo `lib/auth/withTechnicianAuth.tsx`
5. ✅ Enhance `store/authStore.ts`
6. ✅ Apply to `dashboard.tsx` (test first)
7. ✅ Apply to remaining screens
8. ✅ Test all scenarios
9. ✅ Create documentation

---

## 📝 Next Steps

1. Confirm plan với user
2. Start implementation theo order trên
3. Test từng phase
4. Deploy & monitor

---

**Created:** October 21, 2025  
**Author:** GitHub Copilot  
**Status:** 📋 Ready for Implementation
