
import { toast } from "sonner";
import { API_BASE_URL } from "./base-api";
import { DEFAULT_WORDPRESS_CREDENTIALS } from "../auth-utils";
import { mockWooCommerceData } from "./mock-data";

/**
 * Fetches data from the custom API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchCustomAPI(endpoint: string, options: any = {}) {
  try {
    // Get authentication credentials from localStorage or defaults
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;
    
    // Log credentials being used (partially masked for security)
    console.info('Using credentials for API call:', {
      endpoint,
      username,
      passwordLength: password ? password.length : 0,
    });
    
    // Prepare authentication headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    });
    
    // Add Basic Auth for all API calls (including Database API)
    const authToken = btoa(`${username}:${password}`);
    headers.set('Authorization', `Basic ${authToken}`);
    
    // Check if this is a Database API call (starts with /hmm/v1)
    const isDatabaseApiCall = endpoint.startsWith('/hmm/v1');
    
    // For Database API calls, use the direct endpoint without the 'custom/v1' prefix
    const url = isDatabaseApiCall 
      ? `${API_BASE_URL}${endpoint}`
      : `${API_BASE_URL}/custom/v1${endpoint}`;
      
    console.info(`Fetching ${isDatabaseApiCall ? 'Database' : 'Custom'} API: ${endpoint}`, {
      url,
      method: options.method || 'GET',
      hasAuth: !!authToken,
      username: username
    });
    
    // Allow OPTIONS requests for CORS preflight
    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers: headers,
      credentials: 'include', // Include cookies if any
      mode: 'cors',
      ...options
    };

    // Remove headers property since we've already processed it
    if (fetchOptions.headers !== headers) {
      delete fetchOptions.headers;
      fetchOptions.headers = headers;
    }

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    
    // Log full request details
    console.log('API Request details:', {
      endpoint,
      url,
      method: fetchOptions.method,
      headers: Object.fromEntries(headers),
      credentials: fetchOptions.credentials,
      mode: fetchOptions.mode,
      hasBody: !!fetchOptions.body
    });
    
    try {
      const response = await fetch(url, fetchOptions);
      
      console.log('API Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed (${response.status}):`, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.info(`${isDatabaseApiCall ? 'Database' : 'Custom'} API response data:`, data);
      return data;
    } catch (error) {
      // Handle fetch errors with more detailed info
      console.error(`Fetch error for ${url}:`, error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('This might be a CORS issue. Check CORS configuration on the server.');
        throw new Error(`Kết nối đến API thất bại. Có thể do lỗi CORS hoặc server không chấp nhận kết nối từ origin này.`);
      }
      
      // Rethrow the error for further handling
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching from ${endpoint.startsWith('/hmm/v1') ? 'Database' : 'Custom'} API (${endpoint}):`, error);
    // Don't show toast for GET requests to avoid flooding the UI
    if (!options.suppressToast && options.method && options.method !== 'GET') {
      toast.error(`Lỗi API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    
    // Mock data for development
    if (endpoint === '/stock-transactions' && options.method === 'GET') {
      return {
        transactions: mockWooCommerceData.stockTransactions,
        total: mockWooCommerceData.stockTransactions.length,
        page: 1,
        per_page: 100,
        total_pages: 1
      };
    }
    
    throw error;
  }
}

/**
 * Check Database API connection and authentication
 * @returns Promise with auth status
 */
export async function checkDatabaseApiAuth() {
  try {
    // Log that we're checking authentication
    console.log('Checking Database API authentication...');
    
    // Use explicit credentials instead of relying on fetchCustomAPI to handle it
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;
    const authToken = btoa(`${username}:${password}`);
    
    // Log credentials being used (partially masked for security)
    console.log('Using credentials for API status check:', {
      username: username,
      passwordLength: password ? password.length : 0,
      authTokenStart: authToken.substring(0, 10) + '...'
    });
    
    // Try to connect directly to the status endpoint
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Basic ${authToken}`
    });
    
    const url = `${API_BASE_URL}/hmm/v1/status`;
    console.log('Checking Database API connection with URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include',
        mode: 'cors'
      });
      
      console.log('Database API auth check response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Database API auth check failed (${response.status}):`, errorText);
        
        if (response.status === 401) {
          return {
            isAuthenticated: false,
            error: 'Lỗi xác thực (401): Thông tin đăng nhập không hợp lệ',
            version: null,
            tables: []
          };
        } else if (response.status === 404) {
          return {
            isAuthenticated: false,
            error: 'Lỗi 404: Plugin HMM Database API có thể chưa được kích hoạt',
            version: null,
            tables: []
          };
        } else {
          return {
            isAuthenticated: false,
            error: `Lỗi ${response.status}: ${errorText}`,
            version: null,
            tables: []
          };
        }
      }
      
      const result = await response.json();
      console.log('Database API auth check succeeded:', result);
      
      return {
        isAuthenticated: true,
        error: null,
        version: result.version,
        tables: result.custom_tables || []
      };
      
    } catch (error) {
      console.error('Fetch error during Database API auth check:', error);
      
      let errorMessage = 'Không thể kết nối tới Database API';
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Kết nối thất bại. Có thể do lỗi CORS hoặc máy chủ không phản hồi.';
        console.error('This might be a CORS issue. Check CORS configuration on the server.');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        isAuthenticated: false,
        error: errorMessage,
        version: null,
        tables: []
      };
    }
  } catch (error) {
    console.error('Database API authentication check failed:', error);
    
    let errorMessage = 'Không thể kết nối tới Database API';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      isAuthenticated: false,
      error: errorMessage,
      version: null,
      tables: []
    };
  }
}

/**
 * Fetch stock levels from the custom API
 * @returns Promise with stock levels data
 */
export async function fetchStockLevels() {
  try {
    return await fetchCustomAPI('/stock-levels');
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return [];
  }
}
