
import { toast } from "sonner";

/**
 * Export data to CSV file
 * @param filename File name without extension
 * @param data Array of objects to export
 */
export function exportToCSV(filename: string, data: any[]) {
  if (!data || data.length === 0) {
    toast.error("Không có dữ liệu để xuất");
    return;
  }
  
  try {
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [];
    
    // Add headers row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape double quotes and wrap values with commas in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join('\n')}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    toast.success("Xuất dữ liệu thành công");
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error(`Lỗi xuất dữ liệu: ${error instanceof Error ? error.message : 'Không thể xuất dữ liệu'}`);
  }
}

/**
 * Sync WooCommerce products with stock levels
 * @param products WooCommerce products
 * @param stockLevels Custom stock levels
 * @returns Products with merged stock data
 */
export function syncProductsWithStockLevels(products: any[], stockLevels: any[]) {
  if (!products || !Array.isArray(products)) return [];
  if (!stockLevels || !Array.isArray(stockLevels)) return products;
  
  return products.map(product => {
    const stockLevel = stockLevels.find(sl => sl.product_id === product.id);
    return {
      ...product,
      // Tồn kho thực tế: lấy từ bảng hmm_stock_levels nếu có, không thì lấy từ WooCommerce
      real_stock: stockLevel?.ton_thuc_te !== undefined ? stockLevel.ton_thuc_te : product.stock_quantity,
      // Đơn đang xử lý: số lượng đặt hàng đang chờ xử lý, lấy từ meta_data hoặc mặc định là 0
      pending_orders: product.meta_data?.find(meta => meta.key === 'pending_orders')?.value || 0,
      // Có thể bán: lấy từ bảng hmm_stock_levels nếu có, không thì tính bằng tồn kho - đơn đang xử lý
      available_to_sell: stockLevel?.co_the_ban !== undefined 
        ? stockLevel.co_the_ban 
        : (product.stock_quantity || 0) - (product.meta_data?.find(meta => meta.key === 'pending_orders')?.value || 0)
    };
  });
}

/**
 * Get transaction type display name for UI
 * @param type Transaction type from database
 * @returns Human-readable transaction type in Vietnamese
 */
export function getTransactionTypeDisplay(type: string): string {
  const types = {
    'initialization': 'Khởi tạo tồn kho',
    'adjustment': 'Điều chỉnh tồn kho',
    'goods_receipt': 'Nhập hàng',
    'return': 'Trả hàng',
    'damaged': 'Hàng hỏng',
    'sync': 'Đồng bộ tồn kho',
    'order_processing': 'Đơn hàng xử lý',
    'order_completed': 'Đơn hàng hoàn thành',
    'order_cancelled': 'Đơn hàng bị hủy',
    'order_cancelled_restore_stock': 'Hoàn trả tồn kho'
  };
  
  return types[type] || type;
}

/**
 * Get reference type display name for UI
 * @param type Reference type from database
 * @returns Human-readable reference type in Vietnamese
 */
export function getReferenceTypeDisplay(type: string): string {
  const types = {
    'goods_receipt': 'Phiếu nhập hàng',
    'return': 'Phiếu trả hàng',
    'damaged': 'Báo cáo hàng hỏng',
    'adjustment': 'Điều chỉnh tồn kho',
    'order': 'Đơn hàng',
    'sync': 'Đồng bộ tồn kho'
  };
  
  return types[type] || type;
}

/**
 * Format transaction for display
 * @param transaction Stock transaction data
 * @returns Formatted transaction data with display fields
 */
export function formatTransactionForDisplay(transaction: any) {
  return {
    ...transaction,
    transaction_type_display: getTransactionTypeDisplay(transaction.transaction_type),
    reference_type_display: transaction.reference_type ? getReferenceTypeDisplay(transaction.reference_type) : '',
    quantity_formatted: transaction.quantity > 0 ? `+${transaction.quantity}` : transaction.quantity,
    created_at_formatted: new Date(transaction.created_at).toLocaleString('vi-VN')
  };
}
