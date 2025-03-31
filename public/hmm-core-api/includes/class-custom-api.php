
<?php
/**
 * HMM Custom API Module
 * 
 * Provides business logic API endpoints
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Custom_API {
    /**
     * Constructor
     */
    public function __construct() {
        // Đăng ký REST API routes
        add_action('rest_api_init', array($this, 'register_api_routes'));
    }
    
    /**
     * Đăng ký các API endpoints
     */
    public function register_api_routes() {
        // Suppliers Endpoints
        register_rest_route('hmm/v1', '/suppliers', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_suppliers'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/suppliers', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_supplier'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_supplier'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_supplier'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_supplier'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Goods Receipts Endpoints
        register_rest_route('hmm/v1', '/goods-receipts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_goods_receipts'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_goods_receipt'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_goods_receipt'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Returns Endpoints
        register_rest_route('hmm/v1', '/returns', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_returns'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/returns', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_return'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/returns/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_return'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Damaged Stock Endpoints
        register_rest_route('hmm/v1', '/damaged-stock', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_damaged_stock'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/damaged-stock', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_damaged_stock'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Payment Receipts Endpoints
        register_rest_route('hmm/v1', '/payment-receipts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_payment_receipts'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/payment-receipts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_payment_receipt'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/payment-receipts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_payment_receipt'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
    }
    
    /**
     * Kiểm tra quyền truy cập API
     */
    public function api_permissions_check($request) {
        // Sử dụng phương thức chung từ lớp chính
        global $hmm_core_api;
        return $hmm_core_api->api_permissions_check($request);
    }
    
    /**
     * --- Damaged Stock Functions ---
     */
    public function get_damaged_stock() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_damaged_stock';
        
        // Kiểm tra bảng đã tồn tại chưa
        if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array();
        }
        
        $items = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
        return $items;
    }

    public function create_damaged_stock($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_damaged_stock';
        
        $params = $request->get_json_params();
        
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
            )
        );
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
        }
        
        $new_id = $wpdb->insert_id;
        $item = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
        
        return $item;
    }
    
    /**
     * --- Goods Receipts Functions ---
     */
    public function get_goods_receipts() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_goods_receipts';
        
        // Kiểm tra bảng đã tồn tại chưa
        if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array();
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

    public function get_goods_receipt($request) {
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

    public function create_goods_receipt($request) {
        global $wpdb;
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        
        $params = $request->get_json_params();
        
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
    
    /**
     * --- Returns Functions ---
     */
    public function get_returns() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_returns';
        
        // Kiểm tra bảng đã tồn tại chưa
        if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array();
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

    public function get_return($request) {
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

    public function create_return($request) {
        global $wpdb;
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $items_table = $wpdb->prefix . 'hmm_return_items';
        
        $params = $request->get_json_params();
        
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
    
    /**
     * --- Suppliers Functions ---
     */
    public function get_suppliers() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        // Kiểm tra xem bảng có tồn tại không
        if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array();
        }
        
        // Thực hiện truy vấn
        $suppliers = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
        return $suppliers;
    }

    public function get_supplier($request) {
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

    public function create_supplier($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        $params = $request->get_json_params();
        
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

    public function update_supplier($request) {
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
        
        $params = $request->get_json_params();
        
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

    public function delete_supplier($request) {
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
    
    /**
     * --- Payment Receipts Functions ---
     */
    public function get_payment_receipts() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_payment_receipts';
        
        // Kiểm tra bảng đã tồn tại chưa
        if($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return array();
        }
        
        $receipts = $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
        return $receipts;
    }

    public function get_payment_receipt($request) {
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

    public function create_payment_receipt($request) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_payment_receipts';
        
        $params = $request->get_json_params();
        
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
}
