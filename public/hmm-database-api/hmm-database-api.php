<?php
/**
 * Plugin Name: HMM Database API
 * Description: API để kết nối cơ sở dữ liệu WordPress với ứng dụng HMM Inventory
 * Version: 1.0.1
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
        
        // Cho phép CORS trong development
        add_action('rest_api_init', function() {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
            add_filter('rest_pre_serve_request', function($value) {
                header('Access-Control-Allow-Origin: *');
                header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Expose-Headers: Link', false);
                return $value;
            });
        }, 15);
    }
    
    /**
     * Đăng ký các API endpoints
     */
    public function register_api_routes() {
        // API endpoint để kiểm tra trạng thái
        register_rest_route('hmm/v1', '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy thông tin tất cả bảng
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_all_tables'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy cấu trúc bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_table_structure'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để lấy dữ liệu từ bảng
        register_rest_route('hmm/v1', '/query', array(
            'methods' => 'POST',
            'callback' => array($this, 'execute_query'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để tạo bảng mới
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_table'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
    }
    
    /**
     * Kiểm tra quyền truy cập API
     * Đã sửa để hỗ trợ cả Application Passwords và quyền quản trị
     */
    public function api_permissions_check($request) {
        // Nếu người dùng đã đăng nhập, kiểm tra quyền
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Kiểm tra xác thực bằng Application Password
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        
        if (!$auth_header) {
            return false;
        }

        // Lấy thông tin xác thực từ header
        if (preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
            $auth_data = base64_decode($matches[1]);
            list($username, $password) = explode(':', $auth_data, 2);
            
            // Lấy user ID từ tên người dùng
            $user = get_user_by('login', $username);
            
            if (!$user) {
                return false;
            }
            
            // Kiểm tra nếu đây là Application Password
            if (wp_check_password($password, $user->user_pass)) {
                // Mật khẩu cơ bản hợp lệ
                return user_can($user, 'manage_options');
            } else {
                // Kiểm tra Application Password
                require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
                $application_passwords = new WP_Application_Passwords();
                
                if (method_exists($application_passwords, 'validate_application_password')) {
                    $result = $application_passwords->validate_application_password($user->user_login, $password);
                    if (!is_wp_error($result)) {
                        return user_can($user, 'manage_options');
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Trả về trạng thái API
     */
    public function get_status() {
        global $wpdb;
        
        $tables = $this->get_custom_tables();
        
        return array(
            'status' => 'active',
            'version' => '1.0.1',
            'wordpress_version' => get_bloginfo('version'),
            'database_prefix' => $wpdb->prefix,
            'custom_tables' => $tables,
            'timestamp' => current_time('mysql')
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
        add_option('hmm_database_version', '1.0.1');
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
        
        // Thêm endpoints để thao tác với dữ liệu trong bảng
        register_rest_route('hmm/v1', '/data/(?P<table>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_table_data'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/data/(?P<table>[a-zA-Z0-9_-]+)', array(
            'methods' => 'POST',
            'callback' => array($this, 'insert_table_data'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/data/(?P<table>[a-zA-Z0-9_-]+)/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_table_data'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('hmm/v1', '/data/(?P<table>[a-zA-Z0-9_-]+)/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_table_data'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
    }
    
    /**
     * Lấy dữ liệu từ bảng
     */
    public function get_table_data($request) {
        global $wpdb;
        
        $table = $request['table'];
        $table_name = $wpdb->prefix . 'hmm_' . sanitize_key($table);
        
        // Kiểm tra bảng tồn tại
        if (!$this->table_exists($table_name)) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Thực hiện truy vấn
        $results = $wpdb->get_results("SELECT * FROM $table_name", ARRAY_A);
        
        if ($wpdb->last_error) {
            return new WP_Error('query_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'data' => $results,
            'total' => count($results)
        );
    }
    
    /**
     * Thêm dữ liệu vào bảng
     */
    public function insert_table_data($request) {
        global $wpdb;
        
        $table = $request['table'];
        $table_name = $wpdb->prefix . 'hmm_' . sanitize_key($table);
        
        // Kiểm tra bảng tồn tại
        if (!$this->table_exists($table_name)) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        $data = $request->get_json_params();
        
        // Thực hiện chèn dữ liệu
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
    public function update_table_data($request) {
        global $wpdb;
        
        $table = $request['table'];
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'hmm_' . sanitize_key($table);
        
        // Kiểm tra bảng tồn tại
        if (!$this->table_exists($table_name)) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        $data = $request->get_json_params();
        
        // Thực hiện cập nhật
        $result = $wpdb->update(
            $table_name,
            $data,
            array('id' => $id)
        );
        
        if ($result === false) {
            return new WP_Error('update_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'success' => true,
            'message' => 'Đã cập nhật dữ liệu thành công'
        );
    }
    
    /**
     * Xóa dữ liệu khỏi bảng
     */
    public function delete_table_data($request) {
        global $wpdb;
        
        $table = $request['table'];
        $id = $request['id'];
        $table_name = $wpdb->prefix . 'hmm_' . sanitize_key($table);
        
        // Kiểm tra bảng tồn tại
        if (!$this->table_exists($table_name)) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Thực hiện xóa
        $result = $wpdb->delete(
            $table_name,
            array('id' => $id)
        );
        
        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'success' => true,
            'message' => 'Đã xóa dữ liệu thành công'
        );
    }
    
    /**
     * Kiểm tra bảng có tồn tại
     */
    private function table_exists($table_name) {
        global $wpdb;
        return $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;
    }
}

// Thêm endpoints tương thích với custom-api
register_rest_route('custom/v1/db', '/(?P<table>[a-zA-Z0-9_-]+)/insert', array(
    'methods' => 'POST',
    'callback' => array($this, 'insert_table_data'),
    'permission_callback' => array($this, 'api_permissions_check'),
));

register_rest_route('custom/v1/db', '/(?P<table>[a-zA-Z0-9_-]+)/update/(?P<id>\d+)', array(
    'methods' => 'PUT',
    'callback' => array($this, 'update_table_data'),
    'permission_callback' => array($this, 'api_permissions_check'),
));

register_rest_route('custom/v1/db', '/(?P<table>[a-zA-Z0-9_-]+)/delete/(?P<id>\d+)', array(
    'methods' => 'DELETE',
    'callback' => array($this, 'delete_table_data'),
    'permission_callback' => array($this, 'api_permissions_check'),
));
