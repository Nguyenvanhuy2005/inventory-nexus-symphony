
<?php
/**
 * API handler class
 * 
 * Manages REST API endpoints
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
    }
    
    /**
     * Check API permissions
     */
    public function check_permissions() {
        return current_user_can('manage_options');
    }
    
    /**
     * API endpoint implementations will be handled by specific module classes
     */
}
