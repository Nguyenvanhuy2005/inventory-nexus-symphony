
<?php
/**
 * Plugin Name: HMM Custom API
 * Plugin URI: https://hmm.vn
 * Description: Plugin tạo REST API endpoints tùy chỉnh để truy cập dữ liệu cho ứng dụng React
 * Version: 1.0.0
 * Author: HMM Team
 * Author URI: https://hmm.vn
 * Text Domain: hmm-custom-api
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đăng ký REST API routes
add_action('rest_api_init', 'hmm_register_custom_api_endpoints');

function hmm_register_custom_api_endpoints() {
    // Register damaged stock endpoints
    register_rest_route('custom/v1', '/damaged-stock', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_damaged_stock',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/damaged-stock', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_damaged_stock',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    // Register goods receipts endpoints
    register_rest_route('custom/v1', '/goods-receipts', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_goods_receipts',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/goods-receipts/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_goods_receipt',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/goods-receipts', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_goods_receipt',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    // Register returns endpoints
    register_rest_route('custom/v1', '/returns', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_returns',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/returns/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_return',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/returns', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_return',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    // Register suppliers endpoints
    register_rest_route('custom/v1', '/suppliers', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_suppliers',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/suppliers/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_supplier',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/suppliers', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_supplier',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/suppliers/(?P<id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'hmm_update_supplier',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/suppliers/(?P<id>\d+)', array(
        'methods' => 'DELETE',
        'callback' => 'hmm_delete_supplier',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    // Register payment receipts endpoints
    register_rest_route('custom/v1', '/payment-receipts', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_payment_receipts',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/payment-receipts/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_payment_receipt',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/payment-receipts', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_payment_receipt',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
}

// Kiểm tra quyền truy cập API
function hmm_api_permissions_check() {
    // Kiểm tra Basic Auth hoặc nonce cho REST API
    return current_user_can('edit_posts');
}

// --- Damaged Stock Functions ---
function hmm_get_damaged_stock() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_damaged_stock';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_damaged_stock_table();
    }
    
    $items = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    return $items;
}

function hmm_create_damaged_stock($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_damaged_stock';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_damaged_stock_table();
    }
    
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['product_id']) || empty($params['quantity']) || empty($params['reason'])) {
        return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc', array('status' => 400));
    }
    
    $wpdb->insert(
        $table_name,
        array(
            'product_id' => $params['product_id'],
            'product_name' => $params['product_name'],
            'quantity' => $params['quantity'],
            'reason' => $params['reason'],
            'notes' => isset($params['notes']) ? $params['notes'] : '',
            'date' => isset($params['date']) ? $params['date'] : current_time('mysql')
        ),
        array('%d', '%s', '%d', '%s', '%s', '%s')
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    $new_id = $wpdb->insert_id;
    $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
    
    return $item;
}

function hmm_create_damaged_stock_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_damaged_stock';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_id bigint(20) NOT NULL,
        product_name varchar(255) NOT NULL,
        quantity int(11) NOT NULL,
        reason text NOT NULL,
        notes text,
        date datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Goods Receipts Functions ---
function hmm_get_goods_receipts() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_goods_receipts';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_goods_receipts_table();
    }
    
    $receipts = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    
    // Lấy thêm thông tin chi tiết sản phẩm
    $details_table = $wpdb->prefix . 'hmm_goods_receipt_items';
    foreach ($receipts as &$receipt) {
        $receipt['items'] = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $details_table WHERE receipt_id = %d", $receipt['id']),
            ARRAY_A
        );
    }
    
    return $receipts;
}

function hmm_get_goods_receipt($request) {
    global $wpdb;
    $receipt_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_goods_receipts';
    
    $receipt = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $receipt_id),
        ARRAY_A
    );
    
    if (!$receipt) {
        return new WP_Error('not_found', 'Không tìm thấy phiếu nhập hàng', array('status' => 404));
    }
    
    // Lấy thông tin chi tiết sản phẩm
    $details_table = $wpdb->prefix . 'hmm_goods_receipt_items';
    $receipt['items'] = $wpdb->get_results(
        $wpdb->prepare("SELECT * FROM $details_table WHERE receipt_id = %d", $receipt_id),
        ARRAY_A
    );
    
    return $receipt;
}

function hmm_create_goods_receipt($request) {
    global $wpdb;
    $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
    $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$receipts_table'") != $receipts_table) {
        hmm_create_goods_receipts_table();
    }
    
    $params = $request->get_params();
    
    // Bắt đầu transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Thêm thông tin phiếu nhập
        $receipt_data = array(
            'receipt_id' => $params['receipt_id'] ?? 'GR-' . time(),
            'supplier_id' => $params['supplier_id'],
            'supplier_name' => $params['supplier_name'],
            'date' => $params['date'] ?? current_time('mysql'),
            'total_amount' => $params['total_amount'],
            'payment_amount' => $params['payment_amount'] ?? 0,
            'payment_status' => $params['payment_status'] ?? 'pending',
            'status' => $params['status'] ?? 'pending',
            'notes' => $params['notes'] ?? ''
        );
        
        $wpdb->insert($receipts_table, $receipt_data);
        $new_receipt_id = $wpdb->insert_id;
        
        // Thêm chi tiết sản phẩm
        if (!empty($params['items']) && is_array($params['items'])) {
            foreach ($params['items'] as $item) {
                $item_data = array(
                    'receipt_id' => $new_receipt_id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price']
                );
                
                $wpdb->insert($items_table, $item_data);
            }
        }
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        // Lấy thông tin phiếu nhập đã tạo
        $new_receipt = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $receipts_table WHERE id = %d", $new_receipt_id),
            ARRAY_A
        );
        
        // Lấy thông tin chi tiết sản phẩm
        $new_receipt['items'] = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $items_table WHERE receipt_id = %d", $new_receipt_id),
            ARRAY_A
        );
        
        return $new_receipt;
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('db_error', $e->getMessage(), array('status' => 500));
    }
}

function hmm_create_goods_receipts_table() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    // Bảng phiếu nhập hàng
    $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
    $receipts_sql = "CREATE TABLE $receipts_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        receipt_id varchar(50) NOT NULL,
        supplier_id bigint(20) NOT NULL,
        supplier_name varchar(255) NOT NULL,
        date datetime DEFAULT CURRENT_TIMESTAMP,
        total_amount decimal(15,2) NOT NULL DEFAULT 0,
        payment_amount decimal(15,2) NOT NULL DEFAULT 0,
        payment_status varchar(20) NOT NULL DEFAULT 'pending',
        status varchar(20) NOT NULL DEFAULT 'pending',
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    // Bảng chi tiết sản phẩm nhập
    $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
    $items_sql = "CREATE TABLE $items_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        receipt_id bigint(20) NOT NULL,
        product_id bigint(20) NOT NULL,
        product_name varchar(255) NOT NULL,
        quantity int(11) NOT NULL,
        unit_price decimal(15,2) NOT NULL,
        total_price decimal(15,2) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY receipt_id (receipt_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($receipts_sql);
    dbDelta($items_sql);
}

// --- Returns Functions ---
function hmm_get_returns() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_returns';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_returns_table();
    }
    
    $returns = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    
    // Lấy thêm thông tin chi tiết sản phẩm
    $details_table = $wpdb->prefix . 'hmm_return_items';
    foreach ($returns as &$return) {
        $return['items'] = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $details_table WHERE return_id = %d", $return['id']),
            ARRAY_A
        );
    }
    
    return $returns;
}

function hmm_get_return($request) {
    global $wpdb;
    $return_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_returns';
    
    $return = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $return_id),
        ARRAY_A
    );
    
    if (!$return) {
        return new WP_Error('not_found', 'Không tìm thấy phiếu trả hàng', array('status' => 404));
    }
    
    // Lấy thông tin chi tiết sản phẩm
    $details_table = $wpdb->prefix . 'hmm_return_items';
    $return['items'] = $wpdb->get_results(
        $wpdb->prepare("SELECT * FROM $details_table WHERE return_id = %d", $return_id),
        ARRAY_A
    );
    
    return $return;
}

function hmm_create_return($request) {
    global $wpdb;
    $returns_table = $wpdb->prefix . 'hmm_returns';
    $items_table = $wpdb->prefix . 'hmm_return_items';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$returns_table'") != $returns_table) {
        hmm_create_returns_table();
    }
    
    $params = $request->get_params();
    
    // Bắt đầu transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Thêm thông tin phiếu trả hàng
        $return_data = array(
            'return_id' => $params['return_id'] ?? 'RTN-' . time(),
            'entity_id' => $params['entity_id'],
            'entity_name' => $params['entity_name'],
            'type' => $params['type'], // customer hoặc supplier
            'date' => $params['date'] ?? current_time('mysql'),
            'total_amount' => $params['total_amount'],
            'refund_amount' => $params['refund_amount'] ?? 0,
            'reason' => $params['reason'] ?? '',
            'status' => $params['status'] ?? 'pending',
            'notes' => $params['notes'] ?? ''
        );
        
        $wpdb->insert($returns_table, $return_data);
        $new_return_id = $wpdb->insert_id;
        
        // Thêm chi tiết sản phẩm
        if (!empty($params['items']) && is_array($params['items'])) {
            foreach ($params['items'] as $item) {
                $item_data = array(
                    'return_id' => $new_return_id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'reason' => $item['reason'] ?? ''
                );
                
                $wpdb->insert($items_table, $item_data);
            }
        }
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        // Lấy thông tin phiếu trả hàng đã tạo
        $new_return = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $returns_table WHERE id = %d", $new_return_id),
            ARRAY_A
        );
        
        // Lấy thông tin chi tiết sản phẩm
        $new_return['items'] = $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM $items_table WHERE return_id = %d", $new_return_id),
            ARRAY_A
        );
        
        return $new_return;
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('db_error', $e->getMessage(), array('status' => 500));
    }
}

function hmm_create_returns_table() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();
    
    // Bảng phiếu trả hàng
    $returns_table = $wpdb->prefix . 'hmm_returns';
    $returns_sql = "CREATE TABLE $returns_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        return_id varchar(50) NOT NULL,
        entity_id bigint(20) NOT NULL,
        entity_name varchar(255) NOT NULL,
        type varchar(20) NOT NULL, 
        date datetime DEFAULT CURRENT_TIMESTAMP,
        total_amount decimal(15,2) NOT NULL DEFAULT 0,
        refund_amount decimal(15,2) NOT NULL DEFAULT 0,
        reason text,
        status varchar(20) NOT NULL DEFAULT 'pending',
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    // Bảng chi tiết sản phẩm trả
    $items_table = $wpdb->prefix . 'hmm_return_items';
    $items_sql = "CREATE TABLE $items_table (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        return_id bigint(20) NOT NULL,
        product_id bigint(20) NOT NULL,
        product_name varchar(255) NOT NULL,
        quantity int(11) NOT NULL,
        unit_price decimal(15,2) NOT NULL,
        total_price decimal(15,2) NOT NULL,
        reason text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY return_id (return_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($returns_sql);
    dbDelta($items_sql);
}

// --- Suppliers Functions ---
function hmm_get_suppliers() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_suppliers_table();
    }
    
    $suppliers = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
    return $suppliers;
}

function hmm_get_supplier($request) {
    global $wpdb;
    $supplier_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    $supplier = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $supplier_id),
        ARRAY_A
    );
    
    if (!$supplier) {
        return new WP_Error('not_found', 'Không tìm thấy nhà cung cấp', array('status' => 404));
    }
    
    return $supplier;
}

function hmm_create_supplier($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_suppliers_table();
    }
    
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['name'])) {
        return new WP_Error('missing_fields', 'Tên nhà cung cấp là bắt buộc', array('status' => 400));
    }
    
    $wpdb->insert(
        $table_name,
        array(
            'name' => $params['name'],
            'address' => $params['address'] ?? '',
            'email' => $params['email'] ?? '',
            'phone' => $params['phone'] ?? '',
            'initial_debt' => $params['initial_debt'] ?? 0,
            'current_debt' => $params['current_debt'] ?? 0,
            'notes' => $params['notes'] ?? '',
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql')
        )
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    $new_id = $wpdb->insert_id;
    $supplier = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
    
    return $supplier;
}

function hmm_update_supplier($request) {
    global $wpdb;
    $supplier_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    // Kiểm tra nhà cung cấp tồn tại
    $supplier = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $supplier_id),
        ARRAY_A
    );
    
    if (!$supplier) {
        return new WP_Error('not_found', 'Không tìm thấy nhà cung cấp', array('status' => 404));
    }
    
    $params = $request->get_params();
    
    // Cập nhật thông tin
    $update_data = array(
        'updated_at' => current_time('mysql')
    );
    
    // Thêm các trường được cập nhật
    if (isset($params['name'])) $update_data['name'] = $params['name'];
    if (isset($params['address'])) $update_data['address'] = $params['address'];
    if (isset($params['email'])) $update_data['email'] = $params['email'];
    if (isset($params['phone'])) $update_data['phone'] = $params['phone'];
    if (isset($params['initial_debt'])) $update_data['initial_debt'] = $params['initial_debt'];
    if (isset($params['current_debt'])) $update_data['current_debt'] = $params['current_debt'];
    if (isset($params['notes'])) $update_data['notes'] = $params['notes'];
    
    $wpdb->update(
        $table_name,
        $update_data,
        array('id' => $supplier_id)
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    // Lấy thông tin đã cập nhật
    $updated_supplier = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $supplier_id),
        ARRAY_A
    );
    
    return $updated_supplier;
}

function hmm_delete_supplier($request) {
    global $wpdb;
    $supplier_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    
    // Kiểm tra nhà cung cấp tồn tại
    $supplier = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $supplier_id),
        ARRAY_A
    );
    
    if (!$supplier) {
        return new WP_Error('not_found', 'Không tìm thấy nhà cung cấp', array('status' => 404));
    }
    
    // Xóa nhà cung cấp
    $wpdb->delete(
        $table_name,
        array('id' => $supplier_id)
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    return array(
        'deleted' => true,
        'message' => 'Nhà cung cấp đã được xóa thành công'
    );
}

function hmm_create_suppliers_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        address text,
        email varchar(100),
        phone varchar(20),
        initial_debt decimal(15,2) DEFAULT 0,
        current_debt decimal(15,2) DEFAULT 0,
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Payment Receipts Functions ---
function hmm_get_payment_receipts() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_payment_receipts';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_payment_receipts_table();
    }
    
    $receipts = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    return $receipts;
}

function hmm_get_payment_receipt($request) {
    global $wpdb;
    $receipt_id = $request['id'];
    $table_name = $wpdb->prefix . 'hmm_payment_receipts';
    
    $receipt = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $receipt_id),
        ARRAY_A
    );
    
    if (!$receipt) {
        return new WP_Error('not_found', 'Không tìm thấy phiếu thu chi', array('status' => 404));
    }
    
    return $receipt;
}

function hmm_create_payment_receipt($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_payment_receipts';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_payment_receipts_table();
    }
    
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['entity']) || empty($params['entity_id']) || 
        empty($params['type']) || empty($params['amount'])) {
        return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc', array('status' => 400));
    }
    
    $wpdb->insert(
        $table_name,
        array(
            'receipt_id' => $params['receipt_id'] ?? 'PR-' . time(),
            'entity' => $params['entity'],
            'entity_id' => $params['entity_id'],
            'entity_name' => $params['entity_name'],
            'type' => $params['type'],
            'amount' => $params['amount'],
            'payment_method' => $params['payment_method'] ?? 'cash',
            'reference' => $params['reference'] ?? '',
            'date' => $params['date'] ?? current_time('mysql'),
            'notes' => $params['notes'] ?? '',
            'created_at' => current_time('mysql')
        )
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    $new_id = $wpdb->insert_id;
    $receipt = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
    
    // Cập nhật nợ hiện tại của nhà cung cấp hoặc khách hàng
    if ($params['entity'] === 'supplier') {
        $supplier_table = $wpdb->prefix . 'hmm_suppliers';
        $supplier = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $supplier_table WHERE id = %d", $params['entity_id']),
            ARRAY_A
        );
        
        if ($supplier) {
            $debt_change = $params['type'] === 'payment' ? -$params['amount'] : $params['amount'];
            $new_debt = $supplier['current_debt'] + $debt_change;
            
            $wpdb->update(
                $supplier_table,
                array('current_debt' => $new_debt),
                array('id' => $params['entity_id'])
            );
        }
    }
    
    return $receipt;
}

function hmm_create_payment_receipts_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_payment_receipts';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        receipt_id varchar(50) NOT NULL,
        entity varchar(20) NOT NULL,
        entity_id bigint(20) NOT NULL,
        entity_name varchar(255) NOT NULL,
        type varchar(20) NOT NULL,
        amount decimal(15,2) NOT NULL,
        payment_method varchar(20) NOT NULL DEFAULT 'cash',
        reference varchar(100),
        date datetime DEFAULT CURRENT_TIMESTAMP,
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// Activation hook để tạo các bảng cần thiết
register_activation_hook(__FILE__, 'hmm_activate_plugin');

function hmm_activate_plugin() {
    hmm_create_damaged_stock_table();
    hmm_create_goods_receipts_table();
    hmm_create_returns_table();
    hmm_create_suppliers_table();
    hmm_create_payment_receipts_table();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'hmm_deactivate_plugin');

function hmm_deactivate_plugin() {
    // Thực hiện các thao tác khi plugin bị tắt
}