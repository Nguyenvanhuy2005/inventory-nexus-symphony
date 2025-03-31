
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý nhập hàng</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách phiếu nhập</button>
            <button class="hmm-tab-link" data-tab="create">Tạo phiếu nhập</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <div class="hmm-filter-bar">
                <div class="hmm-search">
                    <input type="text" id="receipt-search" placeholder="Tìm kiếm phiếu nhập..." />
                    <button id="receipt-search-btn"><span class="dashicons dashicons-search"></span></button>
                </div>
                <div class="hmm-filter">
                    <select id="receipt-status-filter">
                        <option value="">Tất cả trạng thái</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="pending">Chưa hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                    <select id="receipt-payment-filter">
                        <option value="">Tất cả TT thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="partial">Một phần</option>
                        <option value="pending">Chưa thanh toán</option>
                    </select>
                    <div class="hmm-date-range">
                        <input type="date" id="receipt-date-from" placeholder="Từ ngày">
                        <input type="date" id="receipt-date-to" placeholder="Đến ngày">
                    </div>
                </div>
                <div class="hmm-actions">
                    <button id="filter-receipts" class="button"><span class="dashicons dashicons-filter"></span> Lọc</button>
                    <button id="export-receipts" class="button"><span class="dashicons dashicons-download"></span> Xuất danh sách</button>
                </div>
            </div>
            
            <div id="receipts-list-container">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Ngày</th>
                            <th>Nhà cung cấp</th>
                            <th>Tổng tiền</th>
                            <th>Đã thanh toán</th>
                            <th>TT thanh toán</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="receipts-list">
                        <tr>
                            <td colspan="8">Đang tải dữ liệu...</td>
                        </tr>
                    </tbody>
                </table>
                <div class="hmm-pagination" id="receipts-pagination"></div>
            </div>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <form id="receipt-form" class="hmm-form">
                <input type="hidden" name="id" id="receipt-id" value="0">
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group">
                        <label for="receipt-id-display">Mã phiếu</label>
                        <input type="text" id="receipt-id-display" disabled value="Tự động tạo">
                    </div>
                    <div class="hmm-form-group">
                        <label for="receipt-date">Ngày nhập <span class="required">*</span></label>
                        <input type="date" id="receipt-date" name="date" required value="<?php echo date('Y-m-d'); ?>">
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group wide">
                        <label for="receipt-supplier">Nhà cung cấp <span class="required">*</span></label>
                        <select id="receipt-supplier" name="supplier_id" required>
                            <option value="">Chọn nhà cung cấp</option>
                            <!-- Filled via JavaScript -->
                        </select>
                    </div>
                </div>
                
                <div class="hmm-section">
                    <h3>Thông tin sản phẩm</h3>
                    <div class="hmm-product-add">
                        <select id="receipt-product" name="product">
                            <option value="">Chọn sản phẩm</option>
                            <!-- Filled via JavaScript -->
                        </select>
                        <input type="number" id="receipt-quantity" name="quantity" placeholder="Số lượng" min="1" value="1">
                        <input type="number" id="receipt-price" name="price" placeholder="Đơn giá" min="0">
                        <button type="button" id="add-product" class="button">Thêm</button>
                    </div>
                    
                    <table class="wp-list-table widefat fixed striped" id="receipt-items-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th width="100">SKU</th>
                                <th width="100">Số lượng</th>
                                <th width="150">Đơn giá</th>
                                <th width="150">Thành tiền</th>
                                <th width="50">Xóa</th>
                            </tr>
                        </thead>
                        <tbody id="receipt-items">
                            <tr id="no-items">
                                <td colspan="6">Chưa có sản phẩm nào</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="4" class="text-right">Tổng tiền:</th>
                                <th id="receipt-total" class="text-right">0</th>
                                <th></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="hmm-section">
                    <h3>Thanh toán</h3>
                    <div class="hmm-form-row">
                        <div class="hmm-form-group">
                            <label for="receipt-payment-amount">Số tiền đã thanh toán</label>
                            <input type="number" id="receipt-payment-amount" name="payment_amount" min="0" value="0">
                        </div>
                        <div class="hmm-form-group">
                            <label for="receipt-payment-method">Phương thức thanh toán</label>
                            <select id="receipt-payment-method" name="payment_method">
                                <option value="cash">Tiền mặt</option>
                                <option value="bank_transfer">Chuyển khoản</option>
                                <option value="card">Thẻ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="hmm-form-row">
                        <div class="hmm-form-group">
                            <label for="receipt-payment-status">Trạng thái thanh toán</label>
                            <select id="receipt-payment-status" name="payment_status">
                                <option value="paid">Đã thanh toán</option>
                                <option value="partial">Một phần</option>
                                <option value="pending">Chưa thanh toán</option>
                            </select>
                        </div>
                        <div class="hmm-form-group">
                            <label for="receipt-status">Trạng thái phiếu</label>
                            <select id="receipt-status" name="status">
                                <option value="completed">Hoàn thành</option>
                                <option value="pending">Đang xử lý</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group wide">
                        <label for="receipt-notes">Ghi chú</label>
                        <textarea id="receipt-notes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="hmm-form-actions">
                    <button type="button" id="receipt-cancel" class="button">Hủy</button>
                    <button type="submit" id="receipt-save" class="button button-primary">Lưu phiếu nhập</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div id="receipt-view-dialog" class="hmm-dialog hmm-dialog-lg">
    <div class="hmm-dialog-content">
        <div class="hmm-dialog-header">
            <h3>Chi tiết phiếu nhập</h3>
            <span class="hmm-dialog-close">&times;</span>
        </div>
        <div class="hmm-dialog-body" id="receipt-view-content">
            <div class="hmm-loading">Đang tải dữ liệu...</div>
        </div>
        <div class="hmm-dialog-footer">
            <button class="button hmm-dialog-close">Đóng</button>
            <button class="button button-primary" id="print-receipt">In phiếu</button>
        </div>
    </div>
</div>

<div id="receipt-delete-dialog" class="hmm-dialog">
    <div class="hmm-dialog-content">
        <div class="hmm-dialog-header">
            <h3>Xác nhận hủy phiếu</h3>
            <span class="hmm-dialog-close">&times;</span>
        </div>
        <div class="hmm-dialog-body">
            <p>Bạn có chắc chắn muốn hủy phiếu nhập hàng này không?</p>
            <p>Hành động này sẽ đảo ngược tất cả các thay đổi tồn kho và có thể không hoàn tác được.</p>
        </div>
        <div class="hmm-dialog-footer">
            <button class="button hmm-dialog-cancel">Hủy thao tác</button>
            <button class="button button-danger" id="confirm-cancel-receipt">Hủy phiếu nhập</button>
        </div>
    </div>
</div>
