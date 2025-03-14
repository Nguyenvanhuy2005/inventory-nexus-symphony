
import { fetchWooCommerce } from './api-utils';

export interface Product {
  id: number;
  name: string;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity: number;
  stock_status: string;
  manage_stock: boolean;
  images: Array<{ id: number; src: string; }>;
  categories: Array<{ id: number; name: string; }>;
  attributes?: Array<{ id: number; name: string; options: string[]; }>;
  meta_data?: Array<{ key: string; value: any; }>;
  permalink?: string;
  type: string; // simple, variable, etc.
  variations?: number[];
  real_stock?: number;
  pending_orders?: number;
  available_to_sell?: number;
}

// Fixed the interface to make the 'attributes' property compatible with Product interface
export interface Variation {
  id: number;
  name: string;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity: number;
  stock_status: string;
  manage_stock: boolean;
  images: Array<{ id: number; src: string; }>;
  categories: Array<{ id: number; name: string; }>;
  meta_data?: Array<{ key: string; value: any; }>;
  permalink?: string;
  type: string;
  parent_id: number;
  attributes: Array<{ id: number; name: string; options: string[]; option?: string; }>;
  real_stock?: number;
  pending_orders?: number;
  available_to_sell?: number;
}

export interface Order {
  id: number;
  status: string;
  date_created: string;
  total: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    price: number;
    subtotal: string;
    total: string;
  }>;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
  };
  meta_data?: Array<{ key: string; value: any; }>;
}

/**
 * Get product by ID
 */
export async function getProduct(id: number): Promise<Product> {
  return await fetchWooCommerce(`/products/${id}`);
}

/**
 * Get product variations by product ID
 */
export async function getProductVariations(productId: number): Promise<Variation[]> {
  return await fetchWooCommerce(`/products/${productId}/variations`);
}

/**
 * Process product data to include real stock and available to sell
 */
export function normalizeProduct(product: Product): Product {
  // Find meta data for real stock and pending orders
  const realStockMeta = product.meta_data?.find(meta => meta.key === 'real_stock');
  const pendingOrdersMeta = product.meta_data?.find(meta => meta.key === 'pending_orders');
  
  // Set real stock (default to stock_quantity if not found)
  const realStock = realStockMeta 
    ? Number(realStockMeta.value) 
    : product.stock_quantity;
    
  // Set pending orders (default to 0 if not found)
  const pendingOrders = pendingOrdersMeta 
    ? Number(pendingOrdersMeta.value) 
    : 0;
    
  // Calculate available to sell
  const availableToSell = realStock - pendingOrders;
  
  return {
    ...product,
    real_stock: realStock,
    pending_orders: pendingOrders,
    available_to_sell: availableToSell
  };
}

// Adjusted to handle variations by creating a normalizeVariation function
export function normalizeVariation(variation: Variation): Variation {
  const realStockMeta = variation.meta_data?.find(meta => meta.key === 'real_stock');
  const pendingOrdersMeta = variation.meta_data?.find(meta => meta.key === 'pending_orders');
  
  const realStock = realStockMeta 
    ? Number(realStockMeta.value) 
    : variation.stock_quantity;
    
  const pendingOrders = pendingOrdersMeta 
    ? Number(pendingOrdersMeta.value) 
    : 0;
    
  const availableToSell = realStock - pendingOrders;
  
  return {
    ...variation,
    real_stock: realStock,
    pending_orders: pendingOrders,
    available_to_sell: availableToSell
  };
}

/**
 * Update parent product stock based on variations
 */
export async function updateParentProductStock(productId: number): Promise<void> {
  try {
    // Get all variations for this product
    const variations = await getProductVariations(productId);
    
    // Calculate total stock from all variations
    let totalRealStock = 0;
    let totalPendingOrders = 0;
    
    variations.forEach(variation => {
      const normalizedVariation = normalizeVariation(variation);
      totalRealStock += normalizedVariation.real_stock || 0;
      totalPendingOrders += normalizedVariation.pending_orders || 0;
    });
    
    // Update parent product
    await fetchWooCommerce(`/products/${productId}`, {
      method: 'PUT',
      body: {
        stock_quantity: totalRealStock - totalPendingOrders,
        meta_data: [
          { key: 'real_stock', value: totalRealStock },
          { key: 'pending_orders', value: totalPendingOrders }
        ]
      }
    });
    
  } catch (error) {
    console.error('Error updating parent product stock:', error);
    throw error;
  }
}
