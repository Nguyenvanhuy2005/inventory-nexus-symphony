// Inventory models

// Supplier model
export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  initial_debt: number;
  current_debt: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Customer model (extended from WooCommerce customers)
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
    state?: string;
    postcode?: string;
    country?: string;
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
    state?: string;
    postcode?: string;
    country?: string;
  };
  avatar_url?: string;
  created_at: string;
  // Extended custom fields
  initial_debt?: number;
  current_debt?: number;
  notes?: string;
}

// Payment Receipt model
export interface PaymentReceipt {
  id: number;
  receipt_id?: string; 
  date: string;
  type: 'income' | 'expense'; // Thu/Chi
  amount: number;
  entity: 'customer' | 'supplier' | 'other';
  entity_id: number;
  entity_name: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'other';
  status: 'completed' | 'pending' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  description: string; // Adding the missing description property
  attachment_url?: string;
  reference?: string;
}

// Goods Receipt model
export interface GoodsReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface GoodsReceipt {
  id: number;
  receipt_id: string;
  date: string;
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  payment_amount: number;
  payment_status: 'paid' | 'partial' | 'pending';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: GoodsReceiptItem[];
}

// Return model
export interface ReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  reason: string;
}

export interface Return {
  id: number;
  return_id: string;
  date: string;
  type: 'customer' | 'supplier';
  entity_id: number;
  entity_name: string;
  total_amount: number;
  payment_amount: number;
  payment_status: 'refunded' | 'partially_refunded' | 'not_refunded';
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: ReturnItem[];
  reason?: string; // Adding reason field
}

// Damaged Stock model
export interface DamagedStock {
  id: number;
  date: string;
  product_id: number;
  product_name: string;
  quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
}

// Stock Adjustment model
export interface StockAdjustment {
  id: number;
  product_id: number;
  product_name: string;
  real_stock: number;
  virtual_stock: number;
  available_to_sell: number;
  adjustment_date: string;
  adjusted_by: string;
  reason: string;
  notes?: string;
}

// Stock Adjustment Log model
export interface StockAdjustmentLog {
  id: number;
  product_id: number;
  prev_real_stock: number;
  new_real_stock: number;
  prev_virtual_stock: number;
  new_virtual_stock: number;
  adjustment_date: string;
  adjusted_by: string;
  reason: string;
}

// Customer Debt model
export interface CustomerDebt {
  id: number;
  customer_id: number;
  customer_name: string;
  initial_debt: number;
  current_debt: number; // This will be used instead of 'amount'
  last_updated: string; // This will be used instead of 'updated_at'
  notes?: string;
  customer_email?: string; // Add this property
  customer_phone?: string; // Add this property
}
