import { Product, Order } from './woocommerce';

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_1: string;
  city: string;
  initial_debt?: number;
  current_debt?: number;
  orders_count?: number;
  total_spent?: string;
}

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

export interface PaymentReceipt {
  id: number;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  entity: 'customer' | 'supplier';
  entity_id: number;
  entity_name: string;
  description: string;
  payment_method: string;
  status: string;
  created_by: string;
}

// Mock products data
export const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Áo phông nam',
    sku: 'AP001',
    price: '250000',
    regular_price: '290000',
    sale_price: '250000',
    stock_quantity: 25,
    stock_status: 'instock',
    manage_stock: true,
    images: [{ id: 101, src: 'https://picsum.photos/id/1/200/200' }],
    categories: [{ id: 15, name: 'Áo nam' }],
    type: 'variable',
    variations: [101, 102, 103],
    real_stock: 30,
    pending_orders: 5,
    available_to_sell: 25
  },
  {
    id: 2,
    name: 'Quần jeans nữ',
    sku: 'QJ001',
    price: '450000',
    regular_price: '450000',
    stock_quantity: 12,
    stock_status: 'instock',
    manage_stock: true,
    images: [{ id: 102, src: 'https://picsum.photos/id/2/200/200' }],
    categories: [{ id: 16, name: 'Quần nữ' }],
    type: 'simple',
    real_stock: 15,
    pending_orders: 3,
    available_to_sell: 12
  },
  {
    id: 3,
    name: 'Áo khoác nữ',
    sku: 'AK001',
    price: '520000',
    regular_price: '650000',
    sale_price: '520000',
    stock_quantity: 8,
    stock_status: 'instock',
    manage_stock: true,
    images: [{ id: 103, src: 'https://picsum.photos/id/3/200/200' }],
    categories: [{ id: 17, name: 'Áo nữ' }],
    type: 'simple',
    real_stock: 10,
    pending_orders: 2,
    available_to_sell: 8
  },
  {
    id: 4,
    name: 'Váy dạ hội',
    sku: 'VDH001',
    price: '1250000',
    regular_price: '1500000',
    sale_price: '1250000',
    stock_quantity: 5,
    stock_status: 'instock',
    manage_stock: true,
    images: [{ id: 104, src: 'https://picsum.photos/id/4/200/200' }],
    categories: [{ id: 18, name: 'Váy nữ' }],
    type: 'simple',
    real_stock: 5,
    pending_orders: 0,
    available_to_sell: 5
  },
  {
    id: 5,
    name: 'Giày thể thao nam',
    sku: 'GTT001',
    price: '850000',
    regular_price: '850000',
    stock_quantity: 0,
    stock_status: 'outofstock',
    manage_stock: true,
    images: [{ id: 105, src: 'https://picsum.photos/id/5/200/200' }],
    categories: [{ id: 19, name: 'Giày nam' }],
    type: 'variable',
    variations: [201, 202, 203],
    real_stock: 0,
    pending_orders: 0,
    available_to_sell: 0
  }
];

// Mock variations
export const mockVariations: { [key: number]: Product[] } = {
  1: [
    {
      id: 101,
      name: 'Áo phông nam - Đỏ, M',
      price: '250000',
      stock_quantity: 10,
      stock_status: 'instock',
      manage_stock: true,
      images: [{ id: 1001, src: 'https://picsum.photos/id/11/200/200' }],
      categories: [],
      attributes: [
        { id: 1, name: 'Màu sắc', options: ['Đỏ'] },
        { id: 2, name: 'Kích cỡ', options: ['M'] }
      ],
      type: 'variation',
      real_stock: 12,
      pending_orders: 2,
      available_to_sell: 10
    },
    {
      id: 102,
      name: 'Áo phông nam - Đỏ, L',
      price: '250000',
      stock_quantity: 7,
      stock_status: 'instock',
      manage_stock: true,
      images: [{ id: 1002, src: 'https://picsum.photos/id/12/200/200' }],
      categories: [],
      attributes: [
        { id: 1, name: 'Màu sắc', options: ['Đỏ'] },
        { id: 2, name: 'Kích cỡ', options: ['L'] }
      ],
      type: 'variation',
      real_stock: 8,
      pending_orders: 1,
      available_to_sell: 7
    },
    {
      id: 103,
      name: 'Áo phông nam - Xanh, M',
      price: '250000',
      stock_quantity: 8,
      stock_status: 'instock',
      manage_stock: true,
      images: [{ id: 1003, src: 'https://picsum.photos/id/13/200/200' }],
      categories: [],
      attributes: [
        { id: 1, name: 'Màu sắc', options: ['Xanh'] },
        { id: 2, name: 'Kích cỡ', options: ['M'] }
      ],
      type: 'variation',
      real_stock: 10,
      pending_orders: 2,
      available_to_sell: 8
    }
  ]
};

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: 1001,
    status: 'processing',
    date_created: '2023-09-15T08:30:45',
    total: '1250000',
    line_items: [
      {
        id: 1,
        name: 'Áo phông nam - Đỏ, M',
        product_id: 1,
        variation_id: 101,
        quantity: 2,
        price: 250000,
        subtotal: '500000',
        total: '500000'
      },
      {
        id: 2,
        name: 'Quần jeans nữ',
        product_id: 2,
        variation_id: 0,
        quantity: 1,
        price: 450000,
        subtotal: '450000',
        total: '450000'
      }
    ],
    customer_id: 101,
    billing: {
      first_name: 'Nguyễn',
      last_name: 'Văn A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      address_1: '123 Đường ABC',
      city: 'Hồ Chí Minh'
    }
  },
  {
    id: 1002,
    status: 'completed',
    date_created: '2023-09-14T15:20:10',
    total: '520000',
    line_items: [
      {
        id: 3,
        name: 'Áo khoác nữ',
        product_id: 3,
        variation_id: 0,
        quantity: 1,
        price: 520000,
        subtotal: '520000',
        total: '520000'
      }
    ],
    customer_id: 102,
    billing: {
      first_name: 'Trần',
      last_name: 'Thị B',
      email: 'tranthib@example.com',
      phone: '0909876543',
      address_1: '456 Đường XYZ',
      city: 'Hà Nội'
    }
  },
  {
    id: 1003,
    status: 'on-hold',
    date_created: '2023-09-13T10:45:30',
    total: '1250000',
    line_items: [
      {
        id: 4,
        name: 'Váy dạ hội',
        product_id: 4,
        variation_id: 0,
        quantity: 1,
        price: 1250000,
        subtotal: '1250000',
        total: '1250000'
      }
    ],
    customer_id: 103,
    billing: {
      first_name: 'Lê',
      last_name: 'Thị C',
      email: 'lethic@example.com',
      phone: '0912345678',
      address_1: '789 Đường LMN',
      city: 'Đà Nẵng'
    }
  }
];

// Mock customers data
export const mockCustomers: Customer[] = [
  {
    id: 101,
    first_name: 'Nguyễn',
    last_name: 'Văn A',
    email: 'nguyenvana@example.com',
    phone: '0901234567',
    address_1: '123 Đường ABC',
    city: 'Hồ Chí Minh',
    initial_debt: 0,
    current_debt: 1250000,
    orders_count: 5,
    total_spent: '7500000'
  },
  {
    id: 102,
    first_name: 'Trần',
    last_name: 'Thị B',
    email: 'tranthib@example.com',
    phone: '0909876543',
    address_1: '456 Đường XYZ',
    city: 'Hà Nội',
    initial_debt: 500000,
    current_debt: 0,
    orders_count: 3,
    total_spent: '2100000'
  },
  {
    id: 103,
    first_name: 'Lê',
    last_name: 'Thị C',
    email: 'lethic@example.com',
    phone: '0912345678',
    address_1: '789 Đường LMN',
    city: 'Đà Nẵng',
    initial_debt: 0,
    current_debt: 1250000,
    orders_count: 1,
    total_spent: '1250000'
  }
];

// Mock suppliers data
export const mockSuppliers: Supplier[] = [
  {
    id: 201,
    name: 'Công ty TNHH May mặc ABC',
    phone: '0287654321',
    email: 'contact@abcgarment.com',
    address: '123 Đường Công Nghiệp, Quận Bình Tân, TP.HCM',
    initial_debt: 0,
    current_debt: 5000000,
    notes: 'Nhà cung cấp chính các sản phẩm áo',
    created_at: '2023-01-15T08:00:00',
    updated_at: '2023-09-10T14:30:00'
  },
  {
    id: 202,
    name: 'Xưởng May XYZ',
    phone: '0265432198',
    email: 'info@xyzfashion.com',
    address: '456 Đường Dệt May, Quận Hai Bà Trưng, Hà Nội',
    initial_debt: 1000000,
    current_debt: 0,
    notes: 'Nhà cung cấp quần, váy',
    created_at: '2023-02-20T09:15:00',
    updated_at: '2023-09-12T16:45:00'
  }
];

// Mock payment receipts data
export const mockPaymentReceipts: PaymentReceipt[] = [
  {
    id: 301,
    date: '2023-09-14T10:00:00',
    type: 'income',
    amount: 1250000,
    entity: 'customer',
    entity_id: 101,
    entity_name: 'Nguyễn Văn A',
    description: 'Thanh toán đơn hàng #1001',
    payment_method: 'cash',
    status: 'completed',
    created_by: 'admin'
  },
  {
    id: 302,
    date: '2023-09-12T15:30:00',
    type: 'expense',
    amount: 3000000,
    entity: 'supplier',
    entity_id: 201,
    entity_name: 'Công ty TNHH May mặc ABC',
    description: 'Thanh toán đợt hàng nhập ngày 10/09/2023',
    payment_method: 'bank_transfer',
    status: 'completed',
    created_by: 'admin'
  },
  {
    id: 303,
    date: '2023-09-10T09:15:00',
    type: 'income',
    amount: 520000,
    entity: 'customer',
    entity_id: 102,
    entity_name: 'Trần Thị B',
    description: 'Thanh toán đơn hàng #1002',
    payment_method: 'card',
    status: 'completed',
    created_by: 'admin'
  }
];

// Recent activity data for dashboard
export const mockRecentActivities = [
  {
    id: 1,
    type: 'order',
    description: 'Đơn hàng mới #1001 từ Nguyễn Văn A',
    timestamp: '2023-09-15T08:30:45',
    status: 'processing'
  },
  {
    id: 2,
    type: 'payment',
    description: 'Phiếu thu từ Trần Thị B: 520,000đ',
    timestamp: '2023-09-14T15:20:10',
    status: 'completed'
  },
  {
    id: 3,
    type: 'stock',
    description: 'Cập nhật tồn kho: Áo phông nam +20',
    timestamp: '2023-09-14T11:15:30',
    status: 'completed'
  },
  {
    id: 4,
    type: 'goods_receipt',
    description: 'Nhập hàng từ Công ty TNHH May mặc ABC',
    timestamp: '2023-09-13T14:45:20',
    status: 'completed'
  },
  {
    id: 5,
    type: 'customer',
    description: 'Khách hàng mới: Lê Thị C',
    timestamp: '2023-09-13T10:30:00',
    status: 'completed'
  }
];

// Sales data for dashboard charts
export const mockSalesData = [
  { date: '01/09', revenue: 2500000 },
  { date: '02/09', revenue: 1800000 },
  { date: '03/09', revenue: 2200000 },
  { date: '04/09', revenue: 2700000 },
  { date: '05/09', revenue: 3100000 },
  { date: '06/09', revenue: 2900000 },
  { date: '07/09', revenue: 3500000 },
  { date: '08/09', revenue: 2600000 },
  { date: '09/09', revenue: 2400000 },
  { date: '10/09', revenue: 2800000 },
  { date: '11/09', revenue: 3200000 },
  { date: '12/09', revenue: 3100000 },
  { date: '13/09', revenue: 2700000 },
  { date: '14/09', revenue: 2900000 },
  { date: '15/09', revenue: 3400000 }
];

// Inventory data by category for dashboard charts
export const mockInventoryByCategoryData = [
  { name: 'Áo nam', value: 45 },
  { name: 'Quần nam', value: 30 },
  { name: 'Áo nữ', value: 50 },
  { name: 'Quần nữ', value: 35 },
  { name: 'Váy nữ', value: 20 },
  { name: 'Giày nam', value: 15 },
  { name: 'Giày nữ', value: 18 }
];

// Mock damaged stock data
export const mockDamagedStock = [
  {
    id: 1,
    date: '2023-06-10T08:00:00',
    product_id: 1,
    product_name: 'Áo thun nam Harmony',
    quantity: 5,
    reason: 'Hư hỏng trong quá trình vận chuyển',
    notes: 'Đã hủy sản phẩm'
  },
  {
    id: 2,
    date: '2023-06-15T10:30:00',
    product_id: 3,
    product_name: 'Váy nữ Wave',
    quantity: 2,
    reason: 'Lỗi sản xuất',
    notes: 'Trả về nhà sản xuất'
  },
  {
    id: 3,
    date: '2023-06-20T14:15:00',
    product_id: 5,
    product_name: 'Quần jean nam Blue',
    quantity: 3,
    reason: 'Phai màu',
    notes: 'Chuyển xuống hàng giảm giá'
  }
];

// Mock stock adjustments
export const mockStockAdjustments = [
  {
    id: 1,
    product_id: 1,
    product_name: 'Áo thun nam Harmony',
    real_stock: 50,
    virtual_stock: 47,
    available_to_sell: 47,
    adjustment_date: '2023-06-05T09:00:00',
    adjusted_by: 'admin',
    reason: 'Kiểm kê kho',
    notes: 'Điều chỉnh theo kết quả kiểm kê quý 2'
  },
  {
    id: 2,
    product_id: 3,
    product_name: 'Váy nữ Wave',
    real_stock: 30,
    virtual_stock: 28,
    available_to_sell: 28,
    adjustment_date: '2023-06-08T11:20:00',
    adjusted_by: 'admin',
    reason: 'Cập nhật tồn kho',
    notes: 'Điều chỉnh theo số liệu thực tế'
  }
];

// Mock customer debt data
export const mockCustomerDebts = [
  {
    id: 1,
    customer_id: 1,
    customer_name: 'Nguyễn Văn A',
    initial_debt: 5000000,
    current_debt: 3000000,
    last_updated: '2023-06-01T10:00:00',
    notes: 'Khách hàng thân thiết'
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: 'Trần Thị B',
    initial_debt: 2000000,
    current_debt: 2000000,
    last_updated: '2023-06-05T14:30:00',
    notes: 'Chưa thanh toán đơn hàng đầu tiên'
  }
];

// Mock goods receipts
export const mockGoodsReceipts = [
  {
    id: 1,
    receipt_id: 'GR001',
    date: '2023-05-15T09:00:00',
    supplier_id: 1,
    supplier_name: 'Nhà A',
    total_amount: 10000000,
    payment_amount: 10000000,
    payment_status: 'paid',
    status: 'completed',
    notes: 'Đã nhập kho đầy đủ',
    created_at: '2023-05-15T09:00:00',
    updated_at: '2023-05-15T09:00:00',
    items: [
      {
        id: 1,
        receipt_id: 1,
        product_id: 1,
        product_name: 'Áo thun nam Harmony',
        quantity: 20,
        unit_price: 150000,
        total: 3000000
      },
      {
        id: 2,
        receipt_id: 1,
        product_id: 3,
        product_name: 'Váy nữ Wave',
        quantity: 15,
        unit_price: 200000, 
        total: 3000000
      }
    ]
  },
  {
    id: 2,
    receipt_id: 'GR002',
    date: '2023-05-20T10:30:00',
    supplier_id: 2,
    supplier_name: 'Thế thao số',
    total_amount: 15000000,
    payment_amount: 7500000,
    payment_status: 'partial',
    status: 'completed',
    notes: 'Thanh toán 50%, phần còn lại trả sau 30 ngày',
    created_at: '2023-05-20T10:30:00',
    updated_at: '2023-05-20T10:30:00',
    items: [
      {
        id: 3,
        receipt_id: 2,
        product_id: 5,
        product_name: 'Quần jean nam Blue',
        quantity: 30,
        unit_price: 250000,
        total: 7500000
      }
    ]
  }
];

// Mock returns data
export const mockReturns = [
  {
    id: 1,
    return_id: 'R001',
    date: '2023-06-01T11:00:00',
    type: 'customer',
    entity_id: 1,
    entity_name: 'Nguyễn Văn A',
    total_amount: 450000,
    payment_amount: 450000,
    payment_status: 'refunded',
    status: 'completed',
    notes: 'Khách hàng đổi trả do không vừa size',
    created_at: '2023-06-01T11:00:00',
    updated_at: '2023-06-01T11:00:00',
    items: [
      {
        id: 1,
        return_id: 1,
        product_id: 1,
        product_name: 'Áo thun nam Harmony',
        quantity: 3,
        unit_price: 150000,
        total: 450000,
        reason: 'Không vừa size'
      }
    ]
  },
  {
    id: 2,
    return_id: 'R002',
    date: '2023-06-05T14:00:00',
    type: 'supplier',
    entity_id: 1,
    entity_name: 'Nhà A',
    total_amount: 600000,
    payment_amount: 600000,
    payment_status: 'refunded',
    status: 'completed',
    notes: 'Trả hàng cho nhà cung cấp do lỗi sản xuất',
    created_at: '2023-06-05T14:00:00',
    updated_at: '2023-06-05T14:00:00',
    items: [
      {
        id: 2,
        return_id: 2,
        product_id: 3,
        product_name: 'Váy nữ Wave',
        quantity: 3,
        unit_price: 200000,
        total: 600000,
        reason: 'Lỗi sản xuất'
      }
    ]
  }
];
