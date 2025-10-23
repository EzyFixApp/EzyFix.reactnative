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

  /**
   * Get media list by requestID or appointmentID
   * Returns all proof-of-work files (INITIAL/FINAL/EXCEED/PAYMENT) tied to a request or appointment
   */
  public async getMediaByRequest(requestID?: string, appointmentID?: string): Promise<MediaUploadResponse[]> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Build query params
      const params = new URLSearchParams();
      if (requestID) params.append('requestID', requestID);
      if (appointmentID) params.append('appointmentID', appointmentID);

      const url = `${API_BASE_URL}${API_ENDPOINTS.MEDIA.BASE}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Get media failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (result.is_success && result.data) {
        // Filter out media with NULL requestID/appointmentID to prevent cross-contamination
        // This handles legacy data or backend query issues
        let filteredData = result.data;
        if (requestID) {
          filteredData = result.data.filter((media: MediaUploadResponse) => 
            media.requestID === requestID
          );
        } else if (appointmentID) {
          filteredData = result.data.filter((media: MediaUploadResponse) => 
            media.appointmentID === appointmentID
          );
        }
        
        if (__DEV__) {
          console.log(`📸 Media fetched for ${requestID ? `request ${requestID}` : `appointment ${appointmentID}`}:`, filteredData.length, 'files (filtered from', result.data.length, 'total)');
        }
        return filteredData;
      } else {
        if (__DEV__) console.warn('Get media returned unsuccessful response:', result.message);
        return [];
      }
    } catch (error: any) {
      if (__DEV__) console.error('Get media error:', error);
      // Return empty array on error to prevent crashes
      return [];
    }
  }

  /**
   * Delete media file by ID
   */
  public async deleteMedia(mediaID: string): Promise<void> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.MEDIA.DELETE(mediaID)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Delete media failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (!result.is_success) {
        throw new Error(result.message || 'Delete failed');
      }

      if (__DEV__) console.log(`🗑️ Media deleted: ${mediaID}`);
    } catch (error: any) {
      if (__DEV__) console.error('Delete media error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mediaService = MediaService.getInstance();