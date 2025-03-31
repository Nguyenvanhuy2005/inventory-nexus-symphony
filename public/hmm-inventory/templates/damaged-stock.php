
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý hàng hỏng</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách hàng hỏng</button>
            <button class="hmm-tab-link" data-tab="create">Tạo mới</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2>Danh sách hàng hỏng</h2>
                </div>
                <div class="hmm-card-body">
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Lý do</th>
                                <th>Ghi chú</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="hmm-damaged-stock-list">
                            <tr>
                                <td colspan="7">Đang tải dữ liệu...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2>Tạo báo cáo hàng hỏng</h2>
                </div>
                <div class="hmm-card-body">
                    <form id="hmm-damaged-stock-form">
                        <div class="hmm-form-row">
                            <div class="hmm-form-group">
                                <label for="product_id">Sản phẩm</label>
                                <select id="product_id" name="product_id" class="regular-text" required>
                                    <option value="">-- Chọn sản phẩm --</option>
                                    <!-- Products will be loaded via AJAX -->
                                </select>
                            </div>
                            <div class="hmm-form-group">
                                <label for="quantity">Số lượng</label>
                                <input type="number" id="quantity" name="quantity" class="regular-text" required min="1" value="1">
                            </div>
                        </div>
                        
                        <div class="hmm-form-row">
                            <div class="hmm-form-group">
                                <label for="reason">Lý do</label>
                                <select id="reason" name="reason" class="regular-text" required>
                                    <option value="">-- Chọn lý do --</option>
                                    <option value="damaged">Hàng hỏng</option>
                                    <option value="expired">Hàng hết hạn</option>
                                    <option value="quality_issues">Vấn đề chất lượng</option>
                                    <option value="other">Lý do khác</option>
                                </select>
                            </div>
                            <div class="hmm-form-group">
                                <label for="date">Ngày</label>
                                <input type="date" id="date" name="date" class="regular-text" value="<?php echo date('Y-m-d'); ?>">
                            </div>
                        </div>
                        
                        <div class="hmm-form-group">
                            <label for="notes">Ghi chú</label>
                            <textarea id="notes" name="notes" class="large-text" rows="4"></textarea>
                        </div>
                        
                        <div class="hmm-form-actions">
                            <button type="submit" class="button button-primary">Tạo báo cáo</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Tab switching
    $('.hmm-tab-link').on('click', function() {
        $('.hmm-tab-link').removeClass('active');
        $(this).addClass('active');
        
        $('.hmm-tab-content').removeClass('active');
        $('#' + $(this).data('tab') + '-tab').addClass('active');
    });
    
    // Load damaged stock list
    function loadDamagedStock() {
        $.ajax({
            url: hmm_inventory.ajax_url,
            type: 'POST',
            data: {
                action: 'hmm_get_damaged_stock',
                nonce: hmm_inventory.nonce
            },
            success: function(response) {
                if (response.success) {
                    const damagedStock = response.data.damaged_stock;
                    let html = '';
                    
                    if (damagedStock.length === 0) {
                        html = '<tr><td colspan="7">Không có dữ liệu</td></tr>';
                    } else {
                        damagedStock.forEach(function(item) {
                            html += `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.product_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatReason(item.reason)}</td>
                                    <td>${item.notes || ''}</td>
                                    <td>${formatDate(item.date)}</td>
                                    <td>
                                        <button class="button view-item" data-id="${item.id}">Xem</button>
                                    </td>
                                </tr>
                            `;
                        });
                    }
                    
                    $('#hmm-damaged-stock-list').html(html);
                }
            },
            error: function() {
                $('#hmm-damaged-stock-list').html('<tr><td colspan="7">Lỗi tải dữ liệu</td></tr>');
            }
        });
    }
    
    // Load products for select dropdown
    function loadProducts() {
        $.ajax({
            url: hmm_inventory.ajax_url,
            type: 'POST',
            data: {
                action: 'hmm_get_products',
                nonce: hmm_inventory.nonce
            },
            success: function(response) {
                if (response.success) {
                    const products = response.data.products;
                    let options = '<option value="">-- Chọn sản phẩm --</option>';
                    
                    products.forEach(function(product) {
                        options += `<option value="${product.id}" data-name="${product.name}">${product.name}</option>`;
                    });
                    
                    $('#product_id').html(options);
                }
            }
        });
    }
    
    // Submit damaged stock form
    $('#hmm-damaged-stock-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = $(this).serializeArray();
        const data = {
            action: 'hmm_create_damaged_stock',
            nonce: hmm_inventory.nonce,
            product_name: $('#product_id option:selected').text()
        };
        
        formData.forEach(function(item) {
            data[item.name] = item.value;
        });
        
        $.ajax({
            url: hmm_inventory.ajax_url,
            type: 'POST',
            data: data,
            success: function(response) {
                if (response.success) {
                    alert('Đã tạo báo cáo hàng hỏng thành công');
                    $('#hmm-damaged-stock-form').trigger('reset');
                    $('.hmm-tab-link[data-tab="list"]').click();
                    loadDamagedStock();
                } else {
                    alert('Lỗi: ' + response.data.message);
                }
            },
            error: function() {
                alert('Lỗi kết nối server');
            }
        });
    });
    
    // Helper functions
    function formatReason(reason) {
        const reasons = {
            'damaged': 'Hàng hỏng',
            'expired': 'Hàng hết hạn',
            'quality_issues': 'Vấn đề chất lượng',
            'other': 'Lý do khác'
        };
        
        return reasons[reason] || reason;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    }
    
    // Initial load
    loadDamagedStock();
    loadProducts();
});
</script>
