
<?php
/**
 * Plugin Name: HMM API Bridge
 * Description: Plugin cầu nối API cho hệ thống HMM Inventory với WordPress database
 * Version: 1.0.0
 * Author: HMM Team
 */

// Ngăn chặn truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HMM_API_BRIDGE_VERSION', '1.0.0');
define('HMM_API_BRIDGE_PATH', plugin_dir_path(__FILE__));
define('HMM_API_BRIDGE_URL', plugin_dir_url(__FILE__));

class HMM_API_Bridge {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('rest_api_init', array($this, 'register_routes'));
        
        // Setup CORS
        add_action('init', array($this, 'setup_cors'));
        
        // Plugin activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Initialize plugin
    }
    
    public function setup_cors() {
        // Handle CORS for all requests
        add_action('rest_api_init', function() {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
            add_filter('rest_pre_serve_request', function($value) {
                header('Access-Control-Allow-Origin: *');
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Origin, X-Requested-With');
                
                if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                    status_header(200);
                    exit;
                }
                
                return $value;
            }, 15);
        });
    }
    
    public function register_routes() {
        // Status endpoint
        register_rest_route('hmm/v1', '/status', array(
            'methods' => array('GET', 'OPTIONS'),
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // Tables list endpoint
        register_rest_route('hmm/v1', '/tables', array(
            'methods' => array('GET', 'OPTIONS'),
            'callback' => array($this, 'get_tables'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // Query endpoint
        register_rest_route('hmm/v1', '/query', array(
            'methods' => array('POST', 'OPTIONS'),
            'callback' => array($this, 'execute_query'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // CRUD endpoints
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/insert', array(
            'methods' => array('POST', 'OPTIONS'),
            'callback' => array($this, 'insert_record'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/update/(?P<id>\d+)', array(
            'methods' => array('PUT', 'OPTIONS'),
            'callback' => array($this, 'update_record'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_]+)/delete/(?P<id>\d+)', array(
            'methods' => array('DELETE', 'OPTIONS'),
            'callback' => array($this, 'delete_record'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // Dashboard stats endpoint
        register_rest_route('hmm/v1', '/dashboard/stats', array(
            'methods' => array('GET', 'OPTIONS'),
            'callback' => array($this, 'get_dashboard_stats'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
    }
    
    public function check_permissions($request) {
        // Handle OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return true;
        }
        
        // Check if user is logged in
        if (is_user_logged_in()) {
            return current_user_can('edit_posts') || current_user_can('manage_options');
        }
        
        // Check Basic Authentication
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        
        if (empty($auth_header)) {
            return new WP_Error('no_auth', 'Không có thông tin xác thực', array('status' => 401));
        }
        
        if (preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
            $auth_data = base64_decode($matches[1]);
            list($username, $password) = explode(':', $auth_data, 2);
            
            $user = get_user_by('login', $username);
            if (!$user) {
                return new WP_Error('invalid_user', 'Người dùng không tồn tại', array('status' => 401));
            }
            
            // Check regular password
            if (wp_check_password($password, $user->user_pass, $user->ID)) {
                wp_set_current_user($user->ID);
                return current_user_can('edit_posts') || current_user_can('manage_options');
            }
            
            // Check Application Password
            if (class_exists('WP_Application_Passwords')) {
                $app_password = WP_Application_Passwords::check_application_password($user, $password);
                if ($app_password && !is_wp_error($app_password)) {
                    wp_set_current_user($user->ID);
                    return current_user_can('edit_posts') || current_user_can('manage_options');
                }
            }
        }
        
        return new WP_Error('invalid_auth', 'Xác thực không thành công', array('status' => 401));
    }
    
    public function get_status($request) {
        global $wpdb;
        
        $tables = $this->get_hmm_tables();
        
        return rest_ensure_response(array(
            'status' => 'active',
            'version' => HMM_API_BRIDGE_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'custom_tables' => $tables,
            'timestamp' => current_time('mysql'),
            'authenticated' => is_user_logged_in(),
            'user_id' => get_current_user_id()
        ));
    }
    
    public function get_tables($request) {
        global $wpdb;
        
        $tables = array();
        $hmm_prefix = $wpdb->prefix . 'hmm_';
        
        $all_tables = $wpdb->get_results("SHOW TABLES LIKE '{$hmm_prefix}%'", ARRAY_N);
        
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
    }
    
    public function execute_query($request) {
        global $wpdb;
        
        $params = $request->get_json_params();
        $query = isset($params['query']) ? $params['query'] : '';
        
        if (empty($query)) {
            return new WP_Error('empty_query', 'Query không được để trống', array('status' => 400));
        }
        
        // Chỉ cho phép SELECT queries
        if (!preg_match('/^\s*SELECT\s+/i', trim($query))) {
            return new WP_Error('invalid_query', 'Chỉ cho phép SELECT queries', array('status' => 400));
        }
        
        $results = $wpdb->get_results($query, ARRAY_A);
        
        if ($wpdb->last_error) {
            return new WP_Error('query_error', $wpdb->last_error, array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'results' => $results,
            'rows_affected' => $wpdb->num_rows
        ));
    }
    
    public function insert_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $data = $request->get_json_params();
        
        // Remove id if exists
        unset($data['id']);
        
        $result = $wpdb->insert($table_name, $data);
        
        if ($result === false) {
            return new WP_Error('insert_error', $wpdb->last_error, array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'id' => $wpdb->insert_id,
            'message' => 'Đã thêm dữ liệu thành công'
        ));
    }
    
    public function update_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        $data = $request->get_json_params();
        
        unset($data['id']);
        
        $result = $wpdb->update($table_name, $data, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('update_error', $wpdb->last_error, array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'rows_affected' => $result,
            'message' => 'Đã cập nhật dữ liệu thành công'
        ));
    }
    
    public function delete_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        
        $result = $wpdb->delete($table_name, array('id' => $id), array('%d'));
        
        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 500));
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'rows_affected' => $result,
            'message' => 'Đã xóa dữ liệu thành công'
        ));
    }
    
    public function get_dashboard_stats($request) {
        global $wpdb;
        
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
            'stock_transactions' => array(
                'total' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_stock_transactions") ?: 0
            )
        );
        
        return rest_ensure_response(array(
            'success' => true,
            'stats' => $stats
        ));
    }
    
    private function get_hmm_tables() {
        global $wpdb;
        
        $tables = array();
        $hmm_prefix = $wpdb->prefix . 'hmm_';
        
        $all_tables = $wpdb->get_results("SHOW TABLES LIKE '{$hmm_prefix}%'", ARRAY_N);
        
        foreach ($all_tables as $table) {
            $table_name = $table[0];
            $short_name = str_replace($hmm_prefix, '', $table_name);
            $count = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
            
            $tables[] = array(
                'name' => $table_name,
                'short_name' => $short_name,
                'count' => (int) $count
            );
        }
        
        return $tables;
    }
    
    public function activate() {
        // Create necessary tables on activation
        $this->create_tables();
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Suppliers table
        $table_suppliers = $wpdb->prefix . 'hmm_suppliers';
        $sql = "CREATE TABLE IF NOT EXISTS $table_suppliers (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            email varchar(100) DEFAULT NULL,
            phone varchar(20) DEFAULT NULL,
            address text,
            contact_name varchar(100) DEFAULT NULL,
            notes text,
            status varchar(20) DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";
        
        // Stock transactions table
        $table_stock_transactions = $wpdb->prefix . 'hmm_stock_transactions';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_stock_transactions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            transaction_id varchar(32) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            type varchar(50) NOT NULL,
            reference_id varchar(50) DEFAULT NULL,
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY product_id (product_id),
            KEY type (type)
        ) $charset_collate;";
        
        // Goods receipts table
        $table_goods_receipts = $wpdb->prefix . 'hmm_goods_receipts';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_goods_receipts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(32) NOT NULL,
            supplier_id bigint(20) NOT NULL,
            supplier_name varchar(255) NOT NULL,
            date datetime NOT NULL,
            total_amount decimal(15,2) NOT NULL DEFAULT 0.00,
            status varchar(20) DEFAULT 'pending',
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY receipt_id (receipt_id)
        ) $charset_collate;";
        
        // Returns table
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
            status varchar(20) DEFAULT 'pending',
            notes text,
            created_by varchar(50) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY return_id (return_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

// Initialize plugin
new HMM_API_Bridge();

// Add admin menu
add_action('admin_menu', function() {
    add_menu_page(
        'HMM API Bridge',
        'HMM API Bridge',
        'manage_options',
        'hmm-api-bridge',
        'hmm_api_bridge_admin_page',
        'dashicons-admin-links',
        30
    );
});

function hmm_api_bridge_admin_page() {
    ?>
    <div class="wrap">
        <h1>HMM API Bridge</h1>
        <div class="card">
            <h2>API Status</h2>
            <p><strong>Endpoint:</strong> <code><?php echo rest_url('hmm/v1/status'); ?></code></p>
            <p><strong>Version:</strong> <?php echo HMM_API_BRIDGE_VERSION; ?></p>
            
            <h3>Available Endpoints:</h3>
            <ul>
                <li><code>GET /hmm/v1/status</code> - Kiểm tra trạng thái API</li>
                <li><code>GET /hmm/v1/tables</code> - Lấy danh sách bảng</li>
                <li><code>POST /hmm/v1/query</code> - Thực hiện SELECT query</li>
                <li><code>POST /hmm/v1/tables/{table}/insert</code> - Thêm dữ liệu</li>
                <li><code>PUT /hmm/v1/tables/{table}/update/{id}</code> - Cập nhật dữ liệu</li>
                <li><code>DELETE /hmm/v1/tables/{table}/delete/{id}</code> - Xóa dữ liệu</li>
                <li><code>GET /hmm/v1/dashboard/stats</code> - Thống kê dashboard</li>
            </ul>
            
            <div id="test-result" style="margin-top: 20px;"></div>
            <button id="test-api" class="button button-primary">Test API Connection</button>
            
            <script>
                document.getElementById('test-api').addEventListener('click', async function() {
                    const resultDiv = document.getElementById('test-result');
                    resultDiv.innerHTML = 'Testing...';
                    
                    try {
                        const response = await fetch('<?php echo rest_url('hmm/v1/status'); ?>', {
                            headers: {
                                'X-WP-Nonce': '<?php echo wp_create_nonce('wp_rest'); ?>'
                            }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            resultDiv.innerHTML = '<div style="color: green;">✓ API hoạt động bình thường</div>';
                        } else {
                            resultDiv.innerHTML = '<div style="color: red;">✗ API không hoạt động - Status: ' + response.status + '</div>';
                        }
                    } catch (error) {
                        resultDiv.innerHTML = '<div style="color: red;">✗ Lỗi kết nối: ' + error.message + '</div>';
                    }
                });
            </script>
        </div>
    </div>
    <?php
}
