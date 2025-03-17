
// Mock data for WooCommerce API fallback - only used for development and debugging
export const mockWooCommerceData = {
  products: [
    { id: 1, name: "Sample Product 1", price: "100000", stock_quantity: 10, images: [{ id: 1, src: "/placeholder.svg" }] },
    { id: 2, name: "Sample Product 2", price: "200000", stock_quantity: 20, images: [{ id: 2, src: "/placeholder.svg" }] }
  ],
  orders: [
    { id: 1, status: "processing", total: "100000", customer_id: 1 },
    { id: 2, status: "completed", total: "200000", customer_id: 2 }
  ],
  users: [
    { id: 1, name: "Admin User", email: "admin@example.com" },
    { id: 2, name: "Manager", email: "manager@example.com" }
  ],
  stockTransactions: [
    { 
      id: 1, 
      product_id: 1, 
      product_name: "Sample Product 1", 
      transaction_type: "adjustment", 
      quantity: 5, 
      previous_stock: 5, 
      new_stock: 10, 
      notes: "Điều chỉnh tồn kho",
      created_at: new Date().toISOString()
    }
  ]
};
