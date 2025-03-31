
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý nhà cung cấp</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách nhà cung cấp</button>
            <button class="hmm-tab-link" data-tab="create">Tạo mới nhà cung cấp</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <div class="hmm-filter-bar">
                <div class="hmm-search">
                    <input type="text" id="supplier-search" placeholder="Tìm kiếm nhà cung cấp..." />
                    <button id="supplier-search-btn"><span class="dashicons dashicons-search"></span></button>
                </div>
                <div class="hmm-actions">
                    <button id="export-suppliers" class="button"><span class="dashicons dashicons-download"></span> Xuất danh sách</button>
                </div>
            </div>
            
            <div id="suppliers-list-container">
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Tên nhà cung cấp</th>
                            <th>Liên hệ</th>
                            <th>Địa chỉ</th>
                            <th>Nợ ban đầu</th>
                            <th>Nợ hiện tại</th>
                            <th>Ghi chú</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="suppliers-list">
                        <tr>
                            <td colspan="8">Đang tải dữ liệu...</td>
                        </tr>
                    </tbody>
                </table>
                <div class="hmm-pagination" id="suppliers-pagination"></div>
            </div>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <form id="supplier-form" class="hmm-form">
                <input type="hidden" name="id" id="supplier-id" value="0">
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group">
                        <label for="supplier-name">Tên nhà cung cấp <span class="required">*</span></label>
                        <input type="text" id="supplier-name" name="name" required>
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group">
                        <label for="supplier-contact-name">Người liên hệ</label>
                        <input type="text" id="supplier-contact-name" name="contact_name">
                    </div>
                    <div class="hmm-form-group">
                        <label for="supplier-phone">Số điện thoại</label>
                        <input type="text" id="supplier-phone" name="phone">
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group">
                        <label for="supplier-email">Email</label>
                        <input type="email" id="supplier-email" name="email">
                    </div>
                    <div class="hmm-form-group">
                        <label for="supplier-initial-debt">Nợ ban đầu</label>
                        <input type="number" id="supplier-initial-debt" name="initial_debt" value="0" min="0" step="1000">
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group wide">
                        <label for="supplier-address">Địa chỉ</label>
                        <input type="text" id="supplier-address" name="address">
                    </div>
                </div>
                
                <div class="hmm-form-row">
                    <div class="hmm-form-group">
                        <label for="supplier-status">Trạng thái</label>
                        <select id="supplier-status" name="status">
                            <option value="active">Đang hoạt động</option>
                            <option value="inactive">Ngừng hoạt động</option>
                        </select>
                    </div>
                    <div class="hmm-form-group wide">
                        <label for="supplier-notes">Ghi chú</label>
                        <textarea id="supplier-notes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="hmm-form-actions">
                    <button type="button" id="supplier-cancel" class="button">Hủy</button>
                    <button type="submit" id="supplier-save" class="button button-primary">Lưu nhà cung cấp</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div id="supplier-delete-dialog" class="hmm-dialog">
    <div class="hmm-dialog-content">
        <div class="hmm-dialog-header">
            <h3>Xác nhận xóa</h3>
            <span class="hmm-dialog-close">&times;</span>
        </div>
        <div class="hmm-dialog-body">
            <p>Bạn có chắc chắn muốn xóa nhà cung cấp này không? Hành động này không thể hoàn tác.</p>
        </div>
        <div class="hmm-dialog-footer">
            <button class="button hmm-dialog-cancel">Hủy</button>
            <button class="button button-danger" id="confirm-delete-supplier">Xóa</button>
        </div>
    </div>
</div>
