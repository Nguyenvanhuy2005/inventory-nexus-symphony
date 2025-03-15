<?php
/**
 * Plugin Name: HMM Custom API
 * Plugin URI: https://hmm.vn
 * Description: Plugin tạo REST API endpoints tùy chỉnh để truy cập dữ liệu cho ứng dụng React
 * Version: 1.1.0
 * Author: HMM Team
 * Author URI: https://hmm.vn
 * Text Domain: hmm-custom-api
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
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
        sync_status varchar(20) DEFAULT 'pending',
        processed tinyint(1) DEFAULT 0,
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
        affects_stock tinyint(1) DEFAULT 1,
        sync_status varchar(20) DEFAULT 'pending',
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
        affects_stock tinyint(1) DEFAULT 1,
        sync_status varchar(20) DEFAULT 'pending',
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
    
    // Kiểm tra xem bảng có tồn tại không
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        // Nếu không tồn tại, thử tạo bảng mới
        hmm_create_suppliers_table();
        return [];
    }
    
    // In thông tin debug
    error_log("Getting suppliers from table: " . $table_name);
    
    // Thực hiện truy vấn
    $suppliers = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
    
    // In số lượng suppliers tìm thấy
    error_log("Found " . count($suppliers) . " suppliers");
    
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
    
    // Log kết quả
    error_log("Insert supplier result: " . ($wpdb->last_error ? $wpdb->last_error : "success"));
    
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
    
    // Log kết quả
    error_log("Update supplier result: " . ($wpdb->last_error ? $wpdb->last_error : "success"));
    
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
    
    return array('success' => true, 'message' => 'Đã xóa nhà cung cấp');
}

function hmm_create_suppliers_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_suppliers';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        address text,
        phone varchar(50),
        email varchar(100),
        notes text,
        initial_debt decimal(15,2) DEFAULT 0,
        current_debt decimal(15,2) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
        return [];
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
        return new WP_Error('not_found', 'Không tìm thấy phiếu thanh toán', array('status' => 404));
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
    if (empty($params['entity']) || empty($params['entity_id']) || empty($params['amount'])) {
        return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc', array('status' => 400));
    }
    
    // Bắt đầu transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Thêm phiếu thanh toán
        $receipt_data = array(
            'receipt_id' => $params['receipt_id'] ?? 'PMT-' . time(),
            'entity' => $params['entity'],
            'entity_id' => $params['entity_id'],
            'entity_name' => $params['entity_name'],
            'date' => $params['date'] ?? current_time('mysql'),
            'amount' => $params['amount'],
            'payment_method' => $params['payment_method'] ?? 'cash',
            'notes' => $params['notes'] ?? '',
            'type' => $params['type'] ?? 'payment',
            'description' => $params['description'] ?? '',
            'created_by' => $params['created_by'] ?? '',
            'attachment_url' => $params['attachment_url'] ?? '',
            'created_at' => current_time('mysql')
        );
        
        $wpdb->insert($table_name, $receipt_data);
        
        // Cập nhật công nợ nếu cần
        if ($params['entity'] === 'supplier' && !empty($params['update_debt'])) {
            $supplier_table = $wpdb->prefix . 'hmm_suppliers';
            $supplier = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $supplier_table WHERE id = %d", $params['entity_id']),
                ARRAY_A
            );
            
            if ($supplier) {
                $new_debt = $supplier['current_debt'] - $params['amount'];
                $wpdb->update(
                    $supplier_table,
                    array('current_debt' => $new_debt),
                    array('id' => $params['entity_id'])
                );
            }
        }
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        $new_id = $wpdb->insert_id;
        $receipt = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
        
        return $receipt;
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('db_error', $e->getMessage(), array('status' => 500));
    }
}

function hmm_create_payment_receipts_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_payment_receipts';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        receipt_id varchar(50) NOT NULL,
        entity varchar(50) NOT NULL,
        entity_id bigint(20) NOT NULL,
        entity_name varchar(255) NOT NULL,
        date datetime DEFAULT CURRENT_TIMESTAMP,
        amount decimal(15,2) NOT NULL,
        payment_method varchar(50) NOT NULL DEFAULT 'cash',
        notes text,
        type varchar(50) DEFAULT 'payment',
        description text,
        created_by varchar(100),
        attachment_url text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY entity_id (entity, entity_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Stock Levels Functions ---
function hmm_get_stock_levels() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_levels';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_levels_table();
        return [];
    }
    
    $levels = $wpdb->get_results("SELECT * FROM $table_name ORDER BY last_updated DESC", ARRAY_A);
    return $levels;
}

function hmm_get_stock_level($request) {
    global $wpdb;
    $product_id = $request['product_id'];
    $table_name = $wpdb->prefix . 'hmm_stock_levels';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_levels_table();
        return new WP_Error('not_found', 'Không tìm thấy thông tin tồn kho', array('status' => 404));
    }
    
    $level = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE product_id = %d", $product_id),
        ARRAY_A
    );
    
    if (!$level) {
        return new WP_Error('not_found', 'Không tìm thấy thông tin tồn kho cho sản phẩm này', array('status' => 404));
    }
    
    return $level;
}

function hmm_update_stock_level($request) {
    global $wpdb;
    $product_id = $request['product_id'];
    $table_name = $wpdb->prefix . 'hmm_stock_levels';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_levels_table();
    }
    
    $params = $request->get_params();
    
    // Kiểm tra sản phẩm đã có trong bảng tồn kho chưa
    $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE product_id = %d", $product_id));
    
    if ($exists) {
        // Cập nhật tồn kho
        $update_data = array(
            'last_updated' => current_time('mysql')
        );
        
        if (isset($params['ton_thuc_te'])) $update_data['ton_thuc_te'] = $params['ton_thuc_te'];
        if (isset($params['co_the_ban'])) $update_data['co_the_ban'] = $params['co_the_ban'];
        
        $wpdb->update(
            $table_name,
            $update_data,
            array('product_id' => $product_id)
        );
    } else {
        // Thêm mới
        $wpdb->insert(
            $table_name,
            array(
                'product_id' => $product_id,
                'ton_thuc_te' => $params['ton_thuc_te'] ?? 0,
                'co_the_ban' => $params['co_the_ban'] ?? 0,
                'last_updated' => current_time('mysql')
            )
        );
    }
    
    // Lấy thông tin đã cập nhật
    $updated_level = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE product_id = %d", $product_id),
        ARRAY_A
    );
    
    return $updated_level;
}

function hmm_create_stock_level($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_levels';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_levels_table();
    }
    
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['product_id'])) {
        return new WP_Error('missing_fields', 'ID sản phẩm là bắt buộc', array('status' => 400));
    }
    
    // Kiểm tra sản phẩm đã có trong bảng tồn kho chưa
    $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE product_id = %d", $params['product_id']));
    
    if ($exists) {
        return new WP_Error('already_exists', 'Sản phẩm đã có trong bảng tồn kho', array('status' => 400));
    }
    
    // Thêm mới
    $wpdb->insert(
        $table_name,
        array(
            'product_id' => $params['product_id'],
            'ton_thuc_te' => $params['ton_thuc_te'] ?? 0,
            'co_the_ban' => $params['co_the_ban'] ?? 0,
            'last_updated' => current_time('mysql')
        )
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    // Lấy thông tin đã thêm
    $level = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE product_id = %d", $params['product_id']),
        ARRAY_A
    );
    
    return $level;
}

function hmm_create_stock_levels_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_levels';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        product_id bigint(20) NOT NULL,
        ton_thuc_te int(11) NOT NULL DEFAULT 0,
        co_the_ban int(11) NOT NULL DEFAULT 0,
        last_updated datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (product_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Stock Transactions Functions ---
function hmm_get_stock_transactions($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_transactions';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_transactions_table();
        return array(
            'transactions' => array(),
            'total' => 0,
            'page' => 1,
            'per_page' => 100,
            'total_pages' => 0
        );
    }
    
    // Phân trang
    $page = isset($request['page']) ? intval($request['page']) : 1;
    $per_page = isset($request['per_page']) ? intval($request['per_page']) : 100;
    $offset = ($page - 1) * $per_page;
    
    // Truy vấn đếm tổng số bản ghi
    $total_query = "SELECT COUNT(*) FROM $table_name";
    $total = $wpdb->get_var($total_query);
    
    // Truy vấn lấy dữ liệu theo trang
    $query = "SELECT * FROM $table_name ORDER BY created_at DESC LIMIT %d OFFSET %d";
    $transactions = $wpdb->get_results(
        $wpdb->prepare($query, $per_page, $offset),
        ARRAY_A
    );
    
    return array(
        'transactions' => $transactions,
        'total' => (int) $total,
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => ceil($total / $per_page)
    );
}

function hmm_get_product_stock_transactions($request) {
    global $wpdb;
    $product_id = $request['product_id'];
    $table_name = $wpdb->prefix . 'hmm_stock_transactions';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_transactions_table();
        return array();
    }
    
    // Truy vấn lấy giao dịch của sản phẩm
    $query = "SELECT * FROM $table_name WHERE product_id = %d ORDER BY created_at DESC";
    $transactions = $wpdb->get_results(
        $wpdb->prepare($query, $product_id),
        ARRAY_A
    );
    
    return $transactions;
}

function hmm_create_stock_transactions_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_transactions';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_id bigint(20) NOT NULL,
        product_name varchar(255),
        transaction_type varchar(50) NOT NULL,
        quantity int(11) NOT NULL,
        previous_stock int(11) NOT NULL,
        new_stock int(11) NOT NULL,
        reference_id bigint(20),
        reference_type varchar(50),
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY product_id (product_id),
        KEY transaction_type (transaction_type),
        KEY reference_type (reference_type, reference_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Stock Adjustments Functions ---
function hmm_get_stock_adjustments() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_adjustments';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_adjustments_table();
        return [];
    }
    
    $adjustments = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    return $adjustments;
}

function hmm_create_stock_adjustment($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_adjustments';
    $stock_levels_table = $wpdb->prefix . 'hmm_stock_levels';
    $transactions_table = $wpdb->prefix . 'hmm_stock_transactions';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        hmm_create_stock_adjustments_table();
    }
    
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['product_id']) || !isset($params['quantity_change']) || empty($params['reason'])) {
        return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc', array('status' => 400));
    }
    
    // Bắt đầu transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Lấy thông tin tồn kho hiện tại
        $current_stock = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $stock_levels_table WHERE product_id = %d", $params['product_id']),
            ARRAY_A
        );
        
        // Nếu không có thông tin tồn kho, thêm mới
        if (!$current_stock) {
            $wpdb->insert(
                $stock_levels_table,
                array(
                    'product_id' => $params['product_id'],
                    'ton_thuc_te' => 0,
                    'co_the_ban' => 0,
                    'last_updated' => current_time('mysql')
                )
            );
            $current_stock = array(
                'product_id' => $params['product_id'],
                'ton_thuc_te' => 0,
                'co_the_ban' => 0
            );
        }
        
        // Tính toán số lượng mới
        $previous_quantity = $current_stock['ton_thuc_te'];
        $new_quantity = $previous_quantity + $params['quantity_change'];
        
        // Cập nhật bảng tồn kho
        $wpdb->update(
            $stock_levels_table,
            array(
                'ton_thuc_te' => $new_quantity,
                'co_the_ban' => $new_quantity, // Giả sử có thể bán = tồn thực tế khi điều chỉnh
                'last_updated' => current_time('mysql')
            ),
            array('product_id' => $params['product_id'])
        );
        
        // Thêm vào bảng điều chỉnh tồn kho
        $wpdb->insert(
            $table_name,
            array(
                'product_id' => $params['product_id'],
                'product_name' => $params['product_name'],
                'quantity_change' => $params['quantity_change'],
                'previous_quantity' => $previous_quantity,
                'new_quantity' => $new_quantity,
                'reason' => $params['reason'],
                'date' => $params['date'] ?? current_time('mysql'),
                'notes' => $params['notes'] ?? ''
            )
        );
        
        $adjustment_id = $wpdb->insert_id;
        
        // Thêm vào bảng giao dịch tồn kho
        $wpdb->insert(
            $transactions_table,
            array(
                'product_id' => $params['product_id'],
                'product_name' => $params['product_name'],
                'transaction_type' => 'adjustment',
                'quantity' => $params['quantity_change'],
                'previous_stock' => $previous_quantity,
                'new_stock' => $new_quantity,
                'reference_id' => $adjustment_id,
                'reference_type' => 'stock_adjustment',
                'notes' => $params['reason']
            )
        );
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        // Lấy thông tin điều chỉnh đã thêm
        $adjustment = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $adjustment_id),
            ARRAY_A
        );
        
        return $adjustment;
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        return new WP_Error('db_error', $e->getMessage(), array('status' => 500));
    }
}

function hmm_create_stock_adjustments_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_adjustments';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_id bigint(20) NOT NULL,
        product_name varchar(255) NOT NULL,
        quantity_change int(11) NOT NULL,
        previous_quantity int(11) NOT NULL,
        new_quantity int(11) NOT NULL,
        reason text NOT NULL,
        date datetime DEFAULT CURRENT_TIMESTAMP,
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY product_id (product_id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- Stock Sync Log Functions ---
function hmm_create_stock_sync_log_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_stock_sync_log';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        action varchar(50) NOT NULL,
        status varchar(20) NOT NULL,
        details text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id),
        KEY status (status)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// --- WooCommerce Sync Functions ---
function hmm_sync_products_stock($request) {
    if (!class_exists('WooCommerce')) {
        return new WP_Error('woocommerce_not_active', 'WooCommerce không hoạt động', array('status' => 500));
    }
    
    global $wpdb;
    $stock_levels_table = $wpdb->prefix . 'hmm_stock_levels';
    $sync_log_table = $wpdb->prefix . 'hmm_stock_sync_log';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$stock_levels_table'") != $stock_levels_table) {
        hmm_create_stock_levels_table();
    }
    
    if($wpdb->get_var("SHOW TABLES LIKE '$sync_log_table'") != $sync_log_table) {
        hmm_create_stock_sync_log_table();
    }
    
    $params = $request->get_params();
    $products = isset($params['products']) ? $params['products'] : array();
    $direction = isset($params['direction']) ? $params['direction'] : 'to_woocommerce';
    
    $result = array(
        'synced' => array(),
        'failed' => array(),
        'skipped' => array()
    );
    
    // Bắt đầu transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        // Thêm log bắt đầu đồng bộ
        $wpdb->insert(
            $sync_log_table,
            array(
                'action' => 'sync_' . $direction,
                'status' => 'in_progress',
                'details' => json_encode(array(
                    'products_count' => count($products),
                    'started_at' => current_time('mysql')
                ))
            )
        );
        $log_id = $wpdb->insert_id;
        
        if ($direction === 'to_woocommerce') {
            // Đồng bộ từ Tồn Kho sang WooCommerce
            foreach ($products as $product) {
                if (empty($product['product_id'])) {
                    $result['failed'][] = array(
                        'product_id' => null,
                        'error' => 'ID sản phẩm trống'
                    );
                    continue;
                }
                
                // Lấy thông tin tồn kho
                $stock_level = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM $stock_levels_table WHERE product_id = %d", $product['product_id']),
                    ARRAY_A
                );
                
                if (!$stock_level) {
                    $result['skipped'][] = array(
                        'product_id' => $product['product_id'],
                        'product_name' => $product['product_name'] ?? 'Unknown',
                        'reason' => 'Không tìm thấy thông tin tồn kho'
                    );
                    continue;
                }
                
                // Cập nhật tồn kho trong WooCommerce
                $wc_product = wc_get_product($product['product_id']);
                
                if ($wc_product) {
                    wc_update_product_stock($wc_product, $stock_level['ton_thuc_te'], 'set');
                    $result['synced'][] = array(
                        'product_id' => $product['product_id'],
                        'product_name' => $wc_product->get_name(),
                        'stock_quantity' => $stock_level['ton_thuc_te']
                    );
                } else {
                    $result['failed'][] = array(
                        'product_id' => $product['product_id'],
                        'product_name' => $product['product_name'] ?? 'Unknown',
                        'error' => 'Không tìm thấy sản phẩm trong WooCommerce'
                    );
                }
            }
        } else {
            // Đồng bộ từ WooCommerce sang Tồn Kho
            foreach ($products as $product) {
                if (empty($product['product_id'])) {
                    $result['failed'][] = array(
                        'product_id' => null,
                        'error' => 'ID sản phẩm trống'
                    );
                    continue;
                }
                
                $wc_product = wc_get_product($product['product_id']);
                
                if (!$wc_product) {
                    $result['failed'][] = array(
                        'product_id' => $product['product_id'],
                        'product_name' => $product['product_name'] ?? 'Unknown',
                        'error' => 'Không tìm thấy sản phẩm trong WooCommerce'
                    );
                    continue;
                }
                
                $stock_quantity = $wc_product->get_stock_quantity();
                
                // Kiểm tra sản phẩm đã có trong bảng tồn kho chưa
                $exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $stock_levels_table WHERE product_id = %d", $product['product_id']));
                
                if ($exists) {
                    // Cập nhật tồn kho
                    $wpdb->update(
                        $stock_levels_table,
                        array(
                            'ton_thuc_te' => $stock_quantity,
                            'co_the_ban' => $stock_quantity,
                            'last_updated' => current_time('mysql')
                        ),
                        array('product_id' => $product['product_id'])
                    );
                } else {
                    // Thêm mới
                    $wpdb->insert(
                        $stock_levels_table,
                        array(
                            'product_id' => $product['product_id'],
                            'ton_thuc_te' => $stock_quantity,
                            'co_the_ban' => $stock_quantity,
                            'last_updated' => current_time('mysql')
                        )
                    );
                }
                
                $result['synced'][] = array(
                    'product_id' => $product['product_id'],
                    'product_name' => $wc_product->get_name(),
                    'stock_quantity' => $stock_quantity
                );
            }
        }
        
        // Cập nhật log kết thúc đồng bộ
        $wpdb->update(
            $sync_log_table,
            array(
                'status' => 'completed',
                'details' => json_encode(array(
                    'products_count' => count($products),
                    'synced_count' => count($result['synced']),
                    'failed_count' => count($result['failed']),
                    'skipped_count' => count($result['skipped']),
                    'started_at' => current_time('mysql'),
                    'completed_at' => current_time('mysql')
                ))
            ),
            array('id' => $log_id)
        );
        
        // Commit transaction
        $wpdb->query('COMMIT');
        
        return $result;
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        
        // Cập nhật log lỗi
        if (isset($log_id)) {
            $wpdb->update(
                $sync_log_table,
                array(
                    'status' => 'failed',
                    'details' => json_encode(array(
                        'error' => $e->getMessage(),
                        'products_count' => count($products),
                        'started_at' => current_time('mysql'),
                        'failed_at' => current_time('mysql')
                    ))
                ),
                array('id' => $log_id)
            );
        }
        
        return new WP_Error('sync_failed', $e->getMessage(), array('status' => 500));
    }
}

// --- Order Status Change Handler ---
function hmm_handle_order_status_change($order_id, $from_status, $to_status, $order) {
    global $wpdb;
    $stock_levels_table = $wpdb->prefix . 'hmm_stock_levels';
    $transactions_table = $wpdb->prefix . 'hmm_stock_transactions';
    
    // Kiểm tra bảng đã tồn tại chưa, nếu chưa thì tạo mới
    if($wpdb->get_var("SHOW TABLES LIKE '$stock_levels_table'") != $stock_levels_table) {
        hmm_create_stock_levels_table();
    }
    
    if($wpdb->get_var("SHOW TABLES LIKE '$transactions_table'") != $transactions_table) {
        hmm_create_stock_transactions_table();
    }
    
    // Lấy các sản phẩm trong đơn hàng
    $items = $order->get_items();
    
    // Xử lý theo trạng thái đơn hàng
    if ($to_status === 'processing' || $to_status === 'on-hold' || $to_status === 'pending') {
        // Giảm 'co_the_ban' (hàng có thể bán)
        foreach ($items as $item) {
            $product_id = $item->get_product_id();
            $quantity = $item->get_quantity();
            
            // Lấy thông tin tồn kho hiện tại
            $stock_level = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $stock_levels_table WHERE product_id = %d", $product_id),
                ARRAY_A
            );
            
            if ($stock_level) {
                // Tính toán số lượng mới
                $previous_quantity = $stock_level['co_the_ban'];
                $new_quantity = max(0, $previous_quantity - $quantity);
                
                // Cập nhật bảng tồn kho
                $wpdb->update(
                    $stock_levels_table,
                    array(
                        'co_the_ban' => $new_quantity,
                        'last_updated' => current_time('mysql')
                    ),
                    array('product_id' => $product_id)
                );
                
                // Thêm vào bảng giao dịch tồn kho
                $product = wc_get_product($product_id);
                $product_name = $product ? $product->get_name() : "Sản phẩm #$product_id";
                
                $wpdb->insert(
                    $transactions_table,
                    array(
                        'product_id' => $product_id,
                        'product_name' => $product_name,
                        'transaction_type' => 'order_processing',
                        'quantity' => -$quantity,
                        'previous_stock' => $previous_quantity,
                        'new_stock' => $new_quantity,
                        'reference_id' => $order_id,
                        'reference_type' => 'order',
                        'notes' => "Đơn hàng #$order_id chuyển sang trạng thái $to_status"
                    )
                );
            }
        }
    } elseif ($to_status === 'completed') {
        // Giảm 'ton_thuc_te' (tồn kho thực tế)
        foreach ($items as $item) {
            $product_id = $item->get_product_id();
            $quantity = $item->get_quantity();
            
            // Lấy thông tin tồn kho hiện tại
            $stock_level = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $stock_levels_table WHERE product_id = %d", $product_id),
                ARRAY_A
            );
            
            if ($stock_level) {
                // Tính toán số lượng mới
                $previous_quantity = $stock_level['ton_thuc_te'];
                $new_quantity = max(0, $previous_quantity - $quantity);
                
                // Cập nhật bảng tồn kho
                $wpdb->update(
                    $stock_levels_table,
                    array(
                        'ton_thuc_te' => $new_quantity,
                        'last_updated' => current_time('mysql')
                    ),
                    array('product_id' => $product_id)
                );
                
                // Thêm vào bảng giao dịch tồn kho
                $product = wc_get_product($product_id);
                $product_name = $product ? $product->get_name() : "Sản phẩm #$product_id";
                
                $wpdb->insert(
                    $transactions_table,
                    array(
                        'product_id' => $product_id,
                        'product_name' => $product_name,
                        'transaction_type' => 'order_completed',
                        'quantity' => -$quantity,
                        'previous_stock' => $previous_quantity,
                        'new_stock' => $new_quantity,
                        'reference_id' => $order_id,
                        'reference_type' => 'order',
                        'notes' => "Đơn hàng #$order_id đã hoàn thành"
                    )
                );
            }
        }
    } elseif ($to_status === 'cancelled' && ($from_status === 'processing' || $from_status === 'on-hold' || $from_status === 'pending')) {
        // Hoàn trả 'co_the_ban' (hàng có thể bán)
        foreach ($items as $item) {
            $product_id = $item->get_product_id();
            $quantity = $item->get_quantity();
            
            // Lấy thông tin tồn kho hiện tại
            $stock_level = $wpdb->get_row(
                $wpdb->prepare("SELECT * FROM $stock_levels_table WHERE product_id = %d", $product_id),
                ARRAY_A
            );
            
            if ($stock_level) {
                // Tính toán số lượng mới
                $previous_quantity = $stock_level['co_the_ban'];
                $new_quantity = $previous_quantity + $quantity;
                
                // Cập nhật bảng tồn kho
                $wpdb->update(
                    $stock_levels_table,
                    array(
                        'co_the_ban' => $new_quantity,
                        'last_updated' => current_time('mysql')
                    ),
                    array('product_id' => $product_id)
                );
                
                // Thêm vào bảng giao dịch tồn kho
                $product = wc_get_product($product_id);
                $product_name = $product ? $product->get_name() : "Sản phẩm #$product_id";
                
                $wpdb->insert(
                    $transactions_table,
                    array(
                        'product_id' => $product_id,
                        'product_name' => $product_name,
                        'transaction_type' => 'order_cancelled_restore_stock',
                        'quantity' => $quantity,
                        'previous_stock' => $previous_quantity,
                        'new_stock' => $new_quantity,
                        'reference_id' => $order_id,
                        'reference_type' => 'order',
                        'notes' => "Đơn hàng #$order_id đã bị hủy, hoàn trả tồn kho"
                    )
                );
            }
        }
    }
}

// --- API Status Check ---
function hmm_api_status() {
    return array(
        'status' => 'ok',
        'message' => 'HMM Custom API is running',
        'version' => '1.1.0',
        'timestamp' => current_time('mysql')
    );
}

// --- Permission Check Function ---
function hmm_api_permissions_check($request) {
    // Cho phép truy cập nếu người dùng có quyền edit_posts
    return current_user_can('edit_posts');
}

// --- Đăng ký REST API routes ---
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
    
    // Register stock levels endpoints
    register_rest_route('custom/v1', '/stock-levels', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_stock_levels',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-levels/(?P<product_id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_stock_level',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-levels/(?P<product_id>\d+)', array(
        'methods' => 'PUT',
        'callback' => 'hmm_update_stock_level',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-levels', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_stock_level',
        'permission_callback' => 'hmm_api_permissions_check',
    ));

    // Register status endpoint
    register_rest_route('custom/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'hmm_api_status',
        'permission_callback' => '__return_true',
    ));
    
    // Register new stock management endpoints
    register_rest_route('custom/v1', '/stock-management/sync', array(
        'methods' => 'POST',
        'callback' => 'hmm_sync_products_stock',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-transactions', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_stock_transactions',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-transactions/(?P<product_id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_product_stock_transactions',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-adjustments', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_stock_adjustments',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    register_rest_route('custom/v1', '/stock-adjustments', array(
        'methods' => 'POST',
        'callback' => 'hmm_create_stock_adjustment',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
}

// Hook vào rest_api_init để đăng ký endpoints
add_action('rest_api_init', 'hmm_register_custom_api_endpoints');

// Hook vào WooCommerce order status changes
add_action('woocommerce_order_status_changed', 'hmm_handle_order_status_change', 10, 4);

// Activation hook - Chạy khi plugin được kích hoạt
function hmm_activate_plugin() {
    // Tạo các bảng cần thiết
    hmm_create_damaged_stock_table();
    hmm_create_goods_receipts_table();
    hmm_create_returns_table();
    hmm_create_suppliers_table();
    hmm_create_payment_receipts_table();
    hmm_create_stock_levels_table();
    hmm_create_stock_transactions_table();
    hmm_create_stock_adjustments_table();
    hmm_create_stock_sync_log_table();
}

// Đăng ký activation hook
register_activation_hook(__FILE__, 'hmm_activate_plugin');

