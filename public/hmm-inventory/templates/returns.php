
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Lấy thông tin từ database nếu cần
global $wpdb;
$returns_table = $wpdb->prefix . 'hmm_returns';
$items_table = $wpdb->prefix . 'hmm_return_items';

// Lấy số lượng phiếu trả theo từng loại
$supplier_returns_count = $wpdb->get_var("SELECT COUNT(*) FROM $returns_table WHERE type = 'supplier'");
$customer_returns_count = $wpdb->get_var("SELECT COUNT(*) FROM $returns_table WHERE type = 'customer'");
?>

<div class="wrap">
    <h1>Quản lý trả hàng</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách phiếu trả (<?php echo $supplier_returns_count + $customer_returns_count; ?>)</button>
            <button class="hmm-tab-link" data-tab="create">Tạo phiếu trả</button>
            <button class="hmm-tab-link" data-tab="supplier">Trả hàng nhà cung cấp (<?php echo $supplier_returns_count; ?>)</button>
            <button class="hmm-tab-link" data-tab="customer">Khách trả hàng (<?php echo $customer_returns_count; ?>)</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <div class="hmm-filters">
                <select id="filter-type" class="hmm-filter">
                    <option value="">Tất cả loại</option>
                    <option value="supplier">Trả nhà cung cấp</option>
                    <option value="customer">Khách trả hàng</option>
                </select>
                
                <select id="filter-status" class="hmm-filter">
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Đang xử lý</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Hủy</option>
                </select>
                
                <div class="hmm-date-range">
                    <input type="date" id="filter-date-from" class="hmm-filter" placeholder="Từ ngày">
                    <span>đến</span>
                    <input type="date" id="filter-date-to" class="hmm-filter" placeholder="Đến ngày">
                </div>
                
                <button id="apply-filters" class="button">Lọc</button>
                <button id="reset-filters" class="button">Xóa lọc</button>
            </div>
            
            <div class="hmm-table-container">
                <table class="widefat hmm-data-table" id="returns-table">
                    <thead>
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Loại</th>
                            <th>Đối tác</th>
                            <th>Ngày</th>
                            <th>Tổng tiền</th>
                            <th>Đã hoàn tiền</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="hmm-loading-row">
                            <td colspan="8">Đang tải dữ liệu...</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="hmm-pagination">
                    <div class="hmm-pagination-info">
                        <span>Hiển thị <span id="showing-start">0</span> đến <span id="showing-end">0</span> của <span id="total-items">0</span> phiếu</span>
                    </div>
                    <div class="hmm-pagination-controls">
                        <button id="prev-page" class="button" disabled>&laquo; Trước</button>
                        <span id="current-page">1</span> / <span id="total-pages">1</span>
                        <button id="next-page" class="button" disabled>Sau &raquo;</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <div class="hmm-form-container">
                <form id="create-return-form" class="hmm-form">
                    <div class="hmm-form-header">
                        <h3>Tạo phiếu trả hàng mới</h3>
                    </div>
                    
                    <div class="hmm-form-body">
                        <div class="hmm-form-row">
                            <div class="hmm-form-group">
                                <label for="return-type">Loại trả hàng <span class="required">*</span></label>
                                <select id="return-type" name="type" required>
                                    <option value="">-- Chọn loại --</option>
                                    <option value="supplier">Trả hàng nhà cung cấp</option>
                                    <option value="customer">Khách trả hàng</option>
                                </select>
                            </div>
                            
                            <div class="hmm-form-group entity-selector supplier-selector" style="display: none;">
                                <label for="supplier-id">Nhà cung cấp <span class="required">*</span></label>
                                <select id="supplier-id" name="supplier_id">
                                    <option value="">-- Chọn nhà cung cấp --</option>
                                    <!-- Danh sách nhà cung cấp sẽ được tải bằng AJAX -->
                                </select>
                            </div>
                            
                            <div class="hmm-form-group entity-selector customer-selector" style="display: none;">
                                <label for="customer-id">Khách hàng <span class="required">*</span></label>
                                <select id="customer-id" name="customer_id">
                                    <option value="">-- Chọn khách hàng --</option>
                                    <!-- Danh sách khách hàng sẽ được tải bằng AJAX -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="hmm-form-row">
                            <div class="hmm-form-group">
                                <label for="return-date">Ngày trả <span class="required">*</span></label>
                                <input type="date" id="return-date" name="date" value="<?php echo date('Y-m-d'); ?>" required>
                            </div>
                            
                            <div class="hmm-form-group">
                                <label for="return-reason">Lý do trả hàng</label>
                                <input type="text" id="return-reason" name="reason" placeholder="Lý do trả hàng">
                            </div>
                        </div>
                        
                        <h4>Sản phẩm trả <button type="button" id="add-product" class="button">+ Thêm sản phẩm</button></h4>
                        
                        <div class="hmm-products-table-container">
                            <table class="hmm-products-table" id="products-table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th width="100">Số lượng</th>
                                        <th width="150">Đơn giá</th>
                                        <th width="150">Thành tiền</th>
                                        <th width="50">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" class="text-right"><strong>Tổng cộng:</strong></td>
                                        <td>
                                            <span id="total-amount">0</span> ₫
                                            <input type="hidden" name="total_amount" value="0">
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        
                        <div class="hmm-form-row">
                            <div class="hmm-form-group">
                                <label for="refund-amount">Số tiền hoàn trả</label>
                                <input type="number" id="refund-amount" name="refund_amount" value="0" min="0">
                            </div>
                            
                            <div class="hmm-form-group">
                                <label for="payment-status">Trạng thái hoàn tiền</label>
                                <select id="payment-status" name="payment_status">
                                    <option value="not_refunded">Chưa hoàn tiền</option>
                                    <option value="partial_refunded">Hoàn tiền một phần</option>
                                    <option value="refunded">Đã hoàn tiền</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="hmm-form-group">
                            <label for="return-notes">Ghi chú</label>
                            <textarea id="return-notes" name="notes" rows="3"></textarea>
                        </div>
                        
                        <div class="hmm-form-group">
                            <label>
                                <input type="checkbox" name="affects_stock" checked>
                                Cập nhật số lượng tồn kho
                            </label>
                        </div>
                    </div>
                    
                    <div class="hmm-form-footer">
                        <button type="button" id="return-back" class="button button-secondary">Quay lại</button>
                        <button type="submit" id="submit-return" class="button button-primary">Lưu phiếu trả hàng</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div class="hmm-tab-content" id="supplier-tab">
            <h3>Trả hàng nhà cung cấp</h3>
            <p>Đây là trang quản lý trả hàng cho nhà cung cấp</p>
            <!-- Nội dung trả hàng nhà cung cấp sẽ được tải bằng JavaScript -->
        </div>
        
        <div class="hmm-tab-content" id="customer-tab">
            <h3>Khách trả hàng</h3>
            <p>Đây là trang quản lý khách trả hàng</p>
            <!-- Nội dung khách trả hàng sẽ được tải bằng JavaScript -->
        </div>
    </div>
</div>

<!-- Template for product row -->
<script type="text/template" id="product-row-template">
    <tr class="product-row">
        <td>
            <select name="items[{index}][product_id]" class="product-select" required>
                <option value="">-- Chọn sản phẩm --</option>
                <!-- Danh sách sản phẩm sẽ được tải bằng AJAX -->
            </select>
        </td>
        <td>
            <input type="number" name="items[{index}][quantity]" class="quantity" value="1" min="1" required>
        </td>
        <td>
            <input type="number" name="items[{index}][unit_price]" class="unit-price" value="0" min="0" required>
        </td>
        <td>
            <span class="line-total">0</span> ₫
            <input type="hidden" name="items[{index}][total_price]" value="0">
        </td>
        <td>
            <button type="button" class="button remove-product">×</button>
        </td>
    </tr>
</script>

<!-- Template for return detail modal -->
<div id="return-detail-modal" class="hmm-modal">
    <div class="hmm-modal-content">
        <div class="hmm-modal-header">
            <h3>Chi tiết phiếu trả hàng</h3>
            <span class="hmm-modal-close">&times;</span>
        </div>
        <div class="hmm-modal-body">
            <!-- Chi tiết phiếu trả hàng sẽ được tải bằng AJAX -->
            <div class="hmm-loading">Đang tải dữ liệu...</div>
        </div>
        <div class="hmm-modal-footer">
            <button class="button hmm-modal-close">Đóng</button>
            <button class="button button-primary hmm-print-return">In phiếu</button>
        </div>
    </div>
</div>

<style>
    /* Basic styling for the returns page */
    .hmm-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 15px;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
    }
    
    .hmm-filter {
        min-width: 150px;
    }
    
    .hmm-date-range {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .hmm-table-container {
        margin-top: 15px;
        overflow-x: auto;
    }
    
    .hmm-data-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .hmm-data-table th,
    .hmm-data-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .hmm-data-table th {
        background-color: #f2f2f2;
    }
    
    .hmm-data-table tbody tr:hover {
        background-color: #f9f9f9;
    }
    
    .hmm-loading-row td {
        text-align: center;
        padding: 20px;
    }
    
    .hmm-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        padding: 10px 0;
    }
    
    .hmm-form-container {
        background-color: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .hmm-form-header,
    .hmm-form-footer {
        padding: 15px;
        background-color: #f9f9f9;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .hmm-form-footer {
        border-top: 1px solid #e0e0e0;
        border-bottom: none;
        text-align: right;
    }
    
    .hmm-form-body {
        padding: 15px;
    }
    
    .hmm-form-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 15px;
    }
    
    .hmm-form-group {
        flex: 1;
        min-width: 200px;
    }
    
    .hmm-form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .hmm-form-group input,
    .hmm-form-group select,
    .hmm-form-group textarea {
        width: 100%;
    }
    
    .hmm-products-table-container {
        margin: 15px 0;
        overflow-x: auto;
    }
    
    .hmm-products-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .hmm-products-table th,
    .hmm-products-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .hmm-products-table th {
        background-color: #f2f2f2;
    }
    
    .text-right {
        text-align: right;
    }
    
    .required {
        color: red;
    }
    
    /* Modal styling */
    .hmm-modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    }
    
    .hmm-modal-content {
        background-color: #fff;
        margin: 5% auto;
        padding: 0;
        border-radius: 4px;
        width: 80%;
        max-width: 800px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        position: relative;
    }
    
    .hmm-modal-header,
    .hmm-modal-footer {
        padding: 15px;
        background-color: #f9f9f9;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .hmm-modal-footer {
        border-top: 1px solid #e0e0e0;
        border-bottom: none;
        text-align: right;
    }
    
    .hmm-modal-body {
        padding: 15px;
        max-height: 60vh;
        overflow-y: auto;
    }
    
    .hmm-modal-close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }
    
    .hmm-modal-close:hover {
        color: #000;
    }
    
    .hmm-loading {
        text-align: center;
        padding: 20px;
    }
</style>

<script>
jQuery(document).ready(function($) {
    // Tab navigation
    $('.hmm-tab-link').click(function() {
        var tab = $(this).data('tab');
        $('.hmm-tab-link').removeClass('active');
        $(this).addClass('active');
        $('.hmm-tab-content').removeClass('active');
        $('#' + tab + '-tab').addClass('active');
    });
    
    // Return type change handler
    $('#return-type').change(function() {
        var type = $(this).val();
        $('.entity-selector').hide();
        if (type === 'supplier') {
            $('.supplier-selector').show();
        } else if (type === 'customer') {
            $('.customer-selector').show();
        }
    });
    
    // Add product row
    var productIndex = 0;
    $('#add-product').click(function() {
        var template = $('#product-row-template').html();
        var newRow = template.replace(/{index}/g, productIndex++);
        $('#products-table tbody').append(newRow);
        
        // Initialize product select (in real implementation, this would load products from an API)
        loadProducts();
        
        // Setup event handlers for the new row
        setupRowHandlers();
    });
    
    // Initialize with one product row
    $('#add-product').click();
    
    // Setup product row event handlers
    function setupRowHandlers() {
        // Remove product
        $('.remove-product').off('click').on('click', function() {
            $(this).closest('tr').remove();
            calculateTotal();
        });
        
        // Calculate line total when quantity or price changes
        $('.quantity, .unit-price').off('input').on('input', function() {
            var row = $(this).closest('tr');
            var quantity = parseFloat(row.find('.quantity').val()) || 0;
            var unitPrice = parseFloat(row.find('.unit-price').val()) || 0;
            var lineTotal = quantity * unitPrice;
            
            // Update line total display and hidden input
            row.find('.line-total').text(lineTotal.toLocaleString('vi-VN'));
            row.find('input[name$="[total_price]"]').val(lineTotal);
            
            calculateTotal();
        });
    }
    
    // Calculate total
    function calculateTotal() {
        var total = 0;
        $('.line-total').each(function() {
            total += parseFloat($(this).text().replace(/,/g, '')) || 0;
        });
        
        $('#total-amount').text(total.toLocaleString('vi-VN'));
        $('input[name="total_amount"]').val(total);
        
        // Set refund amount to match total by default
        $('#refund-amount').val(total);
    }
    
    // Form submission handler (in real implementation, this would submit to an AJAX API)
    $('#create-return-form').submit(function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return false;
        }
        
        // Collect form data
        var formData = $(this).serialize();
        
        // Submit to API
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'hmm_create_return',
                nonce: hmm_inventory.nonce,
                formData: formData
            },
            beforeSend: function() {
                $('#submit-return').prop('disabled', true).text('Đang lưu...');
            },
            success: function(response) {
                if (response.success) {
                    alert('Đã tạo phiếu trả hàng thành công!');
                    // Reset form or navigate to the returns list
                    window.location.href = '?page=hmm-returns';
                } else {
                    alert('Lỗi: ' + (response.data.message || 'Không thể tạo phiếu trả hàng'));
                    $('#submit-return').prop('disabled', false).text('Lưu phiếu trả hàng');
                }
            },
            error: function() {
                alert('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
                $('#submit-return').prop('disabled', false).text('Lưu phiếu trả hàng');
            }
        });
    });
    
    // Form validation
    function validateForm() {
        var isValid = true;
        var type = $('#return-type').val();
        
        if (!type) {
            alert('Vui lòng chọn loại trả hàng');
            isValid = false;
        } else if (type === 'supplier' && !$('#supplier-id').val()) {
            alert('Vui lòng chọn nhà cung cấp');
            isValid = false;
        } else if (type === 'customer' && !$('#customer-id').val()) {
            alert('Vui lòng chọn khách hàng');
            isValid = false;
        }
        
        if ($('#products-table tbody tr').length === 0) {
            alert('Vui lòng thêm ít nhất một sản phẩm');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Load products for select dropdown (simplified example)
    function loadProducts() {
        // In real implementation, this would fetch from an API
        var sampleProducts = [
            {id: 1, name: "Sản phẩm A", price: 100000},
            {id: 2, name: "Sản phẩm B", price: 150000},
            {id: 3, name: "Sản phẩm C", price: 200000}
        ];
        
        var options = '<option value="">-- Chọn sản phẩm --</option>';
        
        sampleProducts.forEach(function(product) {
            options += '<option value="' + product.id + '" data-price="' + product.price + '">' + product.name + '</option>';
        });
        
        $('.product-select:last').html(options);
        
        // Set up change handler for product select
        $('.product-select:last').change(function() {
            var selectedOption = $(this).find('option:selected');
            var price = selectedOption.data('price') || 0;
            var row = $(this).closest('tr');
            
            // Update product name hidden input and price
            row.find('.unit-price').val(price).trigger('input');
            
            // Also store the product name
            var productName = selectedOption.text();
            if (!row.find('input[name$="[product_name]"]').length) {
                row.append('<input type="hidden" name="items[' + (productIndex-1) + '][product_name]" value="' + productName + '">');
            } else {
                row.find('input[name$="[product_name]"]').val(productName);
            }
        });
    }
    
    // Back button handler
    $('#return-back').click(function() {
        $('.hmm-tab-link[data-tab="list"]').click();
    });
    
    // Load returns list (would be implemented with AJAX in real implementation)
    function loadReturns(page = 1, filters = {}) {
        // Placeholder function - would make AJAX call to load data
        console.log('Loading returns:', page, filters);
        
        // For demo purposes, we'll just show a simulated loading and then faked data
        $('#returns-table tbody').html('<tr class="hmm-loading-row"><td colspan="8">Đang tải dữ liệu...</td></tr>');
        
        setTimeout(function() {
            var sampleData = [];
            
            // Generate some sample data
            for (var i = 1; i <= 10; i++) {
                sampleData.push({
                    id: i,
                    return_id: 'RTN-202309' + (i < 10 ? '0' + i : i),
                    type: i % 2 === 0 ? 'supplier' : 'customer',
                    entity_name: i % 2 === 0 ? 'Nhà cung cấp ' + i : 'Khách hàng ' + i,
                    date: '2023-09-' + (i < 10 ? '0' + i : i),
                    total_amount: i * 100000,
                    refund_amount: i % 3 === 0 ? 0 : i * 100000,
                    payment_status: i % 3 === 0 ? 'not_refunded' : (i % 3 === 1 ? 'partial_refunded' : 'refunded'),
                    status: i % 3 === 0 ? 'pending' : (i % 3 === 1 ? 'completed' : 'cancelled')
                });
            }
            
            renderReturnsTable(sampleData);
            
            // Update pagination
            $('#showing-start').text((page - 1) * 10 + 1);
            $('#showing-end').text(Math.min(page * 10, 35));
            $('#total-items').text(35);
            $('#current-page').text(page);
            $('#total-pages').text(4);
            
            $('#prev-page').prop('disabled', page === 1);
            $('#next-page').prop('disabled', page === 4);
        }, 500);
    }
    
    // Render returns table
    function renderReturnsTable(data) {
        if (!data || data.length === 0) {
            $('#returns-table tbody').html('<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>');
            return;
        }
        
        var rows = '';
        
        data.forEach(function(item) {
            var paymentStatus = '';
            var statusClass = '';
            
            if (item.payment_status === 'refunded') {
                paymentStatus = '<span class="status-badge status-success">Đã hoàn tiền</span>';
            } else if (item.payment_status === 'partial_refunded') {
                paymentStatus = '<span class="status-badge status-warning">Hoàn tiền một phần</span>';
            } else {
                paymentStatus = '<span class="status-badge status-danger">Chưa hoàn tiền</span>';
            }
            
            if (item.status === 'completed') {
                statusClass = 'status-success';
            } else if (item.status === 'cancelled') {
                statusClass = 'status-danger';
            } else {
                statusClass = 'status-warning';
            }
            
            rows += '<tr>' +
                '<td>' + item.return_id + '</td>' +
                '<td>' + (item.type === 'supplier' ? 'Trả NCC' : 'Khách trả') + '</td>' +
                '<td>' + item.entity_name + '</td>' +
                '<td>' + formatDate(item.date) + '</td>' +
                '<td>' + formatCurrency(item.total_amount) + '</td>' +
                '<td>' + formatCurrency(item.refund_amount) + '</td>' +
                '<td><span class="status-badge ' + statusClass + '">' + formatStatus(item.status) + '</span></td>' +
                '<td>' +
                '<button class="button view-return" data-id="' + item.id + '">Xem</button> ' +
                '</td>' +
                '</tr>';
        });
        
        $('#returns-table tbody').html(rows);
        
        // Setup view button click handler
        $('.view-return').click(function() {
            var id = $(this).data('id');
            showReturnDetail(id);
        });
    }
    
    // Show return detail modal
    function showReturnDetail(id) {
        // In real implementation, this would fetch the detail from an API
        console.log('Show detail for return:', id);
        
        // Show modal
        $('#return-detail-modal').css('display', 'block');
        $('#return-detail-modal .hmm-modal-body').html('<div class="hmm-loading">Đang tải dữ liệu...</div>');
        
        // Simulate loading data
        setTimeout(function() {
            var detailHtml = '<div class="hmm-return-detail">' +
                '<div class="hmm-detail-header">' +
                '<h4>Phiếu trả hàng: RTN-20230912</h4>' +
                '<p><strong>Loại:</strong> Trả hàng nhà cung cấp</p>' +
                '<p><strong>Nhà cung cấp:</strong> Công ty ABC</p>' +
                '<p><strong>Ngày:</strong> 12/09/2023</p>' +
                '<p><strong>Lý do:</strong> Hàng bị lỗi</p>' +
                '</div>' +
                '<div class="hmm-detail-body">' +
                '<h5>Danh sách sản phẩm</h5>' +
                '<table class="widefat">' +
                '<thead>' +
                '<tr>' +
                '<th>Sản phẩm</th>' +
                '<th>Số lượng</th>' +
                '<th>Đơn giá</th>' +
                '<th>Thành tiền</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody>' +
                '<tr>' +
                '<td>Sản phẩm A</td>' +
                '<td>2</td>' +
                '<td>100,000 ₫</td>' +
                '<td>200,000 ₫</td>' +
                '</tr>' +
                '<tr>' +
                '<td>Sản phẩm B</td>' +
                '<td>1</td>' +
                '<td>150,000 ₫</td>' +
                '<td>150,000 ₫</td>' +
                '</tr>' +
                '</tbody>' +
                '<tfoot>' +
                '<tr>' +
                '<td colspan="3" class="text-right"><strong>Tổng cộng:</strong></td>' +
                '<td>350,000 ₫</td>' +
                '</tr>' +
                '<tr>' +
                '<td colspan="3" class="text-right"><strong>Đã hoàn tiền:</strong></td>' +
                '<td>350,000 ₫</td>' +
                '</tr>' +
                '</tfoot>' +
                '</table>' +
                '</div>' +
                '<div class="hmm-detail-footer">' +
                '<p><strong>Trạng thái:</strong> <span class="status-badge status-success">Hoàn thành</span></p>' +
                '<p><strong>Trạng thái hoàn tiền:</strong> <span class="status-badge status-success">Đã hoàn tiền</span></p>' +
                '<p><strong>Ghi chú:</strong> Đã xử lý đầy đủ và hoàn tiền cho nhà cung cấp</p>' +
                '</div>' +
                '</div>';
            
            $('#return-detail-modal .hmm-modal-body').html(detailHtml);
        }, 500);
    }
    
    // Close modal when clicking the X or close button
    $('.hmm-modal-close').click(function() {
        $('#return-detail-modal').css('display', 'none');
    });
    
    // Also close when clicking outside the modal
    $(window).click(function(event) {
        if ($(event.target).is('.hmm-modal')) {
            $('.hmm-modal').css('display', 'none');
        }
    });
    
    // Pagination handlers
    $('#prev-page').click(function() {
        var currentPage = parseInt($('#current-page').text());
        if (currentPage > 1) {
            loadReturns(currentPage - 1);
        }
    });
    
    $('#next-page').click(function() {
        var currentPage = parseInt($('#current-page').text());
        var totalPages = parseInt($('#total-pages').text());
        if (currentPage < totalPages) {
            loadReturns(currentPage + 1);
        }
    });
    
    // Filter handlers
    $('#apply-filters').click(function() {
        var filters = {
            type: $('#filter-type').val(),
            status: $('#filter-status').val(),
            dateFrom: $('#filter-date-from').val(),
            dateTo: $('#filter-date-to').val()
        };
        
        loadReturns(1, filters);
    });
    
    $('#reset-filters').click(function() {
        $('#filter-type').val('');
        $('#filter-status').val('');
        $('#filter-date-from').val('');
        $('#filter-date-to').val('');
        
        loadReturns(1, {});
    });
    
    // Helper functions
    function formatDate(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }
    
    function formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(value) + ' ₫';
    }
    
    function formatStatus(status) {
        switch (status) {
            case 'pending':
                return 'Đang xử lý';
            case 'completed':
                return 'Hoàn thành';
            case 'cancelled':
                return 'Hủy';
            default:
                return status;
        }
    }
    
    // Initial load
    loadReturns();
});
</script>
