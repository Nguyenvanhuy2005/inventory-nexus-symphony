
<?php
/**
 * Damaged Stock handler class
 * 
 * Manages damaged stock operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Damaged_Stock {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_damaged_stock', array($this, 'ajax_get_damaged_stock'));
        add_action('wp_ajax_hmm_create_damaged_stock', array($this, 'ajax_create_damaged_stock'));
        
        // Register API handlers
        add_filter('hmm_inventory_api_get_damaged_stock', array($this, 'api_get_damaged_stock'));
        add_filter('hmm_inventory_api_create_damaged_stock', array($this, 'api_create_damaged_stock'), 10, 2);
        add_filter('hmm_inventory_api_get_damaged_stock_item', array($this, 'api_get_damaged_stock_item'), 10, 2);
    }
    
    /**
     * Get all damaged stock items
     */
    public function get_all() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_damaged_stock';
        
        return $wpdb->get_results("SELECT * FROM $table_name ORDER BY date DESC", ARRAY_A);
    }
    
    /**
     * Get a single damaged stock item
     */
    public function get_item($id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_damaged_stock';
        
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id), ARRAY_A);
    }
    
    /**
     * Create a new damaged stock record
     */
    public function create($data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_damaged_stock';
        
        // Validate required fields
        if (empty($data['product_id']) || empty($data['product_name']) || empty($data['quantity']) || empty($data['reason'])) {
            return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc');
        }
        
        $insert_data = array(
            'product_id' => $data['product_id'],
            'product_name' => $data['product_name'],
            'quantity' => $data['quantity'],
            'reason' => $data['reason'],
            'notes' => isset($data['notes']) ? $data['notes'] : '',
            'date' => isset($data['date']) ? $data['date'] : current_time('mysql')
        );
        
        $wpdb->insert($table_name, $insert_data);
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', $wpdb->last_error);
        }
        
        return $this->get_item($wpdb->insert_id);
    }
    
    /**
     * AJAX handler for getting damaged stock
     */
    public function ajax_get_damaged_stock() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $damaged_stock = $this->get_all();
        
        wp_send_json_success(array(
            'damaged_stock' => $damaged_stock
        ));
    }
    
    /**
     * AJAX handler for creating damaged stock
     */
    public function ajax_create_damaged_stock() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $data = $_POST;
        
        $result = $this->create($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array(
                'message' => $result->get_error_message()
            ));
        } else {
            wp_send_json_success(array(
                'damaged_stock' => $result
            ));
        }
    }
    
    /**
     * API handler for getting damaged stock
     */
    public function api_get_damaged_stock() {
        return $this->get_all();
    }
    
    /**
     * API handler for creating damaged stock
     */
    public function api_create_damaged_stock($request) {
        $data = $request->get_json_params();
        
        $result = $this->create($data);
        
        if (is_wp_error($result)) {
            return new WP_Error(
                $result->get_error_code(),
                $result->get_error_message(),
                array('status' => 400)
            );
        }
        
        return $result;
    }
    
    /**
     * API handler for getting a damaged stock item
     */
    public function api_get_damaged_stock_item($request) {
        $id = $request['id'];
        
        $item = $this->get_item($id);
        
        if (!$item) {
            return new WP_Error(
                'not_found',
                'Không tìm thấy mục hàng hỏng',
                array('status' => 404)
            );
        }
        
        return $item;
    }
}

// Initialize the class
$hmm_inventory_damaged_stock = new HMM_Inventory_Damaged_Stock();
