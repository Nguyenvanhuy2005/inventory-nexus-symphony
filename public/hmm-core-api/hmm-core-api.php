<?php
/**
 * Plugin Name: HMM Core API
 * Plugin URI: https://hanoi.sithethao.com
 * Description: Plugin tổng hợp các API endpoints cho ứng dụng HMM Inventory (Database, Media, Custom API)
 * Version: 1.0.0
 * Author: HMM Team
 * Author URI: https://hanoi.sithethao.com
 * Text Domain: hmm-core-api
 * Domain Path: /languages
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HMM_CORE_API_VERSION', '1.0.0');
define('HMM_CORE_API_PATH', plugin_dir_path(__FILE__));
define('HMM_CORE_API_URL', plugin_dir_url(__FILE__));

/**
 * Main plugin class
 */
class HMM_Core_API {
    /**
     * Constructor
     */
    public function __construct() {
        // Load text domain properly at init action
        add_action('init', array($this, 'load_textdomain'));
        
        // Khởi tạo REST API
        add_action('rest_api_init', array($this, 'register_api_routes'));
        
        // Tạo bảng khi kích hoạt plugin
        register_activation_hook(__FILE__, array($this, 'activate_plugin'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate_plugin'));
        
        // Cải thiện CORS cho tất cả REST API requests
        add_action('rest_api_init', array($this, 'setup_cors_support'));
        
        // Thêm route cho OPTIONS để xử lý pre-flight requests
        add_filter('rest_endpoints', array($this, 'add_options_endpoints'));
        
        // Hook trước khi gửi response để thêm debug headers nếu cần
        add_filter('rest_pre_serve_request', array($this, 'add_debug_headers'), 10, 4);
        
        // Cải thiện authentication cho REST API
        add_filter('determine_current_user', array($this, 'determine_current_user_from_token'), 20);
        
        // Khởi chạy các modules
        add_action('init', array($this, 'load_modules'));
    }
    
    /**
     * Load plugin text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain('hmm-core-api', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    /**
     * Load plugin modules
     */
    public function load_modules() {
        // Include module files
        require_once(HMM_CORE_API_PATH . 'includes/class-database-api.php');
        require_once(HMM_CORE_API_PATH . 'includes/class-media-api.php');
        require_once(HMM_CORE_API_PATH . 'includes/class-custom-api.php');
        
        // Initialize modules
        new HMM_Database_API();
        new HMM_Media_API();
        new HMM_Custom_API();
    }
    
    /**
     * Plugin activation hook
     */
    public function activate_plugin() {
        // Thông báo kích hoạt plugin
        error_log('HMM Core API activated!');
        
        // Tạo các bảng cần thiết
        $this->create_custom_tables();
        
        // Thêm capability cho admin nếu cần
        $role = get_role('administrator');
        if ($role) {
            $role->add_cap('hmm_api_access');
        }
        
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation hook
     */
    public function deactivate_plugin() {
        error_log('HMM Core API deactivated!');
        flush_rewrite_rules();
    }
    
    /**
     * Tạo các bảng tùy chỉnh
     */
    public function create_custom_tables() {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();
        
        // Bảng nhà cung cấp
        $suppliers_table = $wpdb->prefix . 'hmm_suppliers';
        $suppliers_sql = "CREATE TABLE $suppliers_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            address text,
            phone varchar(50),
            email varchar(100),
            notes text,
            initial_debt decimal(15,2) DEFAULT 0,
            current_debt decimal(15,2) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($suppliers_sql);
        
        // Bảng phiếu nhập hàng
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $receipts_sql = "CREATE TABLE $receipts_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(50) NOT NULL,
            supplier_id bigint(20) NOT NULL,
            supplier_name varchar(255) NOT NULL,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            total_amount decimal(15,2) NOT NULL DEFAULT 0,
            payment_amount decimal(15,2) NOT NULL DEFAULT 0,
            payment_status varchar(20) NOT NULL DEFAULT 'pending',
            status varchar(20) NOT NULL DEFAULT 'pending',
            notes text,
            affects_stock tinyint(1) DEFAULT 1,
            sync_status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($receipts_sql);
        
        // Bảng chi tiết sản phẩm nhập
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        $items_sql = "CREATE TABLE $items_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            unit_price decimal(15,2) NOT NULL,
            total_price decimal(15,2) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY receipt_id (receipt_id)
        ) $charset_collate;";
        dbDelta($items_sql);
        
        // Bảng phiếu trả hàng
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $returns_sql = "CREATE TABLE $returns_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id varchar(50) NOT NULL,
            entity_id bigint(20) NOT NULL,
            entity_name varchar(255) NOT NULL,
            type varchar(20) NOT NULL, 
            date datetime DEFAULT CURRENT_TIMESTAMP,
            total_amount decimal(15,2) NOT NULL DEFAULT 0,
            refund_amount decimal(15,2) NOT NULL DEFAULT 0,
            reason text,
            status varchar(20) NOT NULL DEFAULT 'pending',
            notes text,
            affects_stock tinyint(1) DEFAULT 1,
            sync_status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($returns_sql);
        
        // Bảng chi tiết sản phẩm trả
        $return_items_table = $wpdb->prefix . 'hmm_return_items';
        $return_items_sql = "CREATE TABLE $return_items_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            unit_price decimal(15,2) NOT NULL,
            total_price decimal(15,2) NOT NULL,
            reason text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY return_id (return_id)
        ) $charset_collate;";
        dbDelta($return_items_sql);
        
        // Bảng hàng hỏng
        $damaged_table = $wpdb->prefix . 'hmm_damaged_stock';
        $damaged_sql = "CREATE TABLE $damaged_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            reason text NOT NULL,
            notes text,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            sync_status varchar(20) DEFAULT 'pending',
            processed tinyint(1) DEFAULT 0,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($damaged_sql);
        
        // Bảng thanh toán
        $payments_table = $wpdb->prefix . 'hmm_payment_receipts';
        $payments_sql = "CREATE TABLE $payments_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(50) NOT NULL,
            entity varchar(50) NOT NULL,
            entity_id bigint(20) NOT NULL, 
            entity_name varchar(255) NOT NULL,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            amount decimal(15,2) NOT NULL,
            payment_method varchar(50) DEFAULT 'cash',
            notes text,
            type varchar(20) DEFAULT 'payment',
            description text,
            created_by varchar(100),
            attachment_url text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($payments_sql);
        
        // Bảng file đính kèm
        $attachments_table = $wpdb->prefix . 'hmm_attachments';
        $attachments_sql = "CREATE TABLE $attachments_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            entity_type varchar(50) NOT NULL,
            entity_id bigint(20) NOT NULL DEFAULT 0,
            attachment_id bigint(20) NOT NULL,
            attachment_url varchar(255) NOT NULL,
            filename varchar(255) NOT NULL,
            mime_type varchar(100) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY entity_type_id (entity_type, entity_id)
        ) $charset_collate;";
        dbDelta($attachments_sql);
    }
    
    /**
     * Cải thiện CORS cho REST API
     */
    public function setup_cors_support() {
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
    }
    
    /**
     * Thêm endpoints OPTIONS cho pre-flight requests
     */
    public function add_options_endpoints($endpoints) {
        foreach ($endpoints as $route => $endpoint) {
            if (isset($endpoint['methods']) && !isset($endpoint['methods']['OPTIONS'])) {
                $endpoints[$route]['methods']['OPTIONS'] = true;
            }
        }
        return $endpoints;
    }
    
    /**
     * Đăng ký các API endpoints chung
     */
    public function register_api_routes() {
        // API endpoint để kiểm tra trạng thái
        register_rest_route('hmm/v1', '/status', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
    }
    
    /**
     * Thêm debug headers vào REST API response
     */
    public function add_debug_headers($served, $result, $request, $server) {
        // Thêm các header để debug
        header('X-HMM-Core-API: v' . HMM_CORE_API_VERSION);
        
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
        
        $current_user_id = get_current_user_id();
        $user_info = array(
            'user_id' => $current_user_id,
            'authenticated' => $current_user_id > 0
        );
        
        if ($current_user_id > 0) {
            $user = get_userdata($current_user_id);
            $user_info['username'] = $user->user_login;
            $user_info['roles'] = $user->roles;
        }
        
        return array(
            'status' => 'active',
            'version' => HMM_CORE_API_VERSION,
            'timestamp' => current_time('mysql'),
            'wordpress_version' => get_bloginfo('version'),
            'user' => $user_info,
            'custom_tables' => $tables
        );
    }
}

// Initialize plugin
$hmm_core_api = new HMM_Core_API();
