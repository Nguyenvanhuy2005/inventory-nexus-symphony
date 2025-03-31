
import { toast } from "sonner";
import { API_BASE_URL } from "./base-api";
import { DEFAULT_WORDPRESS_CREDENTIALS } from "../auth-utils";
import { mockWooCommerceData } from "./mock-data";

/**
 * Fetches data from the WordPress REST API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchWordPress(endpoint: string, options: any = {}) {
  try {
    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;

    // Prepare authentication headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    });
    
    // Add header Basic Authentication
    const authToken = btoa(`${username}:${password}`);
    headers.set('Authorization', `Basic ${authToken}`);

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: headers,
      credentials: 'include',
      mode: 'cors',
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${API_BASE_URL}/wp/v2${endpoint}`;
    console.info(`Fetching WordPress API: ${endpoint}`, {
      url,
      method: fetchOptions.method || 'GET',
      hasAuth: true
    });

    try {
      // Implement fetch with timeout for better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      fetchOptions.signal = controller.signal;
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      console.log('WordPress API Response received:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        // Get response text for better error messages
        let errorText = await response.text();
        try {
          // Try to parse as JSON for structured error messages
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorText = errorJson.message;
          } else if (errorJson.error) {
            errorText = errorJson.error;
          }
        } catch (e) {
          // Not JSON, keep as is
        }
        
        console.error(`WordPress API request failed (${response.status}):`, errorText);
        
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error(`Lỗi xác thực WordPress: Thông tin đăng nhập không chính xác hoặc không đủ quyền (${response.status})`);
        } else if (response.status === 404) {
          throw new Error(`WordPress endpoint không tồn tại (${response.status})`);
        } else if (response.status === 403) {
          throw new Error(`Bạn không có quyền truy cập WordPress API này (${response.status})`);
        }
        
        throw new Error(`WordPress API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.info(`WordPress API response data for ${endpoint}:`, data);
      return data;
      
    } catch (error) {
      // Handle fetch errors with more detailed info
      console.error(`Fetch error for WordPress API ${endpoint}:`, error);
      
      // Check if it's a timeout
      if (error.name === 'AbortError') {
        throw new Error(`Kết nối đến WordPress API đã hết thời gian chờ. Vui lòng kiểm tra mạng của bạn hoặc thử lại sau.`);
      }
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('This might be a CORS issue. Check CORS configuration on the server.');
        throw new Error(`Kết nối đến WordPress API thất bại. Có thể do lỗi CORS hoặc server không chấp nhận kết nối từ origin này.`);
      }
      
      // Rethrow the error for further handling
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching from WordPress API (${endpoint}):`, error);

    // Fallback for users endpoint
    if (endpoint.includes('/users')) {
      return mockWooCommerceData.users;
    }

    // Don't show toast for GET requests to avoid flooding the UI
    if (!options.suppressToast && options.method && options.method !== 'GET') {
      toast.error(`Lỗi WordPress API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    throw error;
  }
}

/**
 * Uploads a file as an attachment
 * @param file The file to upload
 * @returns Promise with uploaded file data
 */
export async function uploadAttachment(file: File) {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Use the new HMM Core API endpoint for file uploads
    const url = `${API_BASE_URL}/hmm/v1/media/upload`;
    console.info('Uploading file to WordPress media library');
    
    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;

    // Add header Basic Authentication
    const headers = {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`)
    };
    
    // Implement fetch with timeout for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for uploads
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorText = errorJson.message;
        }
      } catch (e) {
        // Not JSON, keep as is
      }
      throw new Error(`File upload failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.info('File uploaded successfully:', data);
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error(`Lỗi tải file: ${error instanceof Error ? error.message : 'Không thể tải lên tệp'}`);
    throw error;
  }
}

/**
 * Get WordPress users
 * @returns Promise with WordPress users data
 */
export async function getWordPressUsers() {
  try {
    return await fetchWordPress('/users?per_page=100');
  } catch (error) {
    console.error('Error fetching WordPress users:', error);
    return [];
  }
}

/**
 * Create an attachment association for an entity (using HMM Core API)
 * @param params Attachment parameters
 * @returns Created attachment data
 */
export async function createAttachment(params: {
  entity_type: string;
  entity_id: number;
  media_id?: number;
  attachment_url: string;
  filename: string;
  mime_type?: string;
}) {
  try {
    // Get authentication credentials
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;

    // Add header Basic Authentication
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${username}:${password}`)
    };
    
    const url = `${API_BASE_URL}/hmm/v1/media/attachments`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create attachment failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.info('Attachment created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating attachment:', error);
    toast.error(`Lỗi tạo liên kết tệp: ${error instanceof Error ? error.message : 'Đã xảy ra lỗi'}`);
    throw error;
  }
}

/**
 * Get attachments for an entity (using HMM Core API)
 * @param entityType Type of entity
 * @param entityId ID of entity
 * @returns Attachments list
 */
export async function getAttachments(entityType: string, entityId: number) {
  try {
    const url = `${API_BASE_URL}/hmm/v1/media/attachments/${entityType}/${entityId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Get attachments failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.info(`Attachments for ${entityType} ${entityId}:`, data);
    return data;
  } catch (error) {
    console.error('Error getting attachments:', error);
    return [];
  }
}
