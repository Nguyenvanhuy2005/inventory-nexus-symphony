
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đăng ký các thiết lập
function hmm_inventory_register_settings() {
    // Thông tin doanh nghiệp
    register_setting('hmm-inventory-settings', 'hmm_company_name');
    register_setting('hmm-inventory-settings', 'hmm_company_address');
    register_setting('hmm-inventory-settings', 'hmm_company_phone');
    register_setting('hmm-inventory-settings', 'hmm_company_email');
    register_setting('hmm-inventory-settings', 'hmm_company_tax_id');
    
    // Thiết lập hàng hóa
    register_setting('hmm-inventory-settings', 'hmm_auto_update_stock', array(
        'type' => 'boolean',
        'default' => true,
    ));
    register_setting('hmm-inventory-settings', 'hmm_low_stock_threshold', array(
        'type' => 'number',
        'default' => 5,
    ));
    register_setting('hmm-inventory-settings', 'hmm_default_supplier');
    register_setting('hmm-inventory-settings', 'hmm_default_payment_status');
    
    // Thiết lập email
    register_setting('hmm-inventory-settings', 'hmm_enable_email_notifications', array(
        'type' => 'boolean',
        'default' => false,
    ));
    register_setting('hmm-inventory-settings', 'hmm_notification_email');
    register_setting('hmm-inventory-settings', 'hmm_notify_low_stock', array(
        'type' => 'boolean',
        'default' => false,
    ));
    register_setting('hmm-inventory-settings', 'hmm_notify_new_receipt', array(
        'type' => 'boolean',
        'default' => false,
    ));
}
add_action('admin_init', 'hmm_inventory_register_settings');

// Lấy danh sách nhà cung cấp cho dropdown
function hmm_get_suppliers_for_dropdown() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    $suppliers = $wpdb->get_results("SELECT id, name FROM $table_name WHERE status = 'active' ORDER BY name ASC", ARRAY_A);
    
    return $suppliers;
}
$suppliers = hmm_get_suppliers_for_dropdown();

// Lấy giá trị các thiết lập
$company_name = get_option('hmm_company_name', '');
$company_address = get_option('hmm_company_address', '');
$company_phone = get_option('hmm_company_phone', '');
$company_email = get_option('hmm_company_email', '');
$company_tax_id = get_option('hmm_company_tax_id', '');

$auto_update_stock = get_option('hmm_auto_update_stock', true);
$low_stock_threshold = get_option('hmm_low_stock_threshold', 5);
$default_supplier = get_option('hmm_default_supplier', '');
$default_payment_status = get_option('hmm_default_payment_status', 'pending');

$enable_email_notifications = get_option('hmm_enable_email_notifications', false);
$notification_email = get_option('hmm_notification_email', '');
$notify_low_stock = get_option('hmm_notify_low_stock', false);
$notify_new_receipt = get_option('hmm_notify_new_receipt', false);
?>

<div class="wrap">
    <h1>Cài đặt HMM Inventory</h1>
    
    <form method="post" action="options.php">
        <?php settings_fields('hmm-inventory-settings'); ?>
        
        <div class="hmm-settings-container">
            <div class="hmm-settings-section">
                <h2>Thông tin doanh nghiệp</h2>
                <p class="description">Thông tin này sẽ được hiển thị trên báo cáo và phiếu in</p>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="hmm_company_name">Tên doanh nghiệp</label></th>
                        <td>
                            <input type="text" id="hmm_company_name" name="hmm_company_name" value="<?php echo esc_attr($company_name); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_company_address">Địa chỉ</label></th>
                        <td>
                            <textarea id="hmm_company_address" name="hmm_company_address" rows="3" class="regular-text"><?php echo esc_textarea($company_address); ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_company_phone">Số điện thoại</label></th>
                        <td>
                            <input type="text" id="hmm_company_phone" name="hmm_company_phone" value="<?php echo esc_attr($company_phone); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_company_email">Email</label></th>
                        <td>
                            <input type="email" id="hmm_company_email" name="hmm_company_email" value="<?php echo esc_attr($company_email); ?>" class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_company_tax_id">Mã số thuế</label></th>
                        <td>
                            <input type="text" id="hmm_company_tax_id" name="hmm_company_tax_id" value="<?php echo esc_attr($company_tax_id); ?>" class="regular-text">
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="hmm-settings-section">
                <h2>Thiết lập hàng hóa</h2>
                <p class="description">Quản lý các thiết lập liên quan đến hàng hóa và kho</p>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="hmm_auto_update_stock">Tự động cập nhật kho</label></th>
                        <td>
                            <label>
                                <input type="checkbox" id="hmm_auto_update_stock" name="hmm_auto_update_stock" value="1" <?php checked($auto_update_stock); ?>>
                                Tự động cập nhật số lượng tồn kho khi nhập/trả hàng
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_low_stock_threshold">Ngưỡng cảnh báo sắp hết hàng</label></th>
                        <td>
                            <input type="number" id="hmm_low_stock_threshold" name="hmm_low_stock_threshold" value="<?php echo esc_attr($low_stock_threshold); ?>" min="1" class="small-text">
                            <p class="description">Hiển thị cảnh báo khi số lượng tồn kho thấp hơn giá trị này</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_default_supplier">Nhà cung cấp mặc định</label></th>
                        <td>
                            <select id="hmm_default_supplier" name="hmm_default_supplier" class="regular-text">
                                <option value="">-- Chọn nhà cung cấp --</option>
                                <?php foreach ($suppliers as $supplier): ?>
                                    <option value="<?php echo esc_attr($supplier['id']); ?>" <?php selected($default_supplier, $supplier['id']); ?>>
                                        <?php echo esc_html($supplier['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_default_payment_status">Trạng thái thanh toán mặc định</label></th>
                        <td>
                            <select id="hmm_default_payment_status" name="hmm_default_payment_status" class="regular-text">
                                <option value="pending" <?php selected($default_payment_status, 'pending'); ?>>Chưa thanh toán</option>
                                <option value="partial" <?php selected($default_payment_status, 'partial'); ?>>Thanh toán một phần</option>
                                <option value="paid" <?php selected($default_payment_status, 'paid'); ?>>Đã thanh toán</option>
                            </select>
                        </td>
                    </tr>
                </table>
            </div>
            
            <div class="hmm-settings-section">
                <h2>Thiết lập thông báo email</h2>
                <p class="description">Quản lý các thông báo tự động qua email</p>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="hmm_enable_email_notifications">Bật thông báo email</label></th>
                        <td>
                            <label>
                                <input type="checkbox" id="hmm_enable_email_notifications" name="hmm_enable_email_notifications" value="1" <?php checked($enable_email_notifications); ?>>
                                Cho phép gửi email thông báo
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="hmm_notification_email">Email nhận thông báo</label></th>
                        <td>
                            <input type="email" id="hmm_notification_email" name="hmm_notification_email" value="<?php echo esc_attr($notification_email); ?>" class="regular-text">
                            <p class="description">Để trống để sử dụng email quản trị viên</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Gửi thông báo khi</th>
                        <td>
                            <label>
                                <input type="checkbox" id="hmm_notify_low_stock" name="hmm_notify_low_stock" value="1" <?php checked($notify_low_stock); ?>>
                                Hàng hóa sắp hết
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" id="hmm_notify_new_receipt" name="hmm_notify_new_receipt" value="1" <?php checked($notify_new_receipt); ?>>
                                Có phiếu nhập hàng mới
                            </label>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
        
        <?php submit_button('Lưu cài đặt'); ?>
    </form>
</div>

<style>
    .hmm-settings-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 20px;
    }
    
    .hmm-settings-section {
        background: #fff;
        border: 1px solid #ccd0d4;
        border-radius: 4px;
        padding: 20px;
        margin-bottom: 20px;
        width: 100%;
    }
    
    .hmm-settings-section h2 {
        margin-top: 0;
        padding-bottom: 12px;
        border-bottom: 1px solid #eee;
    }
    
    @media screen and (min-width: 1200px) {
        .hmm-settings-section {
            width: calc(50% - 10px);
            min-width: 400px;
        }
    }
</style>

