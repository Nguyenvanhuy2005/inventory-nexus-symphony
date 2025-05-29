
import { fetchWooCommerce, fetchWordPress } from './api';
import { fetchCustomAPI } from './api/custom-api';

export const DEFAULT_WOOCOMMERCE_CREDENTIALS = {
  consumer_key: 'ck_7935a07888db15201ea09300934d277d69064c33',
  consumer_secret: 'cs_27e30b01add28dcdf89ad3c12be21e096969c09d'
};

export const DEFAULT_WORDPRESS_CREDENTIALS = {
  username: 'Sithethao',
  application_password: 'LDUe HXkt Le1k ZmJT tkmL OVHs'
};

/**
 * Initialize default credentials if not already set
 */
export function initializeDefaultCredentials() {
  // Initialize WooCommerce credentials if not set
  if (!localStorage.getItem('woocommerce_consumer_key')) {
    localStorage.setItem('woocommerce_consumer_key', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
  }
  if (!localStorage.getItem('woocommerce_consumer_secret')) {
    localStorage.setItem('woocommerce_consumer_secret', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
  }
  
  // Initialize WordPress credentials if not set
  if (!localStorage.getItem('wordpress_username')) {
    localStorage.setItem('wordpress_username', DEFAULT_WORDPRESS_CREDENTIALS.username);
  }
  if (!localStorage.getItem('wordpress_application_password')) {
    localStorage.setItem('wordpress_application_password', DEFAULT_WORDPRESS_CREDENTIALS.application_password);
  }
  
  // Set default API URLs if not set
  if (!localStorage.getItem('api_url')) {
    localStorage.setItem('api_url', 'https://hanoi.sithethao.com/wp-json');
  }
  if (!localStorage.getItem('woocommerce_api_url')) {
    localStorage.setItem('woocommerce_api_url', 'https://hanoi.sithethao.com/wp-json/wc/v3');
  }
}

/**
 * Check if WooCommerce API is accessible
 */
export async function checkWooCommerceAuth(): Promise<{ isAuthenticated: boolean; error?: string }> {
  try {
    console.log('Checking WooCommerce API authentication...');
    await fetchWooCommerce('/products', { 
      params: { per_page: '1' }, 
      suppressToast: true 
    });
    return { isAuthenticated: true };
  } catch (error) {
    console.error('WooCommerce auth check failed:', error);
    return { 
      isAuthenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if WordPress API is accessible
 */
export async function checkWordPressAuth(): Promise<{ isAuthenticated: boolean; error?: string }> {
  try {
    console.log('Checking WordPress API authentication...');
    await fetchWordPress('/users/me', { suppressToast: true });
    return { isAuthenticated: true };
  } catch (error) {
    console.error('WordPress auth check failed:', error);
    return { 
      isAuthenticated: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if HMM API Bridge is accessible
 */
export async function checkDatabaseApiAuth(): Promise<{ 
  isAuthenticated: boolean; 
  error?: string; 
  version?: string; 
  tables?: any[] 
}> {
  try {
    console.log('Checking HMM API Bridge authentication...');
    
    // Kiểm tra endpoint status của HMM API Bridge
    const statusResult = await fetchCustomAPI('/hmm/v1/status', {
      method: 'GET',
      suppressToast: true
    });
    
    if (statusResult && statusResult.status === 'active') {
      // Lấy danh sách bảng
      const tablesResult = await fetchCustomAPI('/hmm/v1/tables', {
        method: 'GET',
        suppressToast: true
      });
      
      return {
        isAuthenticated: true,
        version: statusResult.version,
        tables: tablesResult?.tables || []
      };
    }
    
    return {
      isAuthenticated: false,
      error: 'HMM API Bridge không hoạt động'
    };
  } catch (error) {
    console.error('HMM API Bridge auth check failed:', error);
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tables: []
    };
  }
}

/**
 * Check if system is fully connected
 */
export function isFullyConnected(): boolean {
  return !!(
    localStorage.getItem('woocommerce_consumer_key') && 
    localStorage.getItem('woocommerce_consumer_secret') &&
    localStorage.getItem('wordpress_username') && 
    localStorage.getItem('wordpress_application_password')
  );
}

/**
 * Get authentication status for all APIs
 */
export async function getAuthStatus() {
  console.log('Starting comprehensive auth status check...');
  
  const [woocommerceStatus, wordpressStatus, databaseApiStatus] = await Promise.all([
    checkWooCommerceAuth(),
    checkWordPressAuth(),
    checkDatabaseApiAuth()
  ]);

  const authStatus = {
    woocommerce: {
      isAuthenticated: woocommerceStatus.isAuthenticated,
      error: woocommerceStatus.error || null,
      hasCredentials: !!(
        localStorage.getItem('woocommerce_consumer_key') && 
        localStorage.getItem('woocommerce_consumer_secret')
      )
    },
    wordpress: {
      isAuthenticated: wordpressStatus.isAuthenticated,
      error: wordpressStatus.error || null,
      hasCredentials: !!(
        localStorage.getItem('wordpress_username') && 
        localStorage.getItem('wordpress_application_password')
      )
    },
    databaseApi: {
      isAuthenticated: databaseApiStatus.isAuthenticated,
      error: databaseApiStatus.error || null,
      version: databaseApiStatus.version || null,
      tables: databaseApiStatus.tables || []
    },
    // Alias cho backward compatibility
    coreApi: {
      isAuthenticated: databaseApiStatus.isAuthenticated,
      error: databaseApiStatus.error || null,
      version: databaseApiStatus.version || null,
      tables: databaseApiStatus.tables || []
    },
    status: {
      wordpress: {
        connected: wordpressStatus.isAuthenticated && databaseApiStatus.isAuthenticated,
        message: databaseApiStatus.isAuthenticated 
          ? 'Kết nối thành công với HMM API Bridge'
          : (databaseApiStatus.error || 'Không thể kết nối với HMM API Bridge')
      }
    }
  };

  console.log('Auth status check complete:', authStatus);
  return authStatus;
}

/**
 * Check if user has valid credentials stored
 */
export function hasStoredCredentials(): boolean {
  const wooKey = localStorage.getItem('woocommerce_consumer_key');
  const wooSecret = localStorage.getItem('woocommerce_consumer_secret');
  const wpUser = localStorage.getItem('wordpress_username');
  const wpPass = localStorage.getItem('wordpress_application_password');
  
  return !!(wooKey && wooSecret && wpUser && wpPass);
}
