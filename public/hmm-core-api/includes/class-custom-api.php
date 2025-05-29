<?php
/**
 * HMM Custom API Class
 * 
 * Handles custom API endpoints and business logic
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
        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // API endpoint để lấy thống kê dashboard
        register_rest_route('hmm/v1', '/dashboard/stats', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_dashboard_stats'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // API endpoint để sync dữ liệu
        register_rest_route('hmm/v1', '/sync', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'sync_data'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    /**
     * Check permissions
     */
    public function check_permissions() {
        // Xử lý OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return true;
        }
        
        return current_user_can('edit_posts') || current_user_can('manage_options');
    }
    
    /**
     * Get dashboard statistics
     */
    public function get_dashboard_stats() {
        global $wpdb;
        
        try {
            $stats = array(
                'suppliers' => array(
                    'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_suppliers") ?: 0
                ),
                'goods_receipts' => array(
                    'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts") ?: 0
                ),
                'returns' => array(
                    'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns") ?: 0
                ),
                'damaged_stock' => array(
                    'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock") ?: 0
                )
            );
            
            return rest_ensure_response(array(
                'success' => true,
                'stats' => $stats
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Sync data with external systems
     */
    public function sync_data($request) {
        $params = $request->get_json_params();
        $sync_type = isset($params['type']) ? $params['type'] : 'all';
        
        // Placeholder for sync logic
        return rest_ensure_response(array(
            'success' => true,
            'message' => "Đồng bộ dữ liệu ({$sync_type}) thành công",
            'synced_at' => current_time('mysql')
        ));
    }
}
