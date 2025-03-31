
<?php
/**
 * API handler class
 * 
 * Manages REST API endpoints for the HMM Inventory plugin
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_API {
    /**
     * Constructor
     */
    public function __construct() {
        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Register API endpoints for each module
        $this->register_supplier_routes();
        $this->register_goods_receipt_routes();
        $this->register_returns_routes();
        $this->register_damaged_stock_routes();
        $this->register_settings_routes();
        $this->register_dashboard_routes();
    }
    
    /**
     * Register supplier routes
     */
    private function register_supplier_routes() {
        register_rest_route('hmm-inventory/v1', '/suppliers', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_suppliers'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/suppliers', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_supplier'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_supplier'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_supplier'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/suppliers/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_supplier'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Register goods receipt routes
     */
    private function register_goods_receipt_routes() {
        register_rest_route('hmm-inventory/v1', '/goods-receipts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_goods_receipts'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/goods-receipts', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_goods_receipt'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/goods-receipts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_goods_receipt'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/goods-receipts/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_goods_receipt'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Register returns routes
     */
    private function register_returns_routes() {
        register_rest_route('hmm-inventory/v1', '/returns', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_returns'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/returns', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_return'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/returns/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_return'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/returns/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_return'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Register damaged stock routes
     */
    private function register_damaged_stock_routes() {
        register_rest_route('hmm-inventory/v1', '/damaged-stock', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_damaged_stock'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/damaged-stock', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_damaged_stock'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/damaged-stock/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_damaged_stock_item'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/damaged-stock/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_damaged_stock_item'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Register settings routes
     */
    private function register_settings_routes() {
        register_rest_route('hmm-inventory/v1', '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/settings', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_settings'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Register dashboard routes
     */
    private function register_dashboard_routes() {
        register_rest_route('hmm-inventory/v1', '/dashboard/stats', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_dashboard_stats'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm-inventory/v1', '/dashboard/recent', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_recent_activities'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Check API permissions
     */
    public function check_permissions() {
        return current_user_can('manage_options');
    }
    
    /**
     * Get all suppliers
     */
    public function get_suppliers($request) {
        global $hmm_inventory_suppliers;
        
        if (!$hmm_inventory_suppliers) {
            return new WP_Error(
                'module_not_loaded',
                'Suppliers module not loaded',
                array('status' => 500)
            );
        }
        
        $args = array();
        
        // Pagination parameters
        $args['limit'] = isset($request['per_page']) ? intval($request['per_page']) : 50;
        $args['offset'] = isset($request['page']) ? (intval($request['page']) - 1) * $args['limit'] : 0;
        
        // Filter parameters
        if (isset($request['status'])) {
            $args['status'] = sanitize_text_field($request['status']);
        }
        
        if (isset($request['search'])) {
            $args['search'] = sanitize_text_field($request['search']);
        }
        
        // Sorting parameters
        if (isset($request['orderby'])) {
            $args['orderby'] = sanitize_text_field($request['orderby']);
        }
        
        if (isset($request['order'])) {
            $args['order'] = strtoupper(sanitize_text_field($request['order'])) === 'DESC' ? 'DESC' : 'ASC';
        }
        
        // Apply filter to allow modifying args
        $args = apply_filters('hmm_inventory_api_get_suppliers_args', $args, $request);
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_suppliers', $args);
        
        return $result;
    }
    
    /**
     * Create a new supplier
     */
    public function create_supplier($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No supplier data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_create_supplier', $params);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get a single supplier
     */
    public function get_supplier($request) {
        $id = $request['id'];
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_supplier', $id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a supplier
     */
    public function update_supplier($request) {
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No supplier data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_update_supplier', $params, $id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Delete a supplier
     */
    public function delete_supplier($request) {
        $id = $request['id'];
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_delete_supplier', $id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get all goods receipts
     */
    public function get_goods_receipts($request) {
        $args = array();
        
        // Pagination parameters
        $args['limit'] = isset($request['per_page']) ? intval($request['per_page']) : 50;
        $args['offset'] = isset($request['page']) ? (intval($request['page']) - 1) * $args['limit'] : 0;
        
        // Filter parameters
        if (isset($request['supplier_id'])) {
            $args['supplier_id'] = intval($request['supplier_id']);
        }
        
        if (isset($request['status'])) {
            $args['status'] = sanitize_text_field($request['status']);
        }
        
        if (isset($request['from_date'])) {
            $args['from_date'] = sanitize_text_field($request['from_date']);
        }
        
        if (isset($request['to_date'])) {
            $args['to_date'] = sanitize_text_field($request['to_date']);
        }
        
        // Sorting parameters
        if (isset($request['orderby'])) {
            $args['orderby'] = sanitize_text_field($request['orderby']);
        }
        
        if (isset($request['order'])) {
            $args['order'] = strtoupper(sanitize_text_field($request['order'])) === 'DESC' ? 'DESC' : 'ASC';
        }
        
        // Apply filter to allow modifying args
        $args = apply_filters('hmm_inventory_api_get_goods_receipts_args', $args, $request);
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_goods_receipts', $args);
        
        return $result;
    }
    
    /**
     * Create a new goods receipt
     */
    public function create_goods_receipt($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No goods receipt data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_create_goods_receipt', $params);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get a single goods receipt
     */
    public function get_goods_receipt($request) {
        $id = $request['id'];
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_goods_receipt', $id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a goods receipt
     */
    public function update_goods_receipt($request) {
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No goods receipt data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_update_goods_receipt', $params, $id);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get all returns
     */
    public function get_returns($request) {
        $args = array();
        
        // Pagination parameters
        $args['limit'] = isset($request['per_page']) ? intval($request['per_page']) : 50;
        $args['offset'] = isset($request['page']) ? (intval($request['page']) - 1) * $args['limit'] : 0;
        
        // Filter parameters
        if (isset($request['type'])) {
            $args['type'] = sanitize_text_field($request['type']);
        }
        
        if (isset($request['entity_id'])) {
            $args['entity_id'] = intval($request['entity_id']);
        }
        
        if (isset($request['status'])) {
            $args['status'] = sanitize_text_field($request['status']);
        }
        
        if (isset($request['from_date'])) {
            $args['from_date'] = sanitize_text_field($request['from_date']);
        }
        
        if (isset($request['to_date'])) {
            $args['to_date'] = sanitize_text_field($request['to_date']);
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_returns', $args);
        
        return $result;
    }
    
    /**
     * Create a new return
     */
    public function create_return($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No return data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_create_return', $params, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get a single return
     */
    public function get_return($request) {
        $id = $request['id'];
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_return', $id, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a return
     */
    public function update_return($request) {
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No return data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_update_return', $params, $id, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get all damaged stock
     */
    public function get_damaged_stock($request) {
        $args = array();
        
        // Pagination parameters
        $args['limit'] = isset($request['per_page']) ? intval($request['per_page']) : 50;
        $args['offset'] = isset($request['page']) ? (intval($request['page']) - 1) * $args['limit'] : 0;
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_damaged_stock', $args);
        
        return $result;
    }
    
    /**
     * Create a damaged stock record
     */
    public function create_damaged_stock($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No damaged stock data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_create_damaged_stock', $params, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get a single damaged stock item
     */
    public function get_damaged_stock_item($request) {
        $id = $request['id'];
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_get_damaged_stock_item', $id, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Update a damaged stock item
     */
    public function update_damaged_stock_item($request) {
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No damaged stock data provided',
                array('status' => 400)
            );
        }
        
        // Execute API call via filter
        $result = apply_filters('hmm_inventory_api_update_damaged_stock_item', $params, $id, $request);
        
        if (is_wp_error($result)) {
            return $result;
        }
        
        return rest_ensure_response($result);
    }
    
    /**
     * Get plugin settings
     */
    public function get_settings($request) {
        $settings = array(
            'company' => array(
                'name' => get_option('hmm_company_name', ''),
                'address' => get_option('hmm_company_address', ''),
                'phone' => get_option('hmm_company_phone', ''),
                'email' => get_option('hmm_company_email', ''),
                'tax_id' => get_option('hmm_company_tax_id', '')
            ),
            'inventory' => array(
                'auto_update_stock' => (bool) get_option('hmm_auto_update_stock', true),
                'low_stock_threshold' => (int) get_option('hmm_low_stock_threshold', 5),
                'default_supplier' => get_option('hmm_default_supplier', ''),
                'default_payment_status' => get_option('hmm_default_payment_status', 'pending')
            ),
            'notifications' => array(
                'enable_email' => (bool) get_option('hmm_enable_email_notifications', false),
                'email' => get_option('hmm_notification_email', ''),
                'notify_low_stock' => (bool) get_option('hmm_notify_low_stock', false),
                'notify_new_receipt' => (bool) get_option('hmm_notify_new_receipt', false)
            )
        );
        
        return rest_ensure_response($settings);
    }
    
    /**
     * Update plugin settings
     */
    public function update_settings($request) {
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error(
                'invalid_data',
                'No settings data provided',
                array('status' => 400)
            );
        }
        
        // Company settings
        if (!empty($params['company'])) {
            foreach ($params['company'] as $key => $value) {
                update_option('hmm_company_' . $key, sanitize_text_field($value));
            }
        }
        
        // Inventory settings
        if (!empty($params['inventory'])) {
            if (isset($params['inventory']['auto_update_stock'])) {
                update_option('hmm_auto_update_stock', (bool) $params['inventory']['auto_update_stock']);
            }
            
            if (isset($params['inventory']['low_stock_threshold'])) {
                update_option('hmm_low_stock_threshold', intval($params['inventory']['low_stock_threshold']));
            }
            
            if (isset($params['inventory']['default_supplier'])) {
                update_option('hmm_default_supplier', sanitize_text_field($params['inventory']['default_supplier']));
            }
            
            if (isset($params['inventory']['default_payment_status'])) {
                update_option('hmm_default_payment_status', sanitize_text_field($params['inventory']['default_payment_status']));
            }
        }
        
        // Notification settings
        if (!empty($params['notifications'])) {
            if (isset($params['notifications']['enable_email'])) {
                update_option('hmm_enable_email_notifications', (bool) $params['notifications']['enable_email']);
            }
            
            if (isset($params['notifications']['email'])) {
                update_option('hmm_notification_email', sanitize_email($params['notifications']['email']));
            }
            
            if (isset($params['notifications']['notify_low_stock'])) {
                update_option('hmm_notify_low_stock', (bool) $params['notifications']['notify_low_stock']);
            }
            
            if (isset($params['notifications']['notify_new_receipt'])) {
                update_option('hmm_notify_new_receipt', (bool) $params['notifications']['notify_new_receipt']);
            }
        }
        
        return $this->get_settings($request);
    }
    
    /**
     * Get dashboard statistics
     */
    public function get_dashboard_stats($request) {
        global $wpdb;
        
        // Define time period for recent stats
        $days = isset($request['days']) ? intval($request['days']) : 30;
        $recent_date = date('Y-m-d H:i:s', strtotime("-$days days"));
        
        // Get stats from database
        $stats = array(
            'suppliers' => array(
                'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_suppliers"),
                'active' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_suppliers WHERE status = 'active'"),
                'inactive' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_suppliers WHERE status = 'inactive'")
            ),
            'goods_receipts' => array(
                'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts"),
                'recent' => $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts WHERE created_at >= %s",
                    $recent_date
                )),
                'pending' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts WHERE status = 'pending'"),
                'total_amount' => $wpdb->get_var("SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_goods_receipts"),
                'recent_amount' => $wpdb->get_var($wpdb->prepare(
                    "SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_goods_receipts WHERE created_at >= %s",
                    $recent_date
                ))
            ),
            'returns' => array(
                'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns"),
                'recent' => $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns WHERE created_at >= %s",
                    $recent_date
                )),
                'supplier_returns' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns WHERE type = 'supplier'"),
                'customer_returns' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns WHERE type = 'customer'"),
                'total_amount' => $wpdb->get_var("SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_returns"),
                'recent_amount' => $wpdb->get_var($wpdb->prepare(
                    "SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_returns WHERE created_at >= %s",
                    $recent_date
                ))
            ),
            'damaged_stock' => array(
                'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock"),
                'recent' => $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock WHERE date >= %s",
                    $recent_date
                )),
                'processed' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock WHERE processed = 1"),
                'total_quantity' => $wpdb->get_var("SELECT SUM(quantity) FROM {$wpdb->prefix}hmm_damaged_stock")
            )
        );
        
        // Ensure values are numeric and defaulted to 0
        $stats = $this->ensure_numeric_values($stats);
        
        return rest_ensure_response($stats);
    }
    
    /**
     * Get recent activities for dashboard
     */
    public function get_recent_activities($request) {
        global $wpdb;
        
        $limit = isset($request['limit']) ? intval($request['limit']) : 10;
        
        // Get recent goods receipts
        $receipts = $wpdb->get_results($wpdb->prepare(
            "SELECT 'goods_receipt' as type, id, receipt_id as reference_id, supplier_name as entity_name, total_amount, created_at 
            FROM {$wpdb->prefix}hmm_goods_receipts 
            ORDER BY created_at DESC 
            LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Get recent returns
        $returns = $wpdb->get_results($wpdb->prepare(
            "SELECT 'return' as type, id, return_id as reference_id, entity_name, total_amount, created_at 
            FROM {$wpdb->prefix}hmm_returns 
            ORDER BY created_at DESC 
            LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Get recent damaged stock
        $damaged = $wpdb->get_results($wpdb->prepare(
            "SELECT 'damaged_stock' as type, id, id as reference_id, product_name as entity_name, 0 as total_amount, date as created_at 
            FROM {$wpdb->prefix}hmm_damaged_stock 
            ORDER BY date DESC 
            LIMIT %d",
            $limit
        ), ARRAY_A);
        
        // Combine and sort activities
        $activities = array_merge($receipts, $returns, $damaged);
        
        usort($activities, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        // Limit to requested number
        $activities = array_slice($activities, 0, $limit);
        
        return rest_ensure_response($activities);
    }
    
    /**
     * Ensure all numeric values in stats array are actually numeric and defaulted to 0
     */
    private function ensure_numeric_values($array) {
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $array[$key] = $this->ensure_numeric_values($value);
            } else if (is_numeric($value)) {
                $array[$key] = $value === null ? 0 : (float) $value;
            }
        }
        
        return $array;
    }
}

// Initialize the API class
$hmm_inventory_api = new HMM_Inventory_API();

