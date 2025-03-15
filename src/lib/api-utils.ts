
import { toast } from "sonner";

// Mock data for WooCommerce API fallback
export const mockWooCommerceData = {
  products: [
    { id: 1, name: "Sample Product 1", price: "100000", stock_quantity: 10 },
    { id: 2, name: "Sample Product 2", price: "200000", stock_quantity: 20 }
  ],
  orders: [
    { id: 1, status: "processing", total: "100000", customer_id: 1 },
    { id: 2, status: "completed", total: "200000", customer_id: 2 }
  ]
};

/**
 * Checks if the custom API is working
 * @returns Promise with API status
 */
export async function checkAPIStatus() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json'}/custom/v1/status?_=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`API status check failed: ${response.status}`);
    }
    const data = await response.json();
    console.info('Custom API response data:', data);
    return {
      status: data,
      isConnected: true
    };
  } catch (error) {
    console.error('Error checking API status:', error);
    return { 
      status: { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      },
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetches data from the custom API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchCustomAPI(endpoint: string, options: any = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json'}/custom/v1${endpoint}`;
    console.info(`Fetching Custom API: ${endpoint}`, url);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.info('Custom API response data:', data);
    return data;
  } catch (error) {
    console.error(`Error fetching from custom API (${endpoint}):`, error);
    // Don't show toast for GET requests to avoid flooding the UI
    if (!options.suppressToast && options.method && options.method !== 'GET') {
      toast.error(`Lỗi API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    throw error;
  }
}

/**
 * Fetches data from the WooCommerce REST API
 * @param endpoint API endpoint
 * @param options Fetch options
 * @returns Promise with response data
 */
export async function fetchWooCommerce(endpoint: string, options: any = {}) {
  try {
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_API_URL || 'https://hmm.vn/wp-json/wc/v3'}${endpoint}`;
    console.info(`Fetching WooCommerce API: ${endpoint}`);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`WooCommerce API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from WooCommerce API (${endpoint}):`, error);
    
    // For GET requests on products/orders, use mock data as fallback
    if (options.method === 'GET' || !options.method) {
      if (endpoint.includes('/products')) {
        console.info('Using mock product data as fallback');
        return mockWooCommerceData.products;
      } else if (endpoint.includes('/orders')) {
        console.info('Using mock order data as fallback');
        return mockWooCommerceData.orders;
      }
    }
    
    // Don't show toast for GET requests to avoid flooding the UI
    if (!options.suppressToast && options.method && options.method !== 'GET') {
      toast.error(`Lỗi WooCommerce API: ${error instanceof Error ? error.message : 'Không thể kết nối tới máy chủ'}`);
    }
    throw error;
  }
}

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

    // If there's a body, stringify it
    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json/wp/v2'}${endpoint}`;
    console.info(`Fetching WordPress API: ${endpoint}`);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`WordPress API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching from WordPress API (${endpoint}):`, error);
    
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
    
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://hmm.vn/wp-json'}/wp/v2/media`;
    console.info('Uploading file to WordPress media library');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // Don't set Content-Type header for FormData
      },
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
 * Export data to CSV file
 * @param filename File name without extension
 * @param data Array of objects to export
 */
export function exportToCSV(filename: string, data: any[]) {
  if (!data || data.length === 0) {
    toast.error("Không có dữ liệu để xuất");
    return;
  }
  
  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [];
    
    // Add headers row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape double quotes and wrap values with commas in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    toast.success("Xuất dữ liệu thành công");
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error(`Lỗi xuất dữ liệu: ${error instanceof Error ? error.message : 'Không thể xuất dữ liệu'}`);
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
