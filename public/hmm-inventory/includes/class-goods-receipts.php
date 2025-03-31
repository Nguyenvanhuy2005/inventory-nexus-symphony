
<?php
/**
 * Goods Receipts handler class
 * 
 * Manages goods receipt operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Goods_Receipts {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_goods_receipts', array($this, 'ajax_get_goods_receipts'));
        add_action('wp_ajax_hmm_get_goods_receipt', array($this, 'ajax_get_goods_receipt'));
        add_action('wp_ajax_hmm_create_goods_receipt', array($this, 'ajax_create_goods_receipt'));
        add_action('wp_ajax_hmm_update_goods_receipt', array($this, 'ajax_update_goods_receipt'));
        add_action('wp_ajax_hmm_cancel_goods_receipt', array($this, 'ajax_cancel_goods_receipt'));
        
        // Register API endpoints
        add_action('rest_api_init', array($this, 'register_api_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_api_routes() {
        register_rest_route('hmm/v1', '/goods-receipts', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_goods_receipts'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'api_get_goods_receipt'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_create_goods_receipt'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'api_update_goods_receipt'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
        
        register_rest_route('hmm/v1', '/goods-receipts/(?P<id>\d+)/cancel', array(
            'methods' => 'POST',
            'callback' => array($this, 'api_cancel_goods_receipt'),
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ));
    }
    
    /**
     * Generate a unique receipt ID
     */
    public function generate_receipt_id() {
        $prefix = 'PN';
        $date = date('ymd');
        $random = mt_rand(1000, 9999);
        
        return $prefix . $date . $random;
    }
    
    /**
     * Get all goods receipts with filtering and pagination
     */
    public function get_goods_receipts($args = array()) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_goods_receipts';
        $supplier_table = $wpdb->prefix . 'hmm_suppliers';
        
        $defaults = array(
            'search' => '',
            'status' => '',
            'payment_status' => '',
            'supplier_id' => 0,
            'date_from' => '',
            'date_to' => '',
            'page' => 1,
            'per_page' => 20,
            'orderby' => 'date',
            'order' => 'DESC'
        );
        
        $args = wp_parse_args($args, $defaults);
        $limit = intval($args['per_page']);
        $offset = ($args['page'] - 1) * $limit;
        
        // Build WHERE clause
        $where = array('1=1'); // Always true condition to start
        $prepare_args = array();
        
        if (!empty($args['search'])) {
            $where[] = "(gr.receipt_id LIKE %s OR s.name LIKE %s)";
            $search_term = '%' . $wpdb->esc_like($args['search']) . '%';
            $prepare_args[] = $search_term;
            $prepare_args[] = $search_term;
        }
        
        if (!empty($args['status'])) {
            $where[] = "gr.status = %s";
            $prepare_args[] = $args['status'];
        }
        
        if (!empty($args['payment_status'])) {
            $where[] = "gr.payment_status = %s";
            $prepare_args[] = $args['payment_status'];
        }
        
        if (!empty($args['supplier_id'])) {
            $where[] = "gr.supplier_id = %d";
            $prepare_args[] = $args['supplier_id'];
        }
        
        if (!empty($args['date_from'])) {
            $where[] = "DATE(gr.date) >= %s";
            $prepare_args[] = $args['date_from'];
        }
        
        if (!empty($args['date_to'])) {
            $where[] = "DATE(gr.date) <= %s";
            $prepare_args[] = $args['date_to'];
        }
        
        $where_clause = implode(' AND ', $where);
        
        // Build ORDER BY clause
        $orderby = sanitize_sql_orderby($args['orderby'] . ' ' . $args['order']);
        
        // Count total items
        $query = "
            SELECT COUNT(*) 
            FROM $table_name AS gr
            LEFT JOIN $supplier_table AS s ON gr.supplier_id = s.id
            WHERE $where_clause
        ";
        
        $wpdb->query('SET SQL_BIG_SELECTS=1');
        
        $prepared_query = $prepare_args ? $wpdb->prepare($query, $prepare_args) : $query;
        $total = $wpdb->get_var($prepared_query);
        
        // Get paginated data
        $query = "
            SELECT gr.*, s.name as supplier_name 
            FROM $table_name AS gr
            LEFT JOIN $supplier_table AS s ON gr.supplier_id = s.id
            WHERE $where_clause
            ORDER BY gr.$orderby
            LIMIT %d OFFSET %d
        ";
        
        $prepare_args[] = $limit;
        $prepare_args[] = $offset;
        
        $prepared_query = $wpdb->prepare($query, $prepare_args);
        $receipts = $wpdb->get_results($prepared_query, ARRAY_A);
        
        return array(
            'total' => intval($total),
            'page' => $args['page'],
            'per_page' => $args['per_page'],
            'total_pages' => ceil($total / $limit),
            'receipts' => $receipts
        );
    }
    
    /**
     * Get a specific goods receipt with its items
     */
    public function get_goods_receipt($id) {
        global $wpdb;
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        $supplier_table = $wpdb->prefix . 'hmm_suppliers';
        
        // Get the receipt
        $receipt = $wpdb->get_row(
            $wpdb->prepare("
                SELECT gr.*, s.name as supplier_name
                FROM $receipts_table gr
                LEFT JOIN $supplier_table s ON gr.supplier_id = s.id
                WHERE gr.id = %d
            ", $id),
            ARRAY_A
        );
        
        if (!$receipt) {
            return false;
        }
        
        // Get the items
        $items = $wpdb->get_results(
            $wpdb->prepare("
                SELECT * FROM $items_table
                WHERE receipt_id = %d
            ", $id),
            ARRAY_A
        );
        
        $receipt['items'] = $items;
        
        return $receipt;
    }
    
    /**
     * Create a new goods receipt
     */
    public function create_goods_receipt($data) {
        global $wpdb;
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        $stock_table = $wpdb->prefix . 'hmm_stock_transactions';
        $product_table = $wpdb->prefix . 'posts';
        
        // Start transaction
        $wpdb->query('START TRANSACTION');
        
        try {
            // Process main receipt data
            $receipt_id = $this->generate_receipt_id();
            $supplier_id = absint($data['supplier_id']);
            $date = sanitize_text_field($data['date']);
            $items = isset($data['items']) ? $data['items'] : array();
            $total_amount = 0;
            
            // Calculate total amount from items
            foreach ($items as $item) {
                $total_amount += floatval($item['quantity']) * floatval($item['unit_price']);
            }
            
            // Set payment data
            $payment_amount = isset($data['payment_amount']) ? floatval($data['payment_amount']) : 0;
            $payment_method = isset($data['payment_method']) ? sanitize_text_field($data['payment_method']) : 'cash';
            $payment_status = isset($data['payment_status']) ? sanitize_text_field($data['payment_status']) : 'pending';
            
            // If payment_amount is equal to or greater than total_amount, set payment_status to paid
            if ($payment_amount >= $total_amount) {
                $payment_status = 'paid';
            } elseif ($payment_amount > 0) {
                $payment_status = 'partial';
            } else {
                $payment_status = 'pending';
            }
            
            $status = isset($data['status']) ? sanitize_text_field($data['status']) : 'completed';
            $notes = isset($data['notes']) ? sanitize_textarea_field($data['notes']) : '';
            
            // Insert receipt
            $receipt_result = $wpdb->insert(
                $receipts_table,
                array(
                    'receipt_id' => $receipt_id,
                    'supplier_id' => $supplier_id,
                    'date' => $date,
                    'total_amount' => $total_amount,
                    'payment_amount' => $payment_amount,
                    'payment_method' => $payment_method,
                    'payment_status' => $payment_status,
                    'status' => $status,
                    'notes' => $notes,
                    'created_at' => current_time('mysql', true),
                    'updated_at' => current_time('mysql', true)
                )
            );
            
            if ($receipt_result === false) {
                throw new Exception("Failed to create goods receipt");
            }
            
            $receipt_db_id = $wpdb->insert_id;
            
            // Process receipt items
            foreach ($items as $item) {
                $product_id = absint($item['product_id']);
                $variation_id = isset($item['variation_id']) ? absint($item['variation_id']) : 0;
                $product_name = sanitize_text_field($item['product_name']);
                $sku = isset($item['sku']) ? sanitize_text_field($item['sku']) : '';
                $quantity = floatval($item['quantity']);
                $unit_price = floatval($item['unit_price']);
                $total_price = $quantity * $unit_price;
                
                // Insert receipt item
                $item_result = $wpdb->insert(
                    $items_table,
                    array(
                        'receipt_id' => $receipt_db_id,
                        'product_id' => $product_id,
                        'variation_id' => $variation_id,
                        'product_name' => $product_name,
                        'sku' => $sku,
                        'quantity' => $quantity,
                        'unit_price' => $unit_price,
                        'total_price' => $total_price
                    )
                );
                
                if ($item_result === false) {
                    throw new Exception("Failed to create goods receipt item");
                }
                
                // If receipt status is completed, update stock
                if ($status == 'completed') {
                    // Get current stock quantity
                    $meta_key = $variation_id > 0 ? '_stock' : '_stock';
                    $post_id = $variation_id > 0 ? $variation_id : $product_id;
                    
                    $current_stock = get_post_meta($post_id, $meta_key, true);
                    $current_stock = $current_stock !== '' ? floatval($current_stock) : 0;
                    
                    // Calculate new stock
                    $new_stock = $current_stock + $quantity;
                    
                    // Update stock in WooCommerce
                    update_post_meta($post_id, $meta_key, $new_stock);
                    
                    // Also update stock status if needed
                    if ($new_stock > 0) {
                        update_post_meta($post_id, '_stock_status', 'instock');
                    }
                    
                    // Record stock transaction
                    $transaction_id = 'TH' . date('ymd') . mt_rand(1000, 9999);
                    
                    $transaction_result = $wpdb->insert(
                        $stock_table,
                        array(
                            'transaction_id' => $transaction_id,
                            'product_id' => $product_id,
                            'variation_id' => $variation_id,
                            'product_name' => $product_name,
                            'quantity' => $quantity,
                            'previous_quantity' => $current_stock,
                            'current_quantity' => $new_stock,
                            'type' => 'goods_receipt',
                            'reference_id' => $receipt_id,
                            'reference_type' => 'goods_receipt',
                            'notes' => "Nhập hàng từ phiếu nhập: $receipt_id",
                            'created_by' => get_current_user_id(),
                            'created_at' => current_time('mysql', true)
                        )
                    );
                    
                    if ($transaction_result === false) {
                        throw new Exception("Failed to create stock transaction");
                    }
                }
            }
            
            // Update supplier debt if payment is not fully paid
            if ($payment_status != 'paid' && $supplier_id > 0) {
                $unpaid_amount = $total_amount - $payment_amount;
                $supplier_table = $wpdb->prefix . 'hmm_suppliers';
                
                $wpdb->query(
                    $wpdb->prepare(
                        "UPDATE $supplier_table 
                         SET current_debt = current_debt + %f,
                             total_debt = total_debt + %f,
                             updated_at = %s
                         WHERE id = %d",
                        $unpaid_amount,
                        $unpaid_amount,
                        current_time('mysql', true),
                        $supplier_id
                    )
                );
            }
            
            // Everything successful, commit transaction
            $wpdb->query('COMMIT');
            
            return array(
                'success' => true,
                'id' => $receipt_db_id,
                'receipt_id' => $receipt_id,
                'message' => 'Đã tạo phiếu nhập hàng thành công.'
            );
            
        } catch (Exception $e) {
            // Something went wrong, rollback
            $wpdb->query('ROLLBACK');
            
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
    
    /**
     * Cancel a goods receipt
     */
    public function cancel_goods_receipt($id) {
        global $wpdb;
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        $stock_table = $wpdb->prefix . 'hmm_stock_transactions';
        $supplier_table = $wpdb->prefix . 'hmm_suppliers';
        
        // Start transaction
        $wpdb->query('START TRANSACTION');
        
        try {
            // Get the receipt with items
            $receipt = $this->get_goods_receipt($id);
            
            if (!$receipt) {
                throw new Exception("Không tìm thấy phiếu nhập hàng");
            }
            
            // Check if receipt is already cancelled
            if ($receipt['status'] == 'cancelled') {
                throw new Exception("Phiếu nhập hàng đã bị hủy trước đó");
            }
            
            // Revert stock updates if receipt was completed
            if ($receipt['status'] == 'completed') {
                foreach ($receipt['items'] as $item) {
                    $product_id = absint($item['product_id']);
                    $variation_id = absint($item['variation_id']);
                    $quantity = floatval($item['quantity']);
                    
                    // Get current stock quantity
                    $meta_key = $variation_id > 0 ? '_stock' : '_stock';
                    $post_id = $variation_id > 0 ? $variation_id : $product_id;
                    
                    $current_stock = get_post_meta($post_id, $meta_key, true);
                    $current_stock = $current_stock !== '' ? floatval($current_stock) : 0;
                    
                    // Calculate new stock (subtract the quantity that was added)
                    $new_stock = $current_stock - $quantity;
                    if ($new_stock < 0) $new_stock = 0;
                    
                    // Update stock in WooCommerce
                    update_post_meta($post_id, $meta_key, $new_stock);
                    
                    // Update stock status if needed
                    if ($new_stock <= 0) {
                        update_post_meta($post_id, '_stock_status', 'outofstock');
                    }
                    
                    // Record cancellation transaction
                    $transaction_id = 'TH' . date('ymd') . mt_rand(1000, 9999);
                    
                    $transaction_result = $wpdb->insert(
                        $stock_table,
                        array(
                            'transaction_id' => $transaction_id,
                            'product_id' => $product_id,
                            'variation_id' => $variation_id,
                            'product_name' => $item['product_name'],
                            'quantity' => -$quantity,
                            'previous_quantity' => $current_stock,
                            'current_quantity' => $new_stock,
                            'type' => 'adjustment',
                            'reference_id' => $receipt['receipt_id'],
                            'reference_type' => 'goods_receipt_cancel',
                            'notes' => "Hủy phiếu nhập hàng: {$receipt['receipt_id']}",
                            'created_by' => get_current_user_id(),
                            'created_at' => current_time('mysql', true)
                        )
                    );
                    
                    if ($transaction_result === false) {
                        throw new Exception("Failed to create stock transaction for cancellation");
                    }
                }
            }
            
            // Revert supplier debt changes if there was unpaid amount
            if (($receipt['payment_status'] == 'pending' || $receipt['payment_status'] == 'partial') && $receipt['supplier_id'] > 0) {
                $unpaid_amount = $receipt['total_amount'] - $receipt['payment_amount'];
                
                $wpdb->query(
                    $wpdb->prepare(
                        "UPDATE $supplier_table 
                         SET current_debt = current_debt - %f,
                             total_debt = total_debt - %f,
                             updated_at = %s
                         WHERE id = %d",
                        $unpaid_amount,
                        $unpaid_amount,
                        current_time('mysql', true),
                        $receipt['supplier_id']
                    )
                );
            }
            
            // Update receipt status to cancelled
            $result = $wpdb->update(
                $receipts_table,
                array(
                    'status' => 'cancelled',
                    'updated_at' => current_time('mysql', true)
                ),
                array('id' => $id)
            );
            
            if ($result === false) {
                throw new Exception("Failed to update receipt status");
            }
            
            // Everything successful, commit transaction
            $wpdb->query('COMMIT');
            
            return array(
                'success' => true,
                'message' => 'Đã hủy phiếu nhập hàng thành công.'
            );
            
        } catch (Exception $e) {
            // Something went wrong, rollback
            $wpdb->query('ROLLBACK');
            
            return array(
                'success' => false,
                'message' => $e->getMessage()
            );
        }
    }
    
    /**
     * AJAX handler for getting goods receipts
     */
    public function ajax_get_goods_receipts() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $args = array(
            'search' => isset($_GET['search']) ? sanitize_text_field($_GET['search']) : '',
            'status' => isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '',
            'payment_status' => isset($_GET['payment_status']) ? sanitize_text_field($_GET['payment_status']) : '',
            'supplier_id' => isset($_GET['supplier_id']) ? absint($_GET['supplier_id']) : 0,
            'date_from' => isset($_GET['date_from']) ? sanitize_text_field($_GET['date_from']) : '',
            'date_to' => isset($_GET['date_to']) ? sanitize_text_field($_GET['date_to']) : '',
            'page' => isset($_GET['page']) ? absint($_GET['page']) : 1,
            'per_page' => isset($_GET['per_page']) ? absint($_GET['per_page']) : 20,
        );
        
        $result = $this->get_goods_receipts($args);
        wp_send_json($result);
    }
    
    /**
     * AJAX handler for getting a specific goods receipt
     */
    public function ajax_get_goods_receipt() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $id = isset($_GET['id']) ? absint($_GET['id']) : 0;
        
        if (!$id) {
            wp_send_json_error(array('message' => 'ID phiếu nhập không hợp lệ.'));
        }
        
        $receipt = $this->get_goods_receipt($id);
        
        if (!$receipt) {
            wp_send_json_error(array('message' => 'Không tìm thấy phiếu nhập hàng.'));
        }
        
        wp_send_json_success($receipt);
    }
    
    /**
     * AJAX handler for creating a goods receipt
     */
    public function ajax_create_goods_receipt() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        // Parse items JSON if needed
        $items = isset($_POST['items']) ? $_POST['items'] : array();
        if (is_string($items)) {
            $items = json_decode(stripslashes($items), true);
        }
        
        $data = $_POST;
        $data['items'] = $items;
        
        $result = $this->create_goods_receipt($data);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * AJAX handler for updating a goods receipt
     */
    public function ajax_update_goods_receipt() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        // Not implementing update functionality in this basic version
        // as it's complex to handle stock adjustments for modified items
        wp_send_json_error(array(
            'message' => 'Chức năng cập nhật phiếu nhập chưa được hỗ trợ. Vui lòng hủy phiếu cũ và tạo phiếu mới.'
        ));
    }
    
    /**
     * AJAX handler for canceling a goods receipt
     */
    public function ajax_cancel_goods_receipt() {
        check_ajax_referer('hmm_inventory_nonce', 'nonce');
        
        $id = isset($_POST['id']) ? absint($_POST['id']) : 0;
        
        if (!$id) {
            wp_send_json_error(array('message' => 'ID phiếu nhập không hợp lệ.'));
        }
        
        $result = $this->cancel_goods_receipt($id);
        
        if ($result['success']) {
            wp_send_json_success($result);
        } else {
            wp_send_json_error($result);
        }
    }
    
    /**
     * API handler for getting goods receipts
     */
    public function api_get_goods_receipts($request) {
        $args = array(
            'search' => $request->get_param('search'),
            'status' => $request->get_param('status'),
            'payment_status' => $request->get_param('payment_status'),
            'supplier_id' => $request->get_param('supplier_id'),
            'date_from' => $request->get_param('date_from'),
            'date_to' => $request->get_param('date_to'),
            'page' => $request->get_param('page'),
            'per_page' => $request->get_param('per_page'),
        );
        
        $result = $this->get_goods_receipts(array_filter($args));
        return rest_ensure_response($result);
    }
    
    /**
     * API handler for getting a specific goods receipt
     */
    public function api_get_goods_receipt($request) {
        $id = absint($request->get_param('id'));
        $receipt = $this->get_goods_receipt($id);
        
        if (!$receipt) {
            return new WP_Error('receipt_not_found', 'Không tìm thấy phiếu nhập hàng', array('status' => 404));
        }
        
        return rest_ensure_response($receipt);
    }
    
    /**
     * API handler for creating a goods receipt
     */
    public function api_create_goods_receipt($request) {
        $data = $request->get_params();
        $result = $this->create_goods_receipt($data);
        
        if ($result['success']) {
            return rest_ensure_response($result);
        } else {
            return new WP_Error('create_failed', $result['message'], array('status' => 500));
        }
    }
    
    /**
     * API handler for updating a goods receipt (not implemented)
     */
    public function api_update_goods_receipt($request) {
        return new WP_Error(
            'not_implemented',
            'Chức năng cập nhật phiếu nhập chưa được hỗ trợ. Vui lòng hủy phiếu cũ và tạo phiếu mới.',
            array('status' => 501)
        );
    }
    
    /**
     * API handler for canceling a goods receipt
     */
    public function api_cancel_goods_receipt($request) {
        $id = absint($request->get_param('id'));
        $result = $this->cancel_goods_receipt($id);
        
        if ($result['success']) {
            return rest_ensure_response($result);
        } else {
            return new WP_Error('cancel_failed', $result['message'], array('status' => 500));
        }
    }
}

// Initialize the class
$hmm_inventory_goods_receipts = new HMM_Inventory_Goods_Receipts();
