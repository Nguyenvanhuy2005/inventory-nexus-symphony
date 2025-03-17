
// Re-export everything for backward compatibility
export * from './base-api';
export * from './wordpress-api';
export * from './woocommerce-api';
export * from './custom-api';
export * from './database-api';
export * from './utils';
export * from './mock-data';

// Re-export authentication functions from auth-utils
export { 
  checkWooCommerceAuth,
  checkDatabaseApiAuth,
  initializeDefaultCredentials,
  DEFAULT_WOOCOMMERCE_CREDENTIALS,
  DEFAULT_WORDPRESS_CREDENTIALS,
  getAuthStatus,
  isFullyConnected
} from '../auth-utils';

// Initialize credentials
import { initializeDefaultCredentials } from "../auth-utils";
initializeDefaultCredentials();
