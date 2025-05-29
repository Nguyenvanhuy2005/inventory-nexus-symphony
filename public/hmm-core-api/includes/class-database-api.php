
<?php
/**
 * HMM Database API Class
 * 
 * Handles database operations and REST API endpoints
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Database_API {
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
        // API endpoint để lấy danh sách bảng
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_tables'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // API endpoint để lấy cấu trúc bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_table_structure'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // API endpoint để thực hiện truy vấn
        register_rest_route('hmm/v1', '/query', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'execute_query'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // API endpoints cho CRUD operations
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/insert', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'insert_record'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/update/(?P<id>\d+)', array(
            'methods' => 'PUT,OPTIONS',
            'callback' => array($this, 'update_record'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/delete/(?P<id>\d+)', array(
            'methods' => 'DELETE,OPTIONS',
            'callback' => array($this, 'delete_record'),
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
        
        // Sử dụng permission check từ main class
        $main_plugin = $GLOBALS['hmm_core_api'] ?? null;
        if ($main_plugin && method_exists($main_plugin, 'api_permissions_check')) {
            return $main_plugin->api_permissions_check(null);
        }
        
        // Fallback permission check
        return current_user_can('edit_posts') || current_user_can('manage_options');
    }
    
    /**
     * Get all tables
     */
    public function get_tables() {
        global $wpdb;
        
        try {
            $tables = array();
            $tables_prefix = $wpdb->prefix . 'hmm_';
            $all_tables = $wpdb->get_results("SHOW TABLES LIKE '{$tables_prefix}%'", ARRAY_N);
            
            foreach ($all_tables as $table) {
                $table_name = $table[0];
                $count = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
                $tables[] = array(
                    'name' => $table_name,
                    'count' => (int) $count,
                    'status' => 'active'
                );
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'tables' => $tables
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Get table structure
     */
    public function get_table_structure($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        
        try {
            $structure = $wpdb->get_results("DESCRIBE {$table_name}", ARRAY_A);
            
            return rest_ensure_response(array(
                'success' => true,
                'table' => $table_name,
                'structure' => $structure
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Execute SQL query
     */
    public function execute_query($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        $query = isset($params['query']) ? $params['query'] : '';
        
        if (empty($query)) {
            return new WP_Error('invalid_query', 'Query không được để trống', array('status' => 400));
        }
        
        // Chỉ cho phép SELECT queries
        if (!preg_match('/^\s*SELECT\s+/i', $query)) {
            return new WP_Error('invalid_query', 'Chỉ cho phép thực hiện SELECT queries', array('status' => 400));
        }
        
        try {
            $results = $wpdb->get_results($query, ARRAY_A);
            
            return rest_ensure_response(array(
                'success' => true,
                'query' => $query,
                'results' => $results,
                'rows_affected' => $wpdb->num_rows
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Insert record
     */
    public function insert_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error('invalid_data', 'Dữ liệu không được để trống', array('status' => 400));
        }
        
        try {
            $result = $wpdb->insert($table_name, $params);
            
            if ($result === false) {
                return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'id' => $wpdb->insert_id,
                'message' => 'Dữ liệu đã được thêm thành công'
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Update record
     */
    public function update_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error('invalid_data', 'Dữ liệu không được để trống', array('status' => 400));
        }
        
        try {
            $result = $wpdb->update(
                $table_name,
                $params,
                array('id' => $id)
            );
            
            if ($result === false) {
                return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'rows_affected' => $result,
                'message' => 'Dữ liệu đã được cập nhật thành công'
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
    
    /**
     * Delete record
     */
    public function delete_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        
        try {
            $result = $wpdb->delete(
                $table_name,
                array('id' => $id),
                array('%d')
            );
            
            if ($result === false) {
                return new WP_Error('database_error', $wpdb->last_error, array('status' => 500));
            }
            
            return rest_ensure_response(array(
                'success' => true,
                'rows_affected' => $result,
                'message' => 'Dữ liệu đã được xóa thành công'
            ));
        } catch (Exception $e) {
            return new WP_Error('database_error', $e->getMessage(), array('status' => 500));
        }
    }
}
