
// Mock data for returns
export const mockReturns = [
  {
    id: 1,
    return_id: "TH-20240820-001",
    type: "supplier",
    entity_id: 1,
    entity_name: "Công ty TNHH Thương mại Phú Sơn",
    date: "2024-08-20T10:15:00",
    reason: "Hàng bị lỗi sản xuất",
    total_amount: 2500000,
    payment_amount: 2500000,
    payment_status: "refunded",
    status: "completed",
    notes: "Đã nhận được tiền hoàn trả",
    created_at: "2024-08-20T10:15:00",
    updated_at: "2024-08-21T09:30:00",
    items: [
      {
        id: 1,
        product_id: 101,
        product_name: "Gạch ốp lát 60x60 cao cấp",
        quantity: 20,
        unit_price: 125000,
        total_price: 2500000,
        reason: "Gạch bị nứt, sứt mẻ"
      }
    ]
  },
  {
    id: 2,
    return_id: "TH-20240818-001",
    type: "customer",
    entity_id: 5,
    entity_name: "Nguyễn Văn A",
    date: "2024-08-18T14:30:00",
    reason: "Khách hàng đổi sản phẩm",
    total_amount: 400000,
    payment_amount: 0,
    payment_status: "not_refunded",
    status: "completed",
    notes: "Đã đổi sản phẩm mới cho khách",
    created_at: "2024-08-18T14:30:00",
    updated_at: "2024-08-18T14:30:00",
    items: [
      {
        id: 2,
        product_id: 106,
        product_name: "Ổ cắm điện đa năng",
        quantity: 2,
        unit_price: 200000,
        total_price: 400000,
        reason: "Ổ cắm không hoạt động"
      }
    ]
  },
  {
    id: 3,
    return_id: "TH-20240815-001",
    type: "supplier",
    entity_id: 2,
    entity_name: "Công ty CP Vật liệu Xây dựng Miền Bắc",
    date: "2024-08-15T11:00:00",
    reason: "Hàng không đúng quy cách",
    total_amount: 1700000,
    payment_amount: 0,
    payment_status: "pending",
    status: "completed",
    notes: "Đang chờ hoàn tiền từ nhà cung cấp",
    created_at: "2024-08-15T11:00:00",
    updated_at: "2024-08-15T11:00:00",
    items: [
      {
        id: 3,
        product_id: 102,
        product_name: "Xi măng Hà Tiên PCB40",
        quantity: 20,
        unit_price: 85000,
        total_price: 1700000,
        reason: "Xi măng đã bị ẩm, vón cục"
      }
    ]
  }
];
