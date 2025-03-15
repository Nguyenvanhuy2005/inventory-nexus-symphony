
// Mock data for goods receipts
export const mockGoodsReceipts = [
  {
    id: 1,
    receipt_id: "NH-20240815-001",
    supplier_id: 1,
    supplier_name: "Công ty TNHH Thương mại Phú Sơn",
    date: "2024-08-15T08:30:00",
    total_amount: 12500000,
    payment_amount: 6000000,
    payment_status: "partial",
    status: "completed",
    notes: "Nhập hàng đợt 1 tháng 8",
    created_at: "2024-08-15T08:30:00",
    updated_at: "2024-08-15T08:30:00",
    items: [
      {
        id: 1,
        product_id: 101,
        product_name: "Gạch ốp lát 60x60 cao cấp",
        quantity: 100,
        unit_price: 125000,
        total_price: 12500000
      }
    ]
  },
  {
    id: 2,
    receipt_id: "NH-20240810-001",
    supplier_id: 2,
    supplier_name: "Công ty CP Vật liệu Xây dựng Miền Bắc",
    date: "2024-08-10T09:45:00",
    total_amount: 8700000,
    payment_amount: 0,
    payment_status: "pending",
    status: "completed",
    notes: "Nhập vật liệu xây dựng đợt 2",
    created_at: "2024-08-10T09:45:00",
    updated_at: "2024-08-10T09:45:00",
    items: [
      {
        id: 2,
        product_id: 102,
        product_name: "Xi măng Hà Tiên PCB40",
        quantity: 20,
        unit_price: 85000,
        total_price: 1700000
      },
      {
        id: 3,
        product_id: 103,
        product_name: "Cát xây dựng mịn",
        quantity: 5,
        unit_price: 1400000,
        total_price: 7000000
      }
    ]
  },
  {
    id: 3,
    receipt_id: "NH-20240801-001",
    supplier_id: 4,
    supplier_name: "Công ty XNK Quốc Tế Thành Công",
    date: "2024-08-01T14:00:00",
    total_amount: 25000000,
    payment_amount: 25000000,
    payment_status: "paid",
    status: "completed",
    notes: "Nhập thiết bị điện tử",
    created_at: "2024-08-01T14:00:00",
    updated_at: "2024-08-02T10:30:00",
    items: [
      {
        id: 4,
        product_id: 104,
        product_name: "Đèn LED âm trần 24W",
        quantity: 50,
        unit_price: 180000,
        total_price: 9000000
      },
      {
        id: 5,
        product_id: 105,
        product_name: "Công tắc cảm ứng thông minh",
        quantity: 40,
        unit_price: 400000,
        total_price: 16000000
      }
    ]
  }
];
