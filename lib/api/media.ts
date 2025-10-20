/**
 * Media API Service
 * Handles media upload operations
 */

import { API_ENDPOINTS, API_BASE_URL } from './config';
import { authService } from './auth';

export type MediaType = 'ISSUE' | 'INITIAL' | 'EXCEED' | 'FINAL' | 'PAYMENT' | 'OTHER';

export interface MediaUploadResponse {
  mediaID: string;
  requestID: string;
  appointmentID?: string;
  mediaType: MediaType;
  fileURL: string;
  uploadedBy: string;
  uploadedDate: string;
}

export interface MediaUploadRequest {
  requestID: string;
  appointmentID?: string;
  mediaType: MediaType;
  file: {
    uri: string;
    type: string;
    name: string;
  };
}

export class MediaService {
  private static instance: MediaService;

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Upload media file
   */
  public async uploadMedia(uploadData: MediaUploadRequest): Promise<MediaUploadResponse> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('RequestID', uploadData.requestID);
      if (uploadData.appointmentID) {
        formData.append('AppointmentID', uploadData.appointmentID);
      }
      formData.append('MediaType', uploadData.mediaType);
      
      // Append file
      formData.append('File', {
        uri: uploadData.file.uri,
        type: uploadData.file.type,
        name: uploadData.file.name,
      } as any);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MEDIA.UPLOAD}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (result.is_success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Media upload error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple media files
   */
  public async uploadMultipleMedia(
    requestID: string,
    files: Array<{ uri: string; type: string; name: string }>,
    mediaType: MediaType = 'ISSUE',
    appointmentID?: string
  ): Promise<MediaUploadResponse[]> {
    try {
      const uploadPromises = files.map(file => 
        this.uploadMedia({
          requestID,
          appointmentID,
          mediaType,
          file
        })
      );

      return await Promise.all(uploadPromises);
    } catch (error: any) {
      if (__DEV__) console.error('Multiple media upload error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mediaService = MediaService.getInstance();