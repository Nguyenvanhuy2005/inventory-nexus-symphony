
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
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;

    // Add header Basic Authentication
    fetchOptions.headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${API_BASE_URL}/wp/v2${endpoint}`;
    console.info(`Fetching WordPress API: ${endpoint}`);

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`WordPress API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
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
    
    const url = `${API_BASE_URL}/wp/v2/media`;
    console.info('Uploading file to WordPress media library');
    
    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;

    // Add header Basic Authentication
    const headers = {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`)
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`File upload failed: ${response.status}`);
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
