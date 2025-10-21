# Quick Fix: Technician Login Error

## Problem
❌ Console error when logging in as Technician:
```
GET /api/v1/serviceRequests - 403 Forbidden
```

## Solution
✅ Added role check to `ActiveOrdersSection.tsx`:

```typescript
// Only load for customer role
if (user?.userType !== 'customer') {
  setActiveOrders([]);
  return;
}
```

## Result
- ✅ No console error
- ✅ Section hidden for technicians
- ✅ Works normally for customers

## File Changed
- `components/ActiveOrdersSection.tsx`

## How It Works
1. Check user role before API call
2. Skip loading if not customer
3. Silent error handling for 403/404
4. Hide section when no orders

---
**Status:** ✅ Fixed  
**Date:** January 2025
