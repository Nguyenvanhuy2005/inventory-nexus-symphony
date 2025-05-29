import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from './api';

/**
 * Default WooCommerce credentials - These will be used if not overridden by localStorage
 */
export const DEFAULT_WOOCOMMERCE_CREDENTIALS = {
  consumer_key: 'ck_9a08dab6d619a933fb4b74b17cc76edb7c7b5908',
  consumer_secret: 'cs_ad4d24dce9c2169bd06d0baaeeda0e124ccf091a'
};

/**
 * Default WordPress credentials
 */
export const DEFAULT_WORDPRESS_CREDENTIALS = {
  username: 'sithethao',
  application_password: '6hBc KVnc HgAB WQsM l8BT tlGq'
};

/**
 * Checks if WooCommerce API credentials are valid
 */
export async function checkWooCommerceAuth(): Promise<boolean> {
  try {
    // Ensure credentials are initialized
    initializeDefaultCredentials();
    
    // Try to fetch a simple endpoint that requires authentication
    const result = await fetchWooCommerce('/system_status', {
      suppressToast: true
    });
    return !!result;
  } catch (error) {
    console.error('WooCommerce authentication failed:', error);
    return false;
  }
}

/**
 * Checks if Database API credentials are valid
 */
export async function checkDatabaseApiAuth(): Promise<{isAuthenticated: boolean, error: string | null, version?: string | null, tables?: any[]}> {
  try {
    const username = localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username;
    const password = localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password;
    
    if (!username || !password) {
      console.error('Missing WordPress credentials');
      return {
        isAuthenticated: false,
        error: 'Thiếu thông tin đăng nhập WordPress',
        version: null,
        tables: []
      };
    }
    
    console.log('Checking Database API auth with credentials:', {
      username: username,
      passwordLength: password ? password.length : 0
    });
    
    // Use the improved checkDatabaseApiAuth function from custom-api.ts
    const result = await fetchCustomAPI('/hmm/v1/status', { 
      suppressToast: true,
      // Explicitly set headers to ensure authentication is correct
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`
      }
    });
    
    console.log('Database API auth check succeeded with result:', result);
    
    return {
      isAuthenticated: true,
      error: null,
      version: result?.version,
      tables: result?.custom_tables || []
    };
  } catch (error) {
    console.error('Database API authentication failed:', error);
    let errorMessage = 'Database API authentication failed';
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'Lỗi xác thực (401): Thông tin xác thực không hợp lệ';
      } else if (error.message.includes('404')) {
        errorMessage = 'Lỗi 404: Endpoint không tồn tại, kiểm tra plugin HMM Database API';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'Lỗi CORS: Máy chủ không chấp nhận kết nối từ origin này';
      } else {
        errorMessage = error.message;
      }
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
 * Gets authentication status for various APIs
 */
export async function getAuthStatus() {
  initializeDefaultCredentials();
  
  const wooCommerceAuth = await checkWooCommerceAuth();
  const databaseApiAuth = await checkDatabaseApiAuth();
  
  let wpConnected = false;
  try {
    await fetchWordPress('/users', { suppressToast: true });
    wpConnected = true;
  } catch (error) {
    console.error('WordPress API check failed:', error);
  }

  return {
    woocommerce: {
      isAuthenticated: wooCommerceAuth,
      hasCredentials: !!localStorage.getItem('woocommerce_consumer_key') && !!localStorage.getItem('woocommerce_consumer_secret')
    },
    databaseApi: {
      isAuthenticated: databaseApiAuth.isAuthenticated,
      error: databaseApiAuth.error,
      version: databaseApiAuth.version,
      tables: databaseApiAuth.tables
    },
    status: {
      wordpress: {
        connected: wpConnected,
        message: wpConnected ? 'Connected' : 'Failed to connect'
      }
    }
  };
}

/**
 * Initialize default API credentials
 */
export function initializeDefaultCredentials() {
  // Initialize WooCommerce credentials
  if (!localStorage.getItem('woocommerce_consumer_key') || localStorage.getItem('woocommerce_consumer_key') === '') {
    localStorage.setItem('woocommerce_consumer_key', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
  }
  
  if (!localStorage.getItem('woocommerce_consumer_secret') || localStorage.getItem('woocommerce_consumer_secret') === '') {
    localStorage.setItem('woocommerce_consumer_secret', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
  }
  
  // Also initialize WordPress credentials if needed
  if (!localStorage.getItem('wordpress_username') || localStorage.getItem('wordpress_username') === '') {
    localStorage.setItem('wordpress_username', DEFAULT_WORDPRESS_CREDENTIALS.username);
  }
  
  if (!localStorage.getItem('wordpress_application_password') || localStorage.getItem('wordpress_application_password') === '') {
    localStorage.setItem('wordpress_application_password', DEFAULT_WORDPRESS_CREDENTIALS.application_password);
  }
  
  // Initialize API URL if not set
  if (!localStorage.getItem('api_url')) {
    localStorage.setItem('api_url', 'https://hanoi.sithethao.com/wp-json');
  }
  
  if (!localStorage.getItem('woocommerce_api_url')) {
    localStorage.setItem('woocommerce_api_url', 'https://hanoi.sithethao.com/wp-json/wc/v3');
  }
  
  console.log('API credentials initialized:', {
    woo_key: localStorage.getItem('woocommerce_consumer_key'),
    woo_secret: localStorage.getItem('woocommerce_consumer_secret')?.substring(0, 5) + '...',
    wp_username: localStorage.getItem('wordpress_username'),
    wp_password_length: localStorage.getItem('wordpress_application_password')?.length || 0,
    api_url: localStorage.getItem('api_url'),
    woocommerce_api_url: localStorage.getItem('woocommerce_api_url')
  });
}

/**
 * Check if all APIs are connected and authenticated
 */
export function isFullyConnected(): boolean {
  // This is a synchronous check just based on localStorage
  const hasWooCredentials = !!localStorage.getItem('woocommerce_consumer_key') && 
                          !!localStorage.getItem('woocommerce_consumer_secret');
  
  const hasWpCredentials = !!localStorage.getItem('wordpress_username') && 
                          !!localStorage.getItem('wordpress_application_password');
  
  return hasWooCredentials && hasWpCredentials;
}

/**
 * Clear any saved API credentials (for logout/reset)
 */
export function clearApiCredentials() {
  localStorage.removeItem('woocommerce_consumer_key');
  localStorage.removeItem('woocommerce_consumer_secret');
  localStorage.removeItem('wordpress_username');
  localStorage.removeItem('wordpress_application_password');
  console.log('All API credentials cleared');
}

/**
 * Get current WordPress credentials
 * @returns WordPress username and application password
 */
export function getWordPressCredentials() {
  return {
    username: localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username,
    applicationPassword: localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password
  };
}
