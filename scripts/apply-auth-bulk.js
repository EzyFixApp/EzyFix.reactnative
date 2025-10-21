/**
 * Bulk Apply Auth Protection Script for Technician Screens
 * This file documents the manual steps to apply withTechnicianAuth
 */

// Files to protect (already done):
// ✅ dashboard.tsx
// ✅ orders.tsx
// ✅ profile.tsx
// ✅ activity.tsx
// ✅ statistics.tsx

// Files to protect (remaining):
const REMAINING_FILES = [
  'order-details.tsx',
  'order-tracking.tsx',
  'order-history-detail.tsx',
  'quote-selection.tsx',
  'technician-order-tracking.tsx',
  'personal-info.tsx',
  'notification-settings.tsx',
];

// Files to SKIP (public screens):
const PUBLIC_SCREENS = [
  'login.tsx',
  'register.tsx',
  'forgot-password.tsx',
  'otp-verification.tsx',
  'verify.tsx',
  'reset-password.tsx',
  'reset-password.old.tsx',
  'index.tsx', // Landing page
];

// Template for each file:
// 1. Add import at top:
// import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

// 2. Change export default function to just function:
// FROM: export default function ScreenName() {
// TO:   function ScreenName() {

// 3. Add export at bottom:
// export default withTechnicianAuth(ScreenName, {
//   redirectOnError: true,
//   autoCloseSeconds: 3,
// });
