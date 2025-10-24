/**
 * Appointments API Service
 * Handles all appointment-related API calls
 */

import { apiService } from './base';
import { API_ENDPOINTS } from './config';

// Appointment Status enum
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  CHECKING = 'CHECKING',
  REPAIRING = 'REPAIRING',
  REPAIRED = 'REPAIRED',
  ABSENT = 'ABSENT',
  CANCELLED = 'CANCELLED',
  DISPUTE = 'DISPUTE'
}

// Request/Response Types
export interface CreateAppointmentRequest {
  serviceRequestId: string;
  technicianId: string;
}

export interface CreateAppointmentResponse {
  appointmentId: string;
  serviceRequestId: string;
  technicianId: string;
  status: AppointmentStatus;
  scheduledDate: string;
}

export interface UpdateAppointmentRequest {
  status: AppointmentStatus;
  lat?: number | null;
  lng?: number | null;
  timestamp?: string | null;
  note?: string | null;
  media?: string[];
}

export interface UpdateAppointmentResponse {
  id: string;
  status: AppointmentStatus;
  updatedAt: string;
}

export interface AppointmentData {
  id: string;
  serviceRequestId: string;
  technicianId: string;
  status: AppointmentStatus;
  scheduledDate: string;
  arrivedAt: string | null;
  repairedAt: string | null;
}

class AppointmentsService {
  /**
   * Create a new appointment (SCHEDULED status)
   */
  async createAppointment(
    serviceRequestId: string,
    technicianId: string
  ): Promise<CreateAppointmentResponse> {
    try {
      const response = await apiService.post<CreateAppointmentResponse>(
        '/api/v1/appointments',
        { serviceRequestId, technicianId },
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tạo lịch hẹn');
      }
    } catch (error: any) {
      console.error('Create appointment error:', error);
      throw error;
    }
  }

  /**
   * Get appointment details by ID
   * Note: skipAutoLogoutOn401=true to handle cached appointmentId from other users gracefully
   */
  async getAppointment(appointmentId: string): Promise<AppointmentData> {
    try {
      const response = await apiService.get<AppointmentData>(
        `/api/v1/appointments/${appointmentId}`,
        undefined, // No query params
        { 
          requireAuth: true,
          skipAutoLogoutOn401: true // Don't trigger auto-logout on 401 (cached ID might be invalid)
        }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thông tin lịch hẹn');
      }
    } catch (error: any) {
      console.error('Get appointment error:', error);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    updateData: UpdateAppointmentRequest
  ): Promise<UpdateAppointmentResponse> {
    try {
      const response = await apiService.patch<UpdateAppointmentResponse>(
        `/api/v1/appointments/${appointmentId}`,
        updateData,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      throw error;
    }
  }
}

export const appointmentsService = new AppointmentsService();
