
// Re-export everything for backward compatibility
export * from './base-api';
export * from './wordpress-api';
export * from './woocommerce-api';
export * from './custom-api';
export * from './database-api';
export * from './utils';
export * from './mock-data';

// Initialize credentials
import { initializeDefaultCredentials } from "../auth-utils";
initializeDefaultCredentials();
