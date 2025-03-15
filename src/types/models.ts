
export interface PaymentReceipt {
  id: number;
  receipt_id: string;
  type: 'income' | 'expense'; // Changed from 'payment' | 'receipt' to match the usage in code
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
