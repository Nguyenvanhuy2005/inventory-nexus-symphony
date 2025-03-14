
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
  description?: string;
  short_description?: string;
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
  tags?: Array<{ id: number; name: string; }>;
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
  description?: string;
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
    sku?: string;
    meta_data?: Array<{ key: string; value: any; }>;
  }>;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    postcode?: string;
    country?: string;
    company?: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode?: string;
    country?: string;
    company?: string;
  };
  meta_data?: Array<{ key: string; value: any; }>;
  payment_method?: string;
  payment_method_title?: string;
  customer_note?: string;
  coupon_lines?: Array<{
    id: number;
    code: string;
    discount: string;
  }>;
  date_completed?: string;
  date_paid?: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  billing?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode?: string;
    country: string;
    state?: string;
    email: string;
    phone: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode?: string;
    country: string;
    state?: string;
  };
  meta_data?: Array<{ key: string; value: any; }>;
  date_created: string;
  date_modified?: string;
  role?: string;
  avatar_url?: string;
  sales_rep_id?: number;
  sales_rep_name?: string;
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
 * Get all products
 */
export async function getAllProducts(params?: Record<string, string>): Promise<Product[]> {
  return await fetchWooCommerce('/products', { params: params || { per_page: '100' } });
}

/**
 * Create a new product
 */
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  return await fetchWooCommerce('/products', {
    method: 'POST',
    body: productData
  });
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: number, productData: Partial<Product>): Promise<Product> {
  return await fetchWooCommerce(`/products/${productId}`, {
    method: 'PUT',
    body: productData
  });
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: number): Promise<any> {
  return await fetchWooCommerce(`/products/${productId}`, {
    method: 'DELETE',
    params: { force: 'true' }
  });
}

/**
 * Get all customers
 */
export async function getAllCustomers(params?: Record<string, string>): Promise<Customer[]> {
  return await fetchWooCommerce('/customers', { params: params || { per_page: '100' } });
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: number): Promise<Customer> {
  return await fetchWooCommerce(`/customers/${id}`);
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
  return await fetchWooCommerce('/customers', {
    method: 'POST',
    body: customerData
  });
}

/**
 * Update an existing customer
 */
export async function updateCustomer(customerId: number, customerData: Partial<Customer>): Promise<Customer> {
  return await fetchWooCommerce(`/customers/${customerId}`, {
    method: 'PUT',
    body: customerData
  });
}

/**
 * Get all orders
 */
export async function getAllOrders(params?: Record<string, string>): Promise<Order[]> {
  return await fetchWooCommerce('/orders', { params: params || { per_page: '100' } });
}

/**
 * Get order by ID
 */
export async function getOrder(id: number): Promise<Order> {
  return await fetchWooCommerce(`/orders/${id}`);
}

/**
 * Create a new order
 */
export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  return await fetchWooCommerce('/orders', {
    method: 'POST',
    body: orderData
  });
}

/**
 * Update an existing order
 */
export async function updateOrder(orderId: number, orderData: Partial<Order>): Promise<Order> {
  return await fetchWooCommerce(`/orders/${orderId}`, {
    method: 'PUT',
    body: orderData
  });
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

/**
 * Get all product categories
 */
export async function getProductCategories(): Promise<Array<{ id: number; name: string; }>> {
  return await fetchWooCommerce('/products/categories', { params: { per_page: '100' } });
}

/**
 * Get all product tags
 */
export async function getProductTags(): Promise<Array<{ id: number; name: string; }>> {
  return await fetchWooCommerce('/products/tags', { params: { per_page: '100' } });
}

/**
 * Update variation stock
 */
export async function updateVariationStock(
  productId: number, 
  variationId: number, 
  stockData: { stock_quantity: number; }
): Promise<Variation> {
  return await fetchWooCommerce(`/products/${productId}/variations/${variationId}`, {
    method: 'PUT',
    body: stockData
  });
}

/**
 * Get order notes
 */
export async function getOrderNotes(orderId: number): Promise<Array<{ id: number; note: string; date_created: string; }>> {
  return await fetchWooCommerce(`/orders/${orderId}/notes`);
}

/**
 * Add order note
 */
export async function addOrderNote(
  orderId: number, 
  note: string, 
  isCustomerNote: boolean = false
): Promise<{ id: number; note: string; date_created: string; }> {
  return await fetchWooCommerce(`/orders/${orderId}/notes`, {
    method: 'POST',
    body: {
      note,
      customer_note: isCustomerNote
    }
  });
}

/**
 * Get product attributes
 */
export async function getProductAttributes(): Promise<Array<{ id: number; name: string; slug: string; }>> {
  return await fetchWooCommerce('/products/attributes');
}

/**
 * Create a variation for a product
 */
export async function createVariation(
  productId: number, 
  variationData: Partial<Variation>
): Promise<Variation> {
  return await fetchWooCommerce(`/products/${productId}/variations`, {
    method: 'POST',
    body: variationData
  });
}

/**
 * Delete a variation
 */
export async function deleteVariation(
  productId: number, 
  variationId: number
): Promise<any> {
  return await fetchWooCommerce(`/products/${productId}/variations/${variationId}`, {
    method: 'DELETE',
    params: { force: 'true' }
  });
}

/**
 * Get sales by date
 */
export async function getSalesByDate(
  period: 'day' | 'week' | 'month' | 'year', 
  startDate?: string, 
  endDate?: string
): Promise<Array<{ date: string; total: string; }>> {
  const params: Record<string, string> = { period };
  if (startDate) params.date_min = startDate;
  if (endDate) params.date_max = endDate;
  
  return await fetchWooCommerce('/reports/sales', { params });
}

/**
 * Get top selling products
 */
export async function getTopSellingProducts(
  period: 'week' | 'month' | 'year' = 'month'
): Promise<Array<{ product_id: number; name: string; total: number; }>> {
  return await fetchWooCommerce('/reports/top_sellers', { params: { period } });
}

/**
 * Search customers
 */
export async function searchCustomers(search: string): Promise<Customer[]> {
  return await fetchWooCommerce('/customers', { params: { search } });
}

/**
 * Search products
 */
export async function searchProducts(search: string): Promise<Product[]> {
  return await fetchWooCommerce('/products', { params: { search } });
}

/**
 * Get product stock status label
 */
export function getStockStatusLabel(status: string): string {
  switch (status) {
    case 'instock':
      return 'Còn hàng';
    case 'outofstock':
      return 'Hết hàng';
    case 'onbackorder':
      return 'Đặt trước';
    default:
      return status;
  }
}

/**
 * Get order status label
 */
export function getOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Chờ thanh toán';
    case 'processing':
      return 'Đang xử lý';
    case 'on-hold':
      return 'Tạm giữ';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    case 'refunded':
      return 'Đã hoàn tiền';
    case 'failed':
      return 'Thất bại';
    case 'trash':
      return 'Thùng rác';
    default:
      return status;
  }
}

