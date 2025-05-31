
export interface PaymentReceipt {
  id: number;
  receipt_id: string;
  type: 'income' | 'expense';
  entity_type: 'customer' | 'supplier' | 'other';
  entity_id: number;
  entity_name: string;
  date: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'other';
  reference?: string;
  reference_type?: 'order' | 'goods_receipt' | 'return' | 'other';
  status: 'completed' | 'pending' | 'cancelled';
  description: string;
  notes?: string;
  attachment_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentAttachment {
  id: number;
  payment_receipt_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder' | string;
  description?: string;
  short_description?: string;
  categories?: Array<{ id: number; name: string }>;
  manage_stock?: boolean;
  featured?: boolean;
  images?: Array<{ id: number; src: string; name: string }>;
  image?: string;
  type?: 'simple' | 'variable' | 'grouped' | 'external';
  real_stock?: number;
  available_to_sell?: number;
  pending_orders?: number;
  attributes?: any[];
  variation_id?: number;
  variations?: number[];
  meta_data?: Array<{ key: string; value: any }>;
}

export interface ProductVariation {
  id: number;
  parent_id: number;
  name?: string;
  sku?: string;
  price?: string;
  regular_price?: string;
  sale_price?: string;
  stock_quantity?: number;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder' | string;
  attributes?: Array<{ name: string; option: string }>;
  image?: any;
}

export interface ProductWithVariations {
  product: Product | null;
  variations: ProductVariation[];
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_name?: string;
  payment_terms?: string;
  tax_id?: string;
  initial_debt?: number;
  current_debt?: number;
  total_debt?: number;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface GoodsReceipt {
  id: number;
  receipt_id: string;
  supplier_id: number;
  supplier_name: string;
  date: string;
  total_amount: number;
  payment_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'other';
  payment_status: 'pending' | 'partial' | 'paid';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  items: GoodsReceiptItem[];
}

export interface GoodsReceiptItem {
  id?: number;
  goods_receipt_id?: number;
  product_id: number;
  product_name: string;
  variation_id?: number;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at?: string;
}

export interface Return {
  id?: number;
  return_id: string;
  type: 'customer' | 'supplier';
  entity_id: number;
  entity_name: string;
  date: string;
  reason: string;
  total_amount: number;
  payment_amount: number;
  payment_status: 'refunded' | 'partial_refunded' | 'not_refunded';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  items: ReturnItem[];
}

export interface ReturnItem {
  id?: number;
  return_id?: number;
  product_id: number;
  product_name: string;
  variation_id?: number;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  reason?: string;
  created_at?: string;
}

export interface StockTransaction {
  id: number;
  transaction_id: string;
  product_id: number;
  product_name: string;
  variation_id?: number;
  quantity: number;
  previous_quantity: number;
  current_quantity: number;
  type: 'goods_receipt' | 'return' | 'sale' | 'adjustment' | 'damaged';
  reference_id: string;
  reference_type: 'goods_receipt' | 'return' | 'order' | 'adjustment' | 'damaged';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface StockAdjustment {
  id: number;
  adjustment_id: string;
  product_id: number;
  product_name: string;
  variation_id?: number;
  old_quantity: number;
  new_quantity: number;
  adjustment_quantity: number;
  adjustment_type: 'increase' | 'decrease';
  reason: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface DamagedStock {
  id: number;
  damage_id: string;
  product_id: number;
  product_name: string;
  variation_id?: number;
  quantity: number;
  reason: string;
  estimated_loss: number;
  date: string;
  status: 'reported' | 'processed' | 'written_off';
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface CustomerDebt {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  initial_debt: number;
  current_debt: number;
  credit_limit: number;
  payment_terms: string;
  last_payment_date?: string;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  created_at: string;
  updated_at: string;
}
