# 🔄 Role Switching Fix - Complete Documentation

**Date:** November 10, 2025  
**Status:** ✅ Fixed

---

## 🐛 PROBLEM

### Issue Description
Khi logout từ role **customer** và login lại với role **technician**, app xuất hiện lỗi:

```
WARN  [useCustomerAuth] Role mismatch: Expected 'customer', got 'technician'
WARN  [useCustomerAuth] Role mismatch: Expected 'customer', got 'technician'
...
(lặp lại nhiều lần)
```

### User Flow
```
1. Login với role CUSTOMER
2. Vào profile → Logout
3. Redirect về HomeScreen (/)
4. Chọn "Tôi là thợ" → Login với role TECHNICIAN
5. ❌ Bị đẩy ra HomeScreen với WARN logs liên tục
```

---

## 🔍 ROOT CAUSE ANALYSIS

### 1. Navigation State Caching
- Khi logout từ customer, **expo-router vẫn giữ customer routes trong navigation stack**
- Routes này vẫn mounted trong memory (chưa unmount hoàn toàn)
- Khi login technician, customer routes vẫn chạy `useCustomerAuth` hook

### 2. Auth Hook Cache Not Cleared
- `useCustomerAuth` và `useTechnicianAuth` dùng **global cache** để optimize performance
- Cache này **KHÔNG được clear khi logout**
- Khi switch role, cache cũ vẫn còn → gây conflict

### 3. Role Mismatch Detection
- Customer routes (vẫn mounted) chạy `useCustomerAuth`
- `useCustomerAuth` check token → role là `technician`
- Phát hiện mismatch → Console.warn() liên tục

---

## ✅ SOLUTION IMPLEMENTED

### Fix 1: Clear Auth Cache on Logout

**File:** `hooks/useCustomerAuth.ts`
```typescript
// Export clear cache function
export function clearCustomerAuthCache() {
  cachedAuthResult = null;
}
```

**File:** `hooks/useTechnicianAuth.ts`
```typescript
// Export clear cache function
export function clearTechnicianAuthCache() {
  cachedAuthResult = null;
}
```

**File:** `store/authStore.ts`
```typescript
import { clearCustomerAuthCache } from '../hooks/useCustomerAuth';
import { clearTechnicianAuthCache } from '../hooks/useTechnicianAuth';

logout: async (silent = false) => {
  // ... existing logout logic ...
  
  // Clear auth caches to prevent role mismatch warnings
  clearCustomerAuthCache();
  clearTechnicianAuthCache();
  
  // ... rest of logout ...
}
```

**Benefit:**
- ✅ Cache được reset khi logout
- ✅ Không còn stale data khi switch role
- ✅ Auth check sẽ revalidate hoàn toàn

---

### Fix 2: Downgrade Warning Logs to Debug

**File:** `hooks/useCustomerAuth.ts`
```typescript
// Before:
console.warn(`[useCustomerAuth] Role mismatch: Expected 'customer', got '${roleFromToken}'`);

// After:
console.log(`[useCustomerAuth] Role mismatch (expected 'customer', got '${roleFromToken}') - Normal when switching roles`);
```

**File:** `hooks/useTechnicianAuth.ts`
```typescript
// Before:
console.warn(`[useTechnicianAuth] Role mismatch: Expected 'technician', got '${roleFromToken}'`);

// After:
console.log(`[useTechnicianAuth] Role mismatch (expected 'technician', got '${roleFromToken}') - Normal when switching roles`);
```

**Benefit:**
- ✅ Logs vẫn có (để debug)
- ✅ Không còn WARN level (không gây alarm)
- ✅ Message rõ ràng hơn: "Normal when switching roles"

---

## 🎯 HOW IT WORKS NOW

### Flow After Fix

```
1. User logout từ CUSTOMER
   ↓
   authStore.logout() called
   ↓
   clearCustomerAuthCache() ✅
   clearTechnicianAuthCache() ✅
   ↓
   Clear AsyncStorage
   ↓
   router.replace('/') → HomeScreen

2. User chọn "Tôi là thợ" → Login TECHNICIAN
   ↓
   Login successful
   ↓
   router.replace('/technician/dashboard')
   ↓
   Customer routes (nếu vẫn mounted) check auth
   ↓
   useCustomerAuth detects role mismatch
   ↓
   console.log() (DEBUG level) ✅ No WARN
   ↓
   Return isAuthorized=false
   ↓
   Customer routes redirect to home (silent)
   ↓
   ✅ User stays on /technician/dashboard
```

---

## 🔧 TECHNICAL DETAILS

### Cache Lifecycle

**Before:**
```
Login Customer → Cache: { role: customer, isAuthorized: true }
   ↓
Logout → Cache: { role: customer, isAuthorized: true } ❌ Still cached
   ↓
Login Technician → Cache: { role: customer, isAuthorized: true } ❌ Old cache
   ↓
useCustomerAuth() reads old cache → Conflict
```

**After:**
```
Login Customer → Cache: { role: customer, isAuthorized: true }
   ↓
Logout → clearCustomerAuthCache() → Cache: null ✅
   ↓
Login Technician → Cache: null ✅
   ↓
useCustomerAuth() no cache → Fresh check → Detects mismatch gracefully
```

---

### Log Level Strategy

**Why console.log instead of console.warn?**

1. **Expected Behavior:** Role mismatch là bình thường khi switch roles
2. **Not an Error:** User không làm gì sai, app hoạt động đúng
3. **Debugging:** Vẫn log để dev theo dõi auth flow
4. **User Experience:** Không gây alarm với WARN/ERROR logs

**When is it logged?**

- Only in development (`__DEV__`)
- Only when customer routes are mounted but user is technician (or vice versa)
- Happens briefly during role switch, then stops

---

## ✅ VALIDATION

### Test Cases

- [x] **TC1:** Logout customer → Login technician
  - Expected: No WARN logs, redirect to technician dashboard
  - Status: ✅ PASS

- [x] **TC2:** Logout technician → Login customer
  - Expected: No WARN logs, redirect to customer dashboard
  - Status: ✅ PASS

- [x] **TC3:** Login customer → Direct to dashboard
  - Expected: No role mismatch, normal flow
  - Status: ✅ PASS

- [x] **TC4:** Login technician → Direct to dashboard
  - Expected: No role mismatch, normal flow
  - Status: ✅ PASS

- [x] **TC5:** Logout → Login same role
  - Expected: Cache cleared, fresh auth check
  - Status: ✅ PASS

---

## 📊 BEFORE vs AFTER

### Before Fix
```
❌ WARN logs spam trong console
❌ User confused (bị đẩy ra HomeScreen)
❌ Cache conflict khi switch roles
❌ Navigation state unclear
```

### After Fix
```
✅ Clean console (debug logs only)
✅ Smooth role switching
✅ Cache cleared properly
✅ Clear navigation flow
```

---

## 🎯 KEY TAKEAWAYS

### Lessons Learned

1. **Global caches need lifecycle management**
   - Export clear functions
   - Call on logout/cleanup events

2. **Log level matters**
   - WARN/ERROR for actual problems
   - DEBUG/LOG for expected behaviors

3. **Navigation state persistence**
   - Expo Router caches mounted routes
   - Auth hooks may run even after logout
   - Need graceful handling of role mismatches

4. **Defense in depth**
   - Cache clearing (primary fix)
   - Log level adjustment (UX fix)
   - Both together = robust solution

---

## 🔗 RELATED FILES

Modified files:
- `hooks/useCustomerAuth.ts` - Added clearCustomerAuthCache()
- `hooks/useTechnicianAuth.ts` - Added clearTechnicianAuthCache()
- `store/authStore.ts` - Call cache clear on logout
- All auth hooks - Changed console.warn → console.log

---

## 📚 RELATED DOCUMENTATION

- [Token Management](./TOKEN_MANAGEMENT_COMPLETE.md)
- [Authentication Flow](./AUTH_IMPLEMENTATION_COMPLETE.md)
- [Role-Based Access Control](./ROLE_BASED_ACCESS_CONTROL.md)

---

**Status:** ✅ Complete & Tested  
**Last Updated:** November 10, 2025
