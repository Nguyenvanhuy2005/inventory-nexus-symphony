<?php
/**
 * Plugin Name: HMM Database API
 * Description: API để kết nối cơ sở dữ liệu WordPress với ứng dụng HMM Inventory
 * Version: 1.0.4
 * Author: HMM
 */

// Ngăn chặn truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class HMM_Database_API {
    /**
     * Constructor
     */
    public function __construct() {
        // Khởi tạo REST API
        add_action('rest_api_init', array($this, 'register_api_routes'));
        
        // Tạo bảng khi kích hoạt plugin
        register_activation_hook(__FILE__, array($this, 'create_custom_tables'));
        
        // Cải thiện CORS cho tất cả REST API requests
        add_action('rest_api_init', function() {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
            add_filter('rest_pre_serve_request', function($value) {
                if (isset($_SERVER['HTTP_ORIGIN'])) {
                    // Cho phép tất cả các origins
                    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
                } else {
                    header('Access-Control-Allow-Origin: *');
                }
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Origin, X-Requested-With');
                header('Access-Control-Expose-Headers: Link, X-WP-Total, X-WP-TotalPages', false);
                
                // Xử lý pre-flight requests
                if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                    status_header(200);
                    exit;
                }
                
                return $value;
            }, 15);
        });
        
        // Thêm route cho OPTIONS để xử lý pre-flight requests
        add_filter('rest_endpoints', function($endpoints) {
            foreach ($endpoints as $route => $endpoint) {
                if (isset($endpoint['methods']) && !isset($endpoint['methods']['OPTIONS'])) {
                    $endpoints[$route]['methods']['OPTIONS'] = true;
                }
            }
            return $endpoints;
        });
        
        // Hook trước khi gửi response để thêm debug headers nếu cần
        add_filter('rest_pre_serve_request', array($this, 'add_debug_headers'), 10, 4);
        
        // Cải thiện authentication cho REST API
        add_filter('determine_current_user', array($this, 'determine_current_user_from_token'), 20);
    }
    
    /**
     * Đăng ký các API endpoints
     */
    public function register_api_routes() {
        // API endpoint để kiểm tra trạng thái
        register_rest_route('hmm/v1', '/status', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy thông tin tất cả bảng
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_all_tables'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy cấu trúc bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_table_structure'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy dữ liệu từ bảng
        register_rest_route('hmm/v1', '/query', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'execute_query'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để tạo bảng mới
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'create_table'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));

        // API endpoint để thêm dữ liệu mới vào bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/insert', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'insert_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));

        // API endpoint để cập nhật dữ liệu trong bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/update/(?P<id>\d+)', array(
            'methods' => 'PUT,OPTIONS',
            'callback' => array($this, 'update_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));

        // API endpoint để xóa dữ liệu từ bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/delete/(?P<id>\d+)', array(
            'methods' => 'DELETE,OPTIONS',
            'callback' => array($this, 'delete_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
    }
    
    /**
     * Thêm debug headers vào REST API response nếu cần
     */
    public function add_debug_headers($served, $result, $request, $server) {
        // Thêm các header để debug
        header('X-HMM-Database-API: v1.0.4');
        
        // Thêm thông tin về người dùng hiện tại
        $current_user_id = get_current_user_id();
        if ($current_user_id) {
            header('X-HMM-User-ID: ' . $current_user_id);
        } else {
            header('X-HMM-User-ID: None');
        }
        
        return $served;
    }
    
    /**
     * Kiểm tra quyền truy cập API
     * Đã sửa để hỗ trợ cả Application Passwords và quyền quản trị
     */
    public function api_permissions_check($request) {
        // Cải thiện xử lý CORS cho OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return true;
        }
        
        // Nếu người dùng đã đăng nhập, kiểm tra quyền
        if (is_user_logged_in()) {
            $user_id = get_current_user_id();
            $user = get_userdata($user_id);
            
            // Log user info for debugging
            error_log("User ID: $user_id, User roles: " . implode(', ', $user->roles));
            
            // Cho phép bất kỳ ai có quyền edit_posts hoặc manage_options
            if (user_can($user_id, 'edit_posts') || user_can($user_id, 'manage_options')) {
                return true;
            }
        }
        
        // Kiểm tra xác thực bằng Application Password
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        
        if (!$auth_header) {
            return new WP_Error('rest_forbidden', 'Không có thông tin xác thực.', array('status' => 401));
        }

        // Lấy thông tin xác thực từ header
        if (preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
            $auth_data = base64_decode($matches[1]);
            list($username, $password) = explode(':', $auth_data, 2);
            
            // Log auth info for debugging (mask password for security)
            error_log("Auth attempt: Username: $username, Password length: " . strlen($password));
            
            // Lấy user từ tên người dùng
            $user = get_user_by('login', $username);
            
            if (!$user) {
                return new WP_Error('rest_forbidden', 'Người dùng không tồn tại.', array('status' => 401));
            }
            
            // Kiểm tra mật khẩu thông thường
            if (wp_check_password($password, $user->user_pass, $user->ID)) {
                // Grant access even if the user doesn't have manage_options
                // but has edit_posts capability
                return user_can($user, 'edit_posts') || user_can($user, 'manage_options');
            } else {
                // Kiểm tra Application Password
                require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
                if (class_exists('WP_Application_Passwords')) {
                    $app_password = WP_Application_Passwords::check_application_password($user, $password);
                    if ($app_password && !is_wp_error($app_password)) {
                        // Grant access even if the user doesn't have manage_options
                        // but has edit_posts capability
                        return user_can($user, 'edit_posts') || user_can($user, 'manage_options');
                    }
                }
            }
        }
        
        return new WP_Error('rest_forbidden', 'Xác thực không thành công.', array('status' => 401));
    }
    
    /**
     * Xác định người dùng hiện tại từ token xác thực
     */
    public function determine_current_user_from_token($user_id) {
        if ($user_id) {
            return $user_id;
        }
        
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        
        if (!$auth_header) {
            return $user_id;
        }
        
        // Lấy thông tin xác thực từ header
        if (preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
            $auth_data = base64_decode($matches[1]);
            list($username, $password) = explode(':', $auth_data, 2);
            
            // Lấy user từ tên người dùng
            $user = get_user_by('login', $username);
            
            if (!$user) {
                return $user_id;
            }
            
            // Kiểm tra mật khẩu thông thường
            if (wp_check_password($password, $user->user_pass, $user->ID)) {
                return $user->ID;
            } else {
                // Kiểm tra Application Password
                require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
                if (class_exists('WP_Application_Passwords')) {
                    $app_password = WP_Application_Passwords::check_application_password($user, $password);
                    if ($app_password && !is_wp_error($app_password)) {
                        return $user->ID;
                    }
                }
            }
        }
        
        return $user_id;
    }
    
    /**
     * Trả về trạng thái API
     */
    public function get_status() {
        global $wpdb;
        
        $tables = $this->get_custom_tables();
        
        // Add request info for debugging
        $request_info = array(
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Unknown',
            'origin' => isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'Unknown',
            'remote_addr' => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'Unknown',
            'authenticated' => is_user_logged_in() ? 'Yes' : 'No',
            'user_id' => get_current_user_id(),
        );
        
        // Kiểm tra quyền REST API
        $current_user_id = get_current_user_id();
        $user_roles = array();
        $user_capabilities = array();
        
        if ($current_user_id) {
            $user = get_userdata($current_user_id);
            if ($user) {
                $user_roles = $user->roles;
                foreach ($user->allcaps as $cap => $allowed) {
                    if ($allowed) {
                        $user_capabilities[] = $cap;
                    }
                }
            }
        }
        
        return array(
            'status' => 'active',
            'version' => '1.0.4',
            'wordpress_version' => get_bloginfo('version'),
            'database_prefix' => $wpdb->prefix,
            'custom_tables' => $tables,
            'write_support' => true,
            'cors_support' => true,
            'timestamp' => current_time('mysql'),
            'user' => array(
                'id' => $current_user_id,
                'roles' => $user_roles,
                'has_edit_posts' => user_can($current_user_id, 'edit_posts'),
                'has_manage_options' => user_can($current_user_id, 'manage_options'),
                'capabilities' => array_slice($user_capabilities, 0, 10) // Limit to first 10 capabilities
            ),
            'request' => $request_info
        );
    }
    
    /**
     * Tạo các bảng tùy chỉnh khi kích hoạt plugin
     */
    public function create_custom_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Bảng lưu trữ tồn kho
        $table_stock_levels = $wpdb->prefix . 'hmm_stock_levels';
        $sql = "CREATE TABLE IF NOT EXISTS $table_stock_levels (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            ton_thuc_te int(11) DEFAULT 0,
            co_the_ban int(11) DEFAULT 0,
            last_updated datetime DEFAULT CURRENT_TIMESTAMP,
            notes text,
            PRIMARY KEY  (id),
            UNIQUE KEY product_id (product_id)
        ) $charset_collate;";
        
        // Bảng ghi nhận giao dịch tồn kho
        $table_stock_transactions = $wpdb->prefix . 'hmm_stock_transactions';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_stock_transactions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            transaction_id varchar(32) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            variation_id bigint(20) DEFAULT NULL,
            quantity int(11) NOT NULL,
            previous_quantity int(11) NOT NULL,
            current_quantity int(11) NOT NULL,
            type varchar(50) NOT NULL,
            transaction_type varchar(50) NOT NULL,
            reference_id varchar(50) DEFAULT NULL,
            reference_type varchar(50) DEFAULT NULL,
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY product_id (product_id),
            KEY transaction_type (transaction_type),
            KEY reference_id (reference_id)
        ) $charset_collate;";
        
        // Bảng nhà cung cấp
        $table_suppliers = $wpdb->prefix . 'hmm_suppliers';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_suppliers (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(100) DEFAULT NULL,
            phone varchar(20) DEFAULT NULL,
            address text,
            contact_name varchar(100) DEFAULT NULL,
            notes text,
            payment_terms varchar(100) DEFAULT NULL,
            tax_id varchar(50) DEFAULT NULL,
            status varchar(20) DEFAULT 'active',
            initial_debt decimal(15,2) DEFAULT 0.00,
            current_debt decimal(15,2) DEFAULT 0.00,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        
        // Tạo bảng phiếu nhập hàng
        $table_goods_receipts = $wpdb->prefix . 'hmm_goods_receipts';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_goods_receipts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(32) NOT NULL,
            supplier_id bigint(20) NOT NULL,
            supplier_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            total_amount decimal(15,2) NOT NULL DEFAULT 0.00,
            payment_amount decimal(15,2) NOT NULL DEFAULT 0.00,
            payment_method varchar(20) DEFAULT NULL,
            payment_status varchar(20) DEFAULT 'pending',
            status varchar(20) DEFAULT 'pending',
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY receipt_id (receipt_id),
            KEY supplier_id (supplier_id)
        ) $charset_collate;";
        
        // Bảng chi tiết phiếu nhập hàng
        $table_goods_receipt_items = $wpdb->prefix . 'hmm_goods_receipt_items';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_goods_receipt_items (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(32) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            variation_id bigint(20) DEFAULT NULL,
            sku varchar(100) DEFAULT NULL,
            quantity int(11) NOT NULL DEFAULT 0,
            unit_price decimal(15,2) NOT NULL DEFAULT 0.00,
            total_price decimal(15,2) NOT NULL DEFAULT 0.00,
            notes text,
            PRIMARY KEY (id),
            KEY receipt_id (receipt_id),
            KEY product_id (product_id)
        ) $charset_collate;";
        
        // Bảng phiếu trả hàng
        $table_returns = $wpdb->prefix . 'hmm_returns';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_returns (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id varchar(32) NOT NULL,
            type varchar(20) NOT NULL DEFAULT 'supplier',
            entity_id bigint(20) NOT NULL,
            entity_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            reason text NOT NULL,
            total_amount decimal(15,2) NOT NULL DEFAULT 0.00,
            payment_amount decimal(15,2) NOT NULL DEFAULT 0.00,
            payment_status varchar(20) DEFAULT 'not_refunded',
            status varchar(20) DEFAULT 'pending',
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY return_id (return_id),
            KEY entity_id (entity_id)
        ) $charset_collate;";
        
        // Bảng chi tiết phiếu trả hàng
        $table_return_items = $wpdb->prefix . 'hmm_return_items';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_return_items (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id varchar(32) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            variation_id bigint(20) DEFAULT NULL,
            sku varchar(100) DEFAULT NULL,
            quantity int(11) NOT NULL DEFAULT 0,
            unit_price decimal(15,2) NOT NULL DEFAULT 0.00,
            total_price decimal(15,2) NOT NULL DEFAULT 0.00,
            reason text,
            PRIMARY KEY (id),
            KEY return_id (return_id),
            KEY product_id (product_id)
        ) $charset_collate;";
        
        // Bảng phiếu thu chi
        $table_payment_receipts = $wpdb->prefix . 'hmm_payment_receipts';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_payment_receipts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(32) NOT NULL,
            type varchar(20) NOT NULL,
            entity_type varchar(20) NOT NULL,
            entity_id bigint(20) NOT NULL,
            entity_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            amount decimal(15,2) NOT NULL DEFAULT 0.00,
            payment_method varchar(20) NOT NULL,
            reference varchar(100) DEFAULT NULL,
            reference_type varchar(20) DEFAULT NULL,
            status varchar(20) DEFAULT 'completed',
            description varchar(255) NOT NULL,
            notes text,
            attachment_url text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY receipt_id (receipt_id),
            KEY entity_id (entity_id),
            KEY entity_type (entity_type),
            KEY type (type)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Lưu version của database để kiểm tra cập nhật sau này
        add_option('hmm_database_version', '1.0.4');
    }
    
    /**
     * Lấy danh sách tất cả bảng trong database
     */
    public function get_all_tables() {
        global $wpdb;
        
        // Lấy tất cả bảng trong database
        $all_tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
        $tables = array();
        
        foreach ($all_tables as $table) {
            $table_name = $table[0];
            $is_wp_table = strpos($table_name, $wpdb->prefix) === 0;
            $is_hmm_table = strpos($table_name, $wpdb->prefix . 'hmm_') === 0;
            
            $tables[] = array(
                'name' => $table_name,
                'type' => $is_hmm_table ? 'hmm' : ($is_wp_table ? 'wordpress' : 'other'),
                'rows' => $wpdb->get_var("SELECT COUNT(*) FROM $table_name")
            );
        }
        
        return array(
            'tables' => $tables,
            'prefix' => $wpdb->prefix
        );
    }
    
    /**
     * Lấy cấu trúc của một bảng cụ thể
     */
    public function get_table_structure($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Lấy thông tin cột của bảng
        $columns = $wpdb->get_results("DESCRIBE $table_name");
        
        // Lấy khóa ngoại nếu có
        $foreign_keys = $wpdb->get_results("
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE
                REFERENCED_TABLE_SCHEMA = DATABASE() AND
                TABLE_NAME = '$table_name'
        ");
        
        // Đếm số dòng dữ liệu
        $row_count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        
        // Lấy mẫu dữ liệu
        $sample_data = $wpdb->get_results("SELECT * FROM $table_name LIMIT 5");
        
        return array(
            'table_name' => $table_name,
            'columns' => $columns,
            'foreign_keys' => $foreign_keys,
            'row_count' => $row_count,
            'sample_data' => $sample_data
        );
    }
    
    /**
     * Thực thi một truy vấn SQL an toàn
     */
    public function execute_query($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        
        if (!isset($params['query']) || empty($params['query'])) {
            return new WP_Error('no_query', 'Không có truy vấn SQL', array('status' => 400));
        }
        
        $query = $params['query'];
        $query_type = strtoupper(substr(trim($query), 0, 6));
        
        // Chỉ cho phép SELECT để đảm bảo an toàn
        if ($query_type !== 'SELECT') {
            return new WP_Error('invalid_query', 'Chỉ hỗ trợ truy vấn SELECT', array('status' => 400));
        }
        
        // Thực thi truy vấn
        $results = $wpdb->get_results($query, ARRAY_A);
        
        if ($wpdb->last_error) {
            return new WP_Error('query_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'results' => $results,
            'rows_affected' => $wpdb->num_rows,
            'query' => $query
        );
    }
    
    /**
     * Tạo bảng mới
     */
    public function create_table($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        
        if (!isset($params['table_name']) || empty($params['table_name'])) {
            return new WP_Error('no_table_name', 'Không có tên bảng', array('status' => 400));
        }
        
        if (!isset($params['columns']) || empty($params['columns'])) {
            return new WP_Error('no_columns', 'Không có thông tin cột', array('status' => 400));
        }
        
        $table_name = $wpdb->prefix . 'hmm_' . sanitize_key($params['table_name']);
        $charset_collate = $wpdb->get_charset_collate();
        
        // Tạo câu lệnh SQL tạo bảng
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (";
        
        foreach ($params['columns'] as $column) {
            if (empty($column['name']) || empty($column['type'])) {
                continue;
            }
            
            $column_name = sanitize_key($column['name']);
            $column_type = sanitize_text_field($column['type']);
            
            $sql .= "$column_name $column_type";
            
            if (isset($column['not_null']) && $column['not_null']) {
                $sql .= " NOT NULL";
            }
            
            if (isset($column['default'])) {
                $default_value = sanitize_text_field($column['default']);
                $sql .= " DEFAULT '$default_value'";
            }
            
            if (isset($column['auto_increment']) && $column['auto_increment']) {
                $sql .= " AUTO_INCREMENT";
            }
            
            $sql .= ", ";
        }
        
        // Thêm khóa chính
        if (isset($params['primary_key'])) {
            $primary_key = sanitize_key($params['primary_key']);
            $sql .= "PRIMARY KEY ($primary_key)";
        } else {
            // Xóa dấu phẩy cuối cùng
            $sql = rtrim($sql, ", ");
        }
        
        $sql .= ") $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        if ($wpdb->last_error) {
            return new WP_Error('create_table_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'success' => true,
            'table_name' => $table_name,
            'message' => 'Đã tạo bảng thành công'
        );
    }

    /**
     * Thêm dữ liệu mới vào bảng
     */
    public function insert_record($request) {
        global $wpdb;

        $table_name = $request['table_name'];
        $data = $request->get_json_params();

        // Kiểm tra bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }

        // Loại bỏ trường id nếu có trong dữ liệu đầu vào
        unset($data['id']);

        // Thực hiện insert
        $result = $wpdb->insert($table_name, $data);

        if ($result === false) {
            return new WP_Error('insert_error', $wpdb->last_error, array('status' => 400));
        }

        return array(
            'success' => true,
            'id' => $wpdb->insert_id,
            'message' => 'Đã thêm dữ liệu thành công'
        );
    }

    /**
     * Cập nhật dữ liệu trong bảng
     */
    public function update_record($request) {
        global $wpdb;

        $table_name = $request['table_name'];
        $id = $request['id'];
        $data = $request->get_json_params();

        // Kiểm tra bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }

        // Loại bỏ trường id nếu có trong dữ liệu đầu vào
        unset($data['id']);

        // Thực hiện update
        $result = $wpdb->update($table_name, $data, array('id' => $id));

        if ($result === false) {
            return new WP_Error('update_error', $wpdb->last_error, array('status' => 400));
        }

        if ($result === 0) {
            return new WP_Error('no_update', 'Không có dữ liệu nào được cập nhật', array('status' => 404));
        }

        return array(
            'success' => true,
            'id' => $id,
            'message' => 'Đã cập nhật dữ liệu thành công'
        );
    }

    /**
     * Xóa dữ liệu từ bảng
     */
    public function delete_record($request) {
        global $wpdb;

        $table_name = $request['table_name'];
        $id = $request['id'];

        // Kiểm tra bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }

        // Thực hiện delete
        $result = $wpdb->delete($table_name, array('id' => $id));

        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 400));
        }

        if ($result === 0) {
            return new WP_Error('no_delete', 'Không tìm thấy bản ghi để xóa', array('status' => 404));
        }

        return array(
            'success' => true,
            'id' => $id,
            'message' => 'Đã xóa dữ liệu thành công'
        );
    }
    
    /**
     * Lấy danh sách các bảng tùy chỉnh
     */
    private function get_custom_tables() {
        global $wpdb;
        
        $tables = array();
        $custom_prefix = $wpdb->prefix . 'hmm_';
        
        $all_tables = $wpdb->get_results("SHOW TABLES LIKE '{$custom_prefix}%'", ARRAY_N);
        
        foreach ($all_tables as $table) {
            $table_name = $table[0];
            $short_name = str_replace($custom_prefix, '', $table_name);
            $row_count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
            
            $tables[] = array(
                'name' => $table_name,
                'short_name' => $short_name,
                'rows' => $row_count
            );
        }
        
        return $tables;
    }
}

// Khởi tạo plugin
new HMM_Database_API();

// Thêm menu admin để quản lý API
function hmm_database_api_menu() {
    add_menu_page(
        'HMM Database API',
        'HMM Database API',
        'manage_options',
        'hmm-database-api',
        'hmm_database_api_page',
        'dashicons-database',
        30
    );
}
add_action('admin_menu', 'hmm_database_api_menu');

// Trang quản lý API
function hmm_database_api_page() {
    ?>
    <div class="wrap">
        <h1>HMM Database API</h1>
        <div class="card">
            <h2>API Status</h2>
            <p>API endpoint: <code><?php echo rest_url('hmm/v1/status'); ?></code></p>
            <p>Để sử dụng API, bạn cần có thông tin xác thực WordPress hoặc Application Password.</p>
            
            <h3>Test API Connection</h3>
            <div id="api-test-result">Click button để kiểm tra kết nối</div>
            <button id="test-api-button" class="button button-primary">Test API Connection</button>
            
            <script>
                document.getElementById('test-api-button').addEventListener('click', async function() {
                    const resultElement = document.getElementById('api-test-result');
                    resultElement.innerHTML = 'Đang kiểm tra kết nối...';
                    
                    try {
                        // Lấy nonce từ WordPress để xác thực
                        const nonce = '<?php echo wp_create_nonce('wp_rest'); ?>';
                        const response = await fetch('<?php echo rest_url('hmm/v1/status'); ?>', {
                            method: 'GET',
                            headers: {
                                'X-WP-Nonce': nonce
                            },
                            credentials: 'same-origin'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            resultElement.innerHTML = '<div style="color: green;">Kết nối thành công! API đang hoạt động.</div>';
                        } else {
                            resultElement.innerHTML = '<div style="color: red;">Kết nối thất bại! Mã lỗi: ' + response.status + '</div>';
                        }
                    } catch (error) {
                        resultElement.innerHTML = '<div style="color: red;">Lỗi kiểm tra kết nối: ' + error.message + '</div>';
                    }
                });
            </script>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h2>Các endpoints có sẵn</h2>
            <table class="widefat">
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Method</th>
                        <th>Mô tả</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>/hmm/v1/status</code></td>
                        <td>GET</td>
                        <td>Kiểm tra trạng thái API</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables</code></td>
                        <td>GET</td>
                        <td>Lấy danh sách tất cả bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables/{table_name}</code></td>
                        <td>GET</td>
                        <td>Lấy cấu trúc của bảng cụ thể</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/query</code></td>
                        <td>POST</td>
                        <td>Thực hiện truy vấn SQL (chỉ SELECT)</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables</code></td>
                        <td>POST</td>
                        <td>Tạo bảng mới</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables/{table_name}/insert</code></td>
                        <td>POST</td>
                        <td>Thêm dữ liệu mới vào bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables/{table_name}/update/{id}</code></td>
                        <td>PUT</td>
                        <td>Cập nhật dữ liệu trong bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/tables/{table_name}/delete/{id}</code></td>
                        <td>DELETE</td>
                        <td>Xóa dữ liệu khỏi bảng</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <?php
        // Hiển thị các bảng đã tạo
        global $wpdb;
        $custom_tables = $wpdb->get_results("SHOW TABLES LIKE '{$wpdb->prefix}hmm_%'", ARRAY_N);
        if (!empty($custom_tables)) {
            ?>
            <div class="card" style="margin-top: 20px;">
                <h2>Các bảng đã tạo</h2>
                <table class="widefat">
                    <thead>
                        <tr>
                            <th>Tên bảng</th>
                            <th>Số dòng</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        foreach ($custom_tables as $table) {
                            $table_name = $table[0];
                            $row_count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
                            ?>
                            <tr>
                                <td><?php echo esc_html($table_name); ?></td>
                                <td><?php echo esc_html($row_count); ?></td>
                            </tr>
                            <?php
                        }
                        ?>
                    </tbody>
                </table>
            </div>
            <?php
        }
        ?>
    </div>
    <?php
}

// Đăng ký attachments API endpoints
function hmm_register_media_api_endpoints() {
    register_rest_route('media/v1', '/upload', array(
        'methods' => 'POST',
        'callback' => 'hmm_handle_media_upload',
        'permission_callback' => function() {
            return is_user_logged_in() || current_user_can('upload_files') || true;
        }
    ));
}
add_action('rest_api_init', 'hmm_register_media_api_endpoints');

// Hàm xử lý upload media
function hmm_handle_media_upload($request) {
    // Kiểm tra nếu có file upload
    if (!isset($_FILES['file'])) {
        return new WP_Error('no_file', 'Không tìm thấy file', array('status' => 400));
    }

    // Xử lý upload file
    $file = $_FILES['file'];
    $upload_overrides = array('test_form' => false);
    require_once(ABSPATH . 'wp-admin/includes/file.php');
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    require_once(ABSPATH . 'wp-admin/includes/media.php');

    // Thực hiện upload
    $uploaded_file = wp_handle_upload($file, $upload_overrides);

    if (isset($uploaded_file['error'])) {
        return new WP_Error('upload_error', $uploaded_file['error'], array('status' => 400));
    }

    // Tạo attachment trong WordPress Media
    $attachment = array(
        'guid' => $uploaded_file['url'],
        'post_mime_type' => $uploaded_file['type'],
        'post_title' => preg_replace('/\.[^.]+$/', '', basename($file['name'])),
        'post_content' => '',
        'post_status' => 'inherit'
    );

    $attachment_id = wp_insert_attachment($attachment, $uploaded_file['file']);

    if (is_wp_error($attachment_id)) {
        return $attachment_id;
    }

    // Tạo các kích thước khác cho ảnh
    wp_update_attachment_metadata($attachment_id, wp_generate_attachment_metadata($attachment_id, $uploaded_file['file']));

    // Lưu thông tin file vào bảng wp_hmm_attachments
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_attachments';
    
    // Tạo bảng wp_hmm_attachments nếu chưa tồn tại
    if ($wpdb->get_var("SHOW TABLES LIKE '{$table_name}'") != $table_name) {
        $charset_collate = $wpdb->get_charset_collate();
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            attachment_id bigint(20) NOT NULL,
            entity_type varchar(50) NOT NULL,
            entity_id bigint(20) DEFAULT NULL,
            file_name varchar(255) NOT NULL,
            file_path text NOT NULL,
            file_url text NOT NULL,
            file_type varchar(100) NOT NULL,
            file_size bigint(20) NOT NULL,
            uploaded_by bigint(20) DEFAULT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY attachment_id (attachment_id),
            KEY entity_type (entity_type),
            KEY entity_id (entity_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    // Thêm thông tin vào bảng wp_hmm_attachments
    $wpdb->insert(
        $table_name,
        array(
            'attachment_id' => $attachment_id,
            'entity_type' => isset($_POST['entity_type']) ? sanitize_text_field($_POST['entity_type']) : 'general',
            'entity_id' => isset($_POST['entity_id']) ? intval($_POST['entity_id']) : null,
            'file_name' => basename($file['name']),
            'file_path' => $uploaded_file['file'],
            'file_url' => $uploaded_file['url'],
            'file_type' => $uploaded_file['type'],
            'file_size' => $file['size'],
            'uploaded_by' => get_current_user_id(),
        )
    );

    // Trả về kết quả
    return array(
        'success' => true,
        'attachment_id' => $attachment_id,
        'url' => $uploaded_file['url'],
        'type' => $uploaded_file['type'],
        'file_name' => basename($file['name']),
        'file_size' => $file['size'],
    );
}
