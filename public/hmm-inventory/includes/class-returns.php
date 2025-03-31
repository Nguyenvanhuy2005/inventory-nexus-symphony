
<?php
/**
 * Returns handler class
 * 
 * Manages returns operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Returns {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_returns', array($this, 'ajax_get_returns'));
        add_action('wp_ajax_hmm_create_return', array($this, 'ajax_create_return'));
        add_action('wp_ajax_hmm_update_return', array($this, 'ajax_update_return'));
        
        // Register API handlers for REST API
        add_filter('hmm_inventory_api_get_returns', array($this, 'api_get_returns'));
        add_filter('hmm_inventory_api_create_return', array($this, 'api_create_return'), 10, 2);
        add_filter('hmm_inventory_api_get_return', array($this, 'api_get_return'), 10, 2);
    }
    
    /**
     * Get all returns
     */
    public function get_all($args = array()) {
        global $wpdb;
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $items_table = $wpdb->prefix . 'hmm_return_items';
        
        // Default query arguments
        $defaults = array(
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'date',
            'order' => 'DESC',
            'type' => '', // 'customer' or 'supplier'
            'entity_id' => 0,
            'status' => ''
        );
        
        $args = wp_parse_args($args, $defaults);
        $where = "WHERE 1=1";
        
        if (!empty($args['type'])) {
            $where .= $wpdb->prepare(" AND type = %s", $args['type']);
        }
        
        if (!empty($args['entity_id'])) {
            $where .= $wpdb->prepare(" AND entity_id = %d", $args['entity_id']);
        }
        
        if (!empty($args['status'])) {
            $where .= $wpdb->prepare(" AND status = %s", $args['status']);
        }
        
        // Get total count
        $total_query = "SELECT COUNT(*) FROM $returns_table $where";
        $total = $wpdb->get_var($total_query);
        
        // Get returns
        $query = "SELECT * FROM $returns_table $where ORDER BY {$args['orderby']} {$args['order']} LIMIT %d OFFSET %d";
        $query = $wpdb->prepare($query, $args['limit'], $args['offset']);
        $returns = $wpdb->get_results($query, ARRAY_A);
        
        // Get items for each return
        foreach ($returns as &$return) {
            $items_query = $wpdb->prepare("SELECT * FROM $items_table WHERE return_id = %d", $return['id']);
            $return['items'] = $wpdb->get_results($items_query, ARRAY_A);
        }
        
        return array(
            'returns' => $returns,
            'total' => $total
        );
    }
    
    /**
     * Get a single return
     */
    public function get_return($id) {
        global $wpdb;
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $items_table = $wpdb->prefix . 'hmm_return_items';
        
        // Get return
        $query = $wpdb->prepare("SELECT * FROM $returns_table WHERE id = %d", $id);
        $return = $wpdb->get_row($query, ARRAY_A);
        
        if (!$return) {
            return null;
        }
        
        // Get return items
        $items_query = $wpdb->prepare("SELECT * FROM $items_table WHERE return_id = %d", $id);
        $return['items'] = $wpdb->get_results($items_query, ARRAY_A);
        
        return $return;
    }
    
    /**
     * Create a new return
     */
    public function create_return($data) {
        global $wpdb;
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $items_table = $wpdb->prefix . 'hmm_return_items';
        
        // Validate required fields
        if (empty($data['type']) || empty($data['entity_id']) || empty($data['entity_name']) || empty($data['items'])) {
            return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc');
        }
        
        // Start transaction
        $wpdb->query('START TRANSACTION');
        
        try {
            // Generate return ID
            $prefix = ($data['type'] == 'supplier') ? 'RTS' : 'RTN';
            $return_id = $prefix . '-' . date('Ymd') . '-' . rand(1000, 9999);
            
            // Prepare return data
            $return_data = array(
                'return_id' => $return_id,
                'type' => $data['type'],
                'entity_id' => $data['entity_id'],
                'entity_name' => $data['entity_name'],
                'date' => !empty($data['date']) ? $data['date'] : current_time('mysql'),
                'reason' => !empty($data['reason']) ? $data['reason'] : '',
                'total_amount' => !empty($data['total_amount']) ? $data['total_amount'] : 0,
                'refund_amount' => !empty($data['refund_amount']) ? $data['refund_amount'] : 0,
                'payment_status' => !empty($data['payment_status']) ? $data['payment_status'] : 'not_refunded',
                'status' => !empty($data['status']) ? $data['status'] : 'pending',
                'notes' => !empty($data['notes']) ? $data['notes'] : '',
                'affects_stock' => isset($data['affects_stock']) ? $data['affects_stock'] : 1,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            );
            
            // Insert return
            $wpdb->insert($returns_table, $return_data);
            
            if ($wpdb->last_error) {
                throw new Exception($wpdb->last_error);
            }
            
            $return_id_db = $wpdb->insert_id;
            
            // Insert return items
            foreach ($data['items'] as $item) {
                $item_data = array(
                    'return_id' => $return_id_db,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                    'reason' => !empty($item['reason']) ? $item['reason'] : '',
                    'created_at' => current_time('mysql')
                );
                
                if (!empty($item['variation_id'])) {
                    $item_data['variation_id'] = $item['variation_id'];
                }
                
                $wpdb->insert($items_table, $item_data);
                
                if ($wpdb->last_error) {
                    throw new Exception($wpdb->last_error);
                }
                
                // Update stock if affects_stock is enabled
                if ($return_data['affects_stock']) {
                    $this->update_stock($item, $data['type']);
                }
            }
            
            // Commit transaction
            $wpdb->query('COMMIT');
            
            // Get the complete return with items
            return $this->get_return($return_id_db);
            
        } catch (Exception $e) {
            // Rollback transaction on error
            $wpdb->query('ROLLBACK');
            return new WP_Error('db_error', $e->getMessage());
        }
    }
    
    /**
     * Update a return
     */
    public function update_return($id, $data) {
        global $wpdb;
        $returns_table = $wpdb->prefix . 'hmm_returns';
        
        // Get current return data
        $current = $this->get_return($id);
        
        if (!$current) {
            return new WP_Error('not_found', 'Không tìm thấy phiếu trả hàng');
        }
        
        // Prepare update data
        $update_data = array(
            'updated_at' => current_time('mysql')
        );
        
        // Only update fields that are provided
        if (isset($data['reason'])) {
            $update_data['reason'] = $data['reason'];
        }
        
        if (isset($data['notes'])) {
            $update_data['notes'] = $data['notes'];
        }
        
        if (isset($data['status'])) {
            $update_data['status'] = $data['status'];
        }
        
        if (isset($data['refund_amount'])) {
            $update_data['refund_amount'] = $data['refund_amount'];
        }
        
        if (isset($data['payment_status'])) {
            $update_data['payment_status'] = $data['payment_status'];
        }
        
        // Update return
        $result = $wpdb->update($returns_table, $update_data, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('db_error', $wpdb->last_error);
        }
        
        // Get the updated return
        return $this->get_return($id);
    }
    
    /**
     * Update product stock based on return
     */
    private function update_stock($item, $type) {
        if (!function_exists('wc_update_product_stock')) {
            return false;
        }
        
        $product_id = !empty($item['variation_id']) ? $item['variation_id'] : $item['product_id'];
        
        // For supplier returns, decrease stock
        // For customer returns, increase stock
        $quantity = ($type == 'supplier') ? -$item['quantity'] : $item['quantity'];
        
        // Update WooCommerce stock
        return wc_update_product_stock($product_id, $quantity, 'increase');
    }
    
    /**
     * AJAX handler for getting returns
     */
    public function ajax_get_returns() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $args = array();
        
        // Get filter parameters
        if (!empty($_GET['type'])) {
            $args['type'] = sanitize_text_field($_GET['type']);
        }
        
        if (!empty($_GET['entity_id'])) {
            $args['entity_id'] = intval($_GET['entity_id']);
        }
        
        if (!empty($_GET['status'])) {
            $args['status'] = sanitize_text_field($_GET['status']);
        }
        
        // Pagination
        if (!empty($_GET['limit'])) {
            $args['limit'] = intval($_GET['limit']);
        }
        
        if (!empty($_GET['page'])) {
            $page = max(1, intval($_GET['page']));
            $args['offset'] = ($page - 1) * $args['limit'];
        }
        
        $result = $this->get_all($args);
        
        wp_send_json_success($result);
    }
    
    /**
     * AJAX handler for creating returns
     */
    public function ajax_create_return() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            wp_send_json_error(array('message' => 'Không có dữ liệu được gửi'));
            return;
        }
        
        $result = $this->create_return($data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array(
                'message' => $result->get_error_message()
            ));
        } else {
            wp_send_json_success(array(
                'message' => 'Đã tạo phiếu trả hàng thành công',
                'return' => $result
            ));
        }
    }
    
    /**
     * AJAX handler for updating returns
     */
    public function ajax_update_return() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$id || !$data) {
            wp_send_json_error(array('message' => 'Thiếu thông tin phiếu trả hàng'));
            return;
        }
        
        $result = $this->update_return($id, $data);
        
        if (is_wp_error($result)) {
            wp_send_json_error(array(
                'message' => $result->get_error_message()
            ));
        } else {
            wp_send_json_success(array(
                'message' => 'Đã cập nhật phiếu trả hàng thành công',
                'return' => $result
            ));
        }
    }
    
    /**
     * API handler for getting returns
     */
    public function api_get_returns() {
        return $this->get_all();
    }
    
    /**
     * API handler for creating a return
     */
    public function api_create_return($request) {
        $data = $request->get_json_params();
        
        $result = $this->create_return($data);
        
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
     * API handler for getting a return
     */
    public function api_get_return($request) {
        $id = $request['id'];
        
        $return = $this->get_return($id);
        
        if (!$return) {
            return new WP_Error(
                'not_found',
                'Không tìm thấy phiếu trả hàng',
                array('status' => 404)
            );
        }
        
        return $return;
    }
}

// Initialize the class
$hmm_inventory_returns = new HMM_Inventory_Returns();

