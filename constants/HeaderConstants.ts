import { Platform, StatusBar } from 'react-native';

/**
 * Header Constants for consistent header heights across all technician pages
 * Ensures smooth transitions and professional UX
 */
export const HEADER_CONSTANTS = {
  // Status bar heights
  STATUS_BAR_HEIGHT: Platform.OS === 'android' 
    ? (StatusBar.currentHeight || 24) 
    : 44, // iOS safe area (notch)
  
  // Padding values for detail pages (order-details, order-history, etc.)
  HEADER_PADDING_TOP: 16,
  HEADER_PADDING_BOTTOM: 16,
  HEADER_PADDING_HORIZONTAL: 16,
  
  // Content heights
  HEADER_CONTENT_HEIGHT: 40, // Back button height
  
  // Calculated total heights for detail pages
  get DETAIL_PAGE_HEADER_HEIGHT(): number {
    return this.STATUS_BAR_HEIGHT + 
           this.HEADER_PADDING_TOP + 
           this.HEADER_CONTENT_HEIGHT + 
           this.HEADER_PADDING_BOTTOM;
  },
  
  // For TechnicianHeader component (used in dashboard)
  TECHNICIAN_HEADER_PADDING_TOP: 60, // Status bar + extra space
  TECHNICIAN_HEADER_PADDING_BOTTOM: 20,
  TECHNICIAN_HEADER_CONTENT_HEIGHT: 44, // Search + Title + Notification
  
  get TECHNICIAN_HEADER_TOTAL_HEIGHT(): number {
    return this.TECHNICIAN_HEADER_PADDING_TOP + 
           this.TECHNICIAN_HEADER_CONTENT_HEIGHT + 
           this.TECHNICIAN_HEADER_PADDING_BOTTOM;
  },
  
  // Back button dimensions
  BACK_BUTTON_SIZE: 40,
  BACK_BUTTON_RADIUS: 20,
};

/**
 * Standard header style object for detail pages
 * Use this in StyleSheet.create() for consistent headers
 */
export const STANDARD_HEADER_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  paddingHorizontal: HEADER_CONSTANTS.HEADER_PADDING_HORIZONTAL,
  paddingVertical: HEADER_CONSTANTS.HEADER_PADDING_BOTTOM,
  paddingTop: HEADER_CONSTANTS.STATUS_BAR_HEIGHT + HEADER_CONSTANTS.HEADER_PADDING_TOP,
};

/**
 * Standard back button style
 */
export const STANDARD_BACK_BUTTON_STYLE = {
  width: HEADER_CONSTANTS.BACK_BUTTON_SIZE,
  height: HEADER_CONSTANTS.BACK_BUTTON_SIZE,
  borderRadius: HEADER_CONSTANTS.BACK_BUTTON_RADIUS,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
