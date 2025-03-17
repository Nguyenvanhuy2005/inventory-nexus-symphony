
import { fetchWooCommerce } from './api-utils';

/**
 * Default WooCommerce credentials - These will be used if not overridden by localStorage
 */
export const DEFAULT_WOOCOMMERCE_CREDENTIALS = {
  consumer_key: 'ck_e34b9aa04c2d08378d4f0976773454e528b70e50',
  consumer_secret: 'cs_ed12b7fc28e091502f6eddf689967134d81ad13f'
};

/**
 * Default WordPress credentials
 */
export const DEFAULT_WORDPRESS_CREDENTIALS = {
  username: 'admin',
  application_password: 'ISJu eeS5 CMg5 fh64 jtaW 76ng'
};

// Add fetchWordPress import
import { fetchWordPress } from './api-utils';

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
 * Gets authentication status for various APIs
 */
export async function getAuthStatus() {
  initializeDefaultCredentials();
  const wooCommerceAuth = await checkWooCommerceAuth();
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
  
  console.log('API credentials initialized:',  {
    woo_key: localStorage.getItem('woocommerce_consumer_key'),
    woo_secret: localStorage.getItem('woocommerce_consumer_secret')?.substring(0, 5) + '...'
  });
}
