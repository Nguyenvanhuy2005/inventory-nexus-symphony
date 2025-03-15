
export interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  initial_debt?: number;
  current_debt?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentReceipt {
  id: number;
  receipt_id: string;
  entity: string;
  entity_id: number;
  entity_name: string;
  date: string;
  amount: number;
  payment_method: string;
  notes: string;
  type?: string;
  description?: string;
  created_by?: string;
  attachment_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GoodsReceiptItem {
  product_id: number;
  variation_id: number;
  product_name?: string;
  name?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  price: number;
  total_price: number;
  subtotal: number;
}

export interface GoodsReceipt {
  id: number;
  receipt_id: string;
  supplier_id: number;
  supplier_name: string;
  date: string;
  total_amount: number;
  payment_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string;
  items: GoodsReceiptItem[];
  created_at?: string;
  updated_at?: string;
}

export interface ReturnItem {
  product_id: number;
  variation_id: number;
  product_name?: string;
  name?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  price: number;
  total_price: number;
  subtotal: number;
  reason: string;
}

export interface Return {
  id: number;
  return_id: string;
  type: string;
  entity_id: number;
  entity_name: string;
  date: string;
  reason: string;
  total_amount: number;
  payment_amount: number;
  payment_status: string;
  status: string;
  notes: string;
  items: ReturnItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DamagedStock {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  reason: string;
  date: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockAdjustment {
  id: number;
  product_id: number;
  product_name: string;
  quantity_change: number;
  new_quantity: number;
  reason: string;
  date: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerDebt {
  id: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  date: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number;
  stock_status?: string;
  categories?: Array<{id: number, name: string}>;
  images: Array<{id: number, src: string}>; 
  attributes?: any[];
  variations?: number[];
  description?: string;
  short_description?: string;
  type?: string;
  manage_stock?: boolean;
  meta_data?: Array<{key: string, value: any}>;
  real_stock?: number;
  pending_orders?: number;
  available_to_sell?: number;
  featured?: boolean;
}

export interface StockLevel {
  product_id: number;
  ton_thuc_te: number;
  co_the_ban: number;
  last_updated: string;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  order_date: string;
  status: string;
  created_at: string;
}

export interface StockEntry {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity: number;
  cost_price: number;
  created_at: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  options: string[];
  position: number;
  visible: boolean;
  variation: boolean;
}

export interface ProductVariation {
  id: number;
  product_id: number;
  sku?: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number;
  stock_status?: string;
  attributes: {
    name: string;
    option: string;
  }[];
  image?: {
    id: number;
    src: string;
  };
  real_stock?: number;
  pending_orders?: number;
  available_to_sell?: number;
}
