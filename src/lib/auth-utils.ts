
import { fetchWooCommerce } from './api-utils';

/**
 * Default WooCommerce credentials - These will be used if not overridden by localStorage
 */
export const DEFAULT_WOOCOMMERCE_CREDENTIALS = {
  consumer_key: 'ck_28e49b3dd2d0241b8c68f1cf2ed06fc0c67591e8',
  consumer_secret: 'cs_6211defb372ee405eaaf28d9616215f4be710c38'
};

/**
 * Default WordPress credentials
 */
export const DEFAULT_WORDPRESS_CREDENTIALS = {
  username: 'admin',
  application_password: 'EsrK Qjd6 TyWa Q7gc IXDn 6CRw'
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
 * Gets authentication status for various APIs
 */
export async function getAuthStatus() {
  // Set default credentials in localStorage if they don't exist
  initializeDefaultCredentials();
  
  // Check authentication with the credentials
  const wooCommerceAuth = await checkWooCommerceAuth();
  
  return {
    woocommerce: {
      isAuthenticated: wooCommerceAuth,
      hasCredentials: !!(
        (localStorage.getItem('woocommerce_consumer_key') && 
         localStorage.getItem('woocommerce_consumer_secret')) ||
        (import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY && 
         import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET)
      )
    },
    status: {
      wordpress: {
        connected: false,
        message: "Not checked"
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
