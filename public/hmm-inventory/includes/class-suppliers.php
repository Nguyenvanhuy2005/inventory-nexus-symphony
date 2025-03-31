
<?php
/**
 * Suppliers handler class
 * 
 * Manages supplier operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Suppliers {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_suppliers', array($this, 'ajax_get_suppliers'));
        add_action('wp_ajax_hmm_create_supplier', array($this, 'ajax_create_supplier'));
        add_action('wp_ajax_hmm_update_supplier', array($this, 'ajax_update_supplier'));
        add_action('wp_ajax_hmm_delete_supplier', array($this, 'ajax_delete_supplier'));
        
        // Register API endpoints
        add_action('rest_api_init', array($this, 'register_api_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_api_routes() {
        register_rest_route('hmm/v1', '/suppliers', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_suppliers'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_supplier'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/suppliers', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_create_supplier'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'api_update_supplier'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'api_delete_supplier'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
    }
    
    /**
     * Get all suppliers with pagination and search
     */
    public function get_suppliers($search = '', $page = 1, $per_page = 20) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        $limit = intval($per_page);
        $offset = ($page - 1) * $limit;
        
        $where = '';
        if (!empty($search)) {
            $search = '%' . $wpdb->esc_like($search) . '%';
            $where = $wpdb->prepare(
                "WHERE name LIKE %s OR contact_name LIKE %s OR phone LIKE %s OR email LIKE %s", 
                $search, $search, $search, $search
            );
        }
        
        $total_query = "SELECT COUNT(*) FROM $table_name $where";
        $total = $wpdb->get_var($total_query);
        
        $query = "SELECT * FROM $table_name $where ORDER BY name ASC LIMIT %d OFFSET %d";
        $suppliers = $wpdb->get_results(
            $wpdb->prepare($query, $limit, $offset)
        );
        
        return array(
            'suppliers' => $suppliers,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page)
        );
    }
    
    /**
     * Get a specific supplier by ID
     */
    public function get_supplier($id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id)
        );
    }
    
    /**
     * Create a new supplier
     */
    public function create_supplier($data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'name' => sanitize_text_field($data['name']),
                'contact_name' => isset($data['contact_name']) ? sanitize_text_field($data['contact_name']) : '',
                'phone' => isset($data['phone']) ? sanitize_text_field($data['phone']) : '',
                'email' => isset($data['email']) ? sanitize_email($data['email']) : '',
                'address' => isset($data['address']) ? sanitize_text_field($data['address']) : '',
                'notes' => isset($data['notes']) ? sanitize_textarea_field($data['notes']) : '',
                'initial_debt' => isset($data['initial_debt']) ? floatval($data['initial_debt']) : 0,
                'current_debt' => isset($data['initial_debt']) ? floatval($data['initial_debt']) : 0,
                'total_debt' => isset($data['initial_debt']) ? floatval($data['initial_debt']) : 0,
                'status' => isset($data['status']) ? sanitize_text_field($data['status']) : 'active',
                'created_at' => current_time('mysql', true),
                'updated_at' => current_time('mysql', true)
            )
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    /**
     * Update a supplier
     */
    public function update_supplier($id, $data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        // Get current supplier data to calculate debt adjustments
        $current_supplier = $this->get_supplier($id);
        if (!$current_supplier) {
            return false;
        }
        
        $update_data = array(
            'name' => isset($data['name']) ? sanitize_text_field($data['name']) : $current_supplier->name,
            'contact_name' => isset($data['contact_name']) ? sanitize_text_field($data['contact_name']) : $current_supplier->contact_name,
            'phone' => isset($data['phone']) ? sanitize_text_field($data['phone']) : $current_supplier->phone,
            'email' => isset($data['email']) ? sanitize_email($data['email']) : $current_supplier->email,
            'address' => isset($data['address']) ? sanitize_text_field($data['address']) : $current_supplier->address,
            'notes' => isset($data['notes']) ? sanitize_textarea_field($data['notes']) : $current_supplier->notes,
            'status' => isset($data['status']) ? sanitize_text_field($data['status']) : $current_supplier->status,
            'updated_at' => current_time('mysql', true)
        );
        
        // Handle debt adjustments if initial debt has changed
        if (isset($data['initial_debt'])) {
            $initial_debt = floatval($data['initial_debt']);
            $old_initial_debt = floatval($current_supplier->initial_debt);
            $debt_difference = $initial_debt - $old_initial_debt;
            
            // Update initial debt
            $update_data['initial_debt'] = $initial_debt;
            
            // Adjust current debt and total debt
            $update_data['current_debt'] = floatval($current_supplier->current_debt) + $debt_difference;
            $update_data['total_debt'] = floatval($current_supplier->total_debt) + $debt_difference;
        }
        
        $result = $wpdb->update(
            $table_name,
            $update_data,
            array('id' => $id)
        );
        
        return $result !== false;
    }
    
    /**
     * Delete a supplier
     */
    public function delete_supplier($id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_suppliers';
        
        // Check if supplier has any related records in goods receipts
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $has_receipts = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM $receipts_table WHERE supplier_id = %d", $id)
        );
        
        if ($has_receipts > 0) {
            return array(
                'success' => false,
                'message' => 'Không thể xóa nhà cung cấp này vì đã có phiếu nhập hàng liên quan.'
            );
        }
        
        // Delete supplier if no related records
        $result = $wpdb->delete(
            $table_name,
            array('id' => $id)
        );
        
        if ($result) {
            return array(
                'success' => true,
                'message' => 'Đã xóa nhà cung cấp thành công.'
            );
        }
        
        return array(
            'success' => false,
            'message' => 'Không thể xóa nhà cung cấp.'
        );
    }
    
    /**
     * AJAX handler for getting suppliers
     */
    public function ajax_get_suppliers() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $search = isset($_GET['search']) ? sanitize_text_field($_GET['search']) : '';
        $page = isset($_GET['page']) ? absint($_GET['page']) : 1;
        $per_page = isset($_GET['per_page']) ? absint($_GET['per_page']) : 20;
        
        $result = $this->get_suppliers($search, $page, $per_page);
        wp_send_json($result);
    }
    
    /**
     * AJAX handler for creating a supplier
     */
    public function ajax_create_supplier() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $data = $_POST;
        $supplier_id = $this->create_supplier($data);
        
        if ($supplier_id) {
            wp_send_json_success(array(
                'id' => $supplier_id,
                'message' => 'Đã tạo nhà cung cấp thành công.'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Không thể tạo nhà cung cấp.'
            ));
        }
    }
    
    /**
     * AJAX handler for updating a supplier
     */
    public function ajax_update_supplier() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
        $data = $_POST;
        
        if (!$id) {
            wp_send_json_error(array(
                'message' => 'ID nhà cung cấp không hợp lệ.'
            ));
        }
        
        $result = $this->update_supplier($id, $data);
        
        if ($result) {
            wp_send_json_success(array(
                'message' => 'Đã cập nhật nhà cung cấp thành công.'
            ));
        } else {
            wp_send_json_error(array(
                'message' => 'Không thể cập nhật nhà cung cấp.'
            ));
        }
    }
    
    /**
     * AJAX handler for deleting a supplier
     */
    public function ajax_delete_supplier() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
        
        if (!$id) {
            wp_send_json_error(array(
                'message' => 'ID nhà cung cấp không hợp lệ.'
            ));
        }
        
        $result = $this->delete_supplier($id);
        
        if ($result['success']) {
            wp_send_json_success(array(
                'message' => $result['message']
            ));
        } else {
            wp_send_json_error(array(
                'message' => $result['message']
            ));
        }
    }
    
    /**
     * API handler for getting all suppliers
     */
    public function api_get_suppliers($request) {
        $search = $request->get_param('search') ? sanitize_text_field($request->get_param('search')) : '';
        $page = $request->get_param('page') ? absint($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? absint($request->get_param('per_page')) : 20;
        
        $result = $this->get_suppliers($search, $page, $per_page);
        return rest_ensure_response($result);
    }
    
    /**
     * API handler for getting a specific supplier
     */
    public function api_get_supplier($request) {
        $id = absint($request->get_param('id'));
        $supplier = $this->get_supplier($id);
        
        if (!$supplier) {
            return new WP_Error('supplier_not_found', 'Không tìm thấy nhà cung cấp', array('status' => 404));
        }
        
        return rest_ensure_response($supplier);
    }
    
    /**
     * API handler for creating a supplier
     */
    public function api_create_supplier($request) {
        $data = $request->get_params();
        $supplier_id = $this->create_supplier($data);
        
        if ($supplier_id) {
            return rest_ensure_response(array(
                'success' => true,
                'id' => $supplier_id,
                'message' => 'Đã tạo nhà cung cấp thành công.'
            ));
        } else {
            return new WP_Error('create_failed', 'Không thể tạo nhà cung cấp', array('status' => 500));
        }
    }
    
    /**
     * API handler for updating a supplier
     */
    public function api_update_supplier($request) {
        $id = absint($request->get_param('id'));
        $data = $request->get_params();
        
        $result = $this->update_supplier($id, $data);
        
        if ($result) {
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Đã cập nhật nhà cung cấp thành công.'
            ));
        } else {
            return new WP_Error('update_failed', 'Không thể cập nhật nhà cung cấp', array('status' => 500));
        }
    }
    
    /**
     * API handler for deleting a supplier
     */
    public function api_delete_supplier($request) {
        $id = absint($request->get_param('id'));
        $result = $this->delete_supplier($id);
        
        if ($result['success']) {
            return rest_ensure_response(array(
                'success' => true,
                'message' => $result['message']
            ));
        } else {
            return new WP_Error('delete_failed', $result['message'], array('status' => 400));
        }
    }
}

// Initialize the class
$hmm_inventory_suppliers = new HMM_Inventory_Suppliers();
