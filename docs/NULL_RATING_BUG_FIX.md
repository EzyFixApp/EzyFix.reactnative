# 🐛 Null Rating Bug Fix

**Date:** November 10, 2025  
**Status:** ✅ Fixed

---

## 🔴 ERROR

```
ERROR  [TypeError: Cannot read property 'toFixed' of null]

Call Stack:
  CustomerOrderTracking (app\customer\order-tracking.tsx:1889)
```

---

## 🔍 ROOT CAUSE

### Problem
`technicianRating` có thể là `null` từ backend API, nhưng code cố gọi `.toFixed(1)` mà không kiểm tra `null`.

### Code Before Fix

```typescript
// ❌ WRONG - Only checks undefined, not null
{order.technicianRating !== undefined && (
  <View style={styles.technicianRatingRow}>
    <Text>{order.technicianRating.toFixed(1)}</Text>
  </View>
)}

// ❌ WRONG - Direct assignment without validation
technicianRating = relevantOffer.technician.technicianRating;
```

### Why It Failed

1. **Backend returns `null`** - Không phải `undefined`
2. **Only checked `!== undefined`** - Không check `!== null`
3. **Direct assignment** - Không validate trước khi assign

---

## ✅ SOLUTION

### Fix 1: Safe Rendering with Null Check

```typescript
// ✅ CORRECT - Check both undefined AND null
{order.technicianRating !== undefined && order.technicianRating !== null && (
  <View style={styles.technicianRatingRow}>
    <Ionicons name="star" size={16} color="#F59E0B" />
    <Text style={styles.technicianRatingText}>
      {order.technicianRating.toFixed(1)}
    </Text>
  </View>
)}
```

**File:** `app/customer/order-tracking.tsx` (line ~1885)

---

### Fix 2: Safe Assignment with Type Check

```typescript
// ✅ CORRECT - Validate before assigning (3 locations)

// Location 1: offer.technician.technicianName branch
if (relevantOffer.technician?.technicianName) {
  technicianName = relevantOffer.technician.technicianName;
  technicianAvatar = relevantOffer.technician.technicianAvatar;
  // Only assign rating if it's a valid number
  if (typeof relevantOffer.technician.technicianRating === 'number') {
    technicianRating = relevantOffer.technician.technicianRating;
  }
}

// Location 2: offer.technician.user branch
else if (relevantOffer.technician?.user?.firstName || ...) {
  // ... name assignment ...
  // Only assign rating if it's a valid number
  if (typeof relevantOffer.technician.technicianRating === 'number') {
    technicianRating = relevantOffer.technician.technicianRating;
  }
}

// Location 3: offer.technician.firstName branch
else if (relevantOffer.technician?.firstName || ...) {
  // ... name assignment ...
  // Only assign rating if it's a valid number
  if (typeof relevantOffer.technician.technicianRating === 'number') {
    technicianRating = relevantOffer.technician.technicianRating;
  }
}
```

**File:** `app/customer/order-tracking.tsx` (lines ~520-546)

---

### Fix 3: Safe Pending Quote Assignment

```typescript
// ✅ CORRECT - Conditional assignment with ternary
technician: offerDetails.technician ? {
  technicianId: offerDetails.technician.technicianId,
  technicianName: offerDetails.technician.technicianName || 'Thợ',
  technicianAvatar: offerDetails.technician.technicianAvatar,
  // Only include rating if it's a valid number
  technicianRating: typeof offerDetails.technician.technicianRating === 'number' 
    ? offerDetails.technician.technicianRating 
    : undefined,
} : undefined
```

**File:** `app/customer/order-tracking.tsx` (line ~663)

---

## 🎯 KEY POINTS

### JavaScript Type Checking

**Null vs Undefined:**
```typescript
// ❌ WRONG - null !== undefined in JavaScript
if (value !== undefined) { 
  value.toFixed(1); // Still crashes if value = null
}

// ✅ CORRECT - Check both
if (value !== undefined && value !== null) {
  value.toFixed(1);
}

// ✅ BEST - Type check
if (typeof value === 'number') {
  value.toFixed(1);
}
```

### Why `typeof` is Better

1. **Single check** - Handles both `null` and `undefined`
2. **Type safety** - Ensures it's actually a number
3. **No NaN** - Rejects `NaN` values too
4. **Clean code** - One condition instead of two

---

## 📊 LOCATIONS FIXED

### Modified Files
- `app/customer/order-tracking.tsx`

### Changes Summary
- **1 rendering location** - Added `&& order.technicianRating !== null`
- **3 assignment locations** - Added `typeof === 'number'` check
- **1 pending quote** - Added conditional ternary

Total: **5 fixes** across the file

---

## ✅ VALIDATION

### Test Cases

- [x] **TC1:** Order with rating = null
  - Before: ❌ Crash "Cannot read property toFixed of null"
  - After: ✅ Rating hidden, no crash

- [x] **TC2:** Order with rating = undefined
  - Before: ✅ Already handled
  - After: ✅ Still works

- [x] **TC3:** Order with valid rating (e.g., 4.5)
  - Before: ✅ Shows "4.5"
  - After: ✅ Shows "4.5"

- [x] **TC4:** Order with rating = 0
  - Before: ✅ Shows "0.0"
  - After: ✅ Shows "0.0"

- [x] **TC5:** Order with no technician
  - Before: ✅ No crash (technician check first)
  - After: ✅ No crash

---

## 🔗 RELATED

### Similar Patterns to Watch

```typescript
// Other places that might have same issue:
// - Any .toFixed() calls
// - Any .toLocaleString() calls
// - Any .toString() calls on potentially null values

// Safe pattern:
if (typeof value === 'number') {
  return value.toFixed(2);
}
return 'N/A'; // or undefined, or hide UI
```

---

## 📚 LESSONS LEARNED

1. **Always check for null AND undefined** when dealing with API data
2. **`typeof` check is safer** than comparing to undefined/null
3. **Backend can return null** even if type says `number | undefined`
4. **Defensive programming** - Validate before using methods like `.toFixed()`

---

**Status:** ✅ Complete & Tested  
**Last Updated:** November 10, 2025
