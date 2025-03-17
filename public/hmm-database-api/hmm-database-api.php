<?php
/**
 * Plugin Name: HMM Database API
 * Description: API để kết nối cơ sở dữ liệu WordPress với ứng dụng HMM Inventory
 * Version: 1.0.2
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
                header('Access-Control-Allow-Headers: Content-Type, Authorization');
                header('Access-Control-Expose-Headers: Link', false);
                
                // Xử lý preflight requests
                if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                    status_header(200);
                    exit;
                }
                
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
        
        // API endpoint để thêm dữ liệu mới vào bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/insert', array(
            'methods' => 'POST',
            'callback' => array($this, 'insert_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để cập nhật dữ liệu trong bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/update/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint để xóa dữ liệu từ bảng
        register_rest_route('hmm/v1', '/tables/(?P<table_name>[a-zA-Z0-9_-]+)/delete/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'delete_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // API endpoint cho custom/v1/db endpoint compatibility
        register_rest_route('custom/v1', '/db/(?P<table_name>[a-zA-Z0-9_-]+)/insert', array(
            'methods' => 'POST',
            'callback' => array($this, 'db_insert_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('custom/v1', '/db/(?P<table_name>[a-zA-Z0-9_-]+)/update/(?P<id>\d+)', array(
            'methods' => 'PUT',
            'callback' => array($this, 'db_update_record'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        register_rest_route('custom/v1', '/db/(?P<table_name>[a-zA-Z0-9_-]+)/delete/(?P<id>\d+)', array(
            'methods' => 'DELETE',
            'callback' => array($this, 'db_delete_record'),
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
            'version' => '1.0.2',
            'wordpress_version' => get_bloginfo('version'),
            'database_prefix' => $wpdb->prefix,
            'custom_tables' => $tables,
            'write_support' => true,
            'timestamp' => current_time('mysql')
        );
    }
    
    // ... keep existing code (create_custom_tables, get_all_tables, get_table_structure)
    
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
     * Thêm bản ghi mới vào bảng
     */
    public function insert_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $params = $request->get_json_params();
        
        if (!isset($params['data']) || empty($params['data'])) {
            return new WP_Error('no_data', 'Không có dữ liệu để thêm vào', array('status' => 400));
        }
        
        // Thêm prefix cho tên bảng nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . 'hmm_' . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Thêm dữ liệu vào bảng
        $data = $params['data'];
        $result = $wpdb->insert($table_name, $data);
        
        if ($result === false) {
            return new WP_Error('insert_error', $wpdb->last_error, array('status' => 400));
        }
        
        $insert_id = $wpdb->insert_id;
        
        return array(
            'success' => true,
            'id' => $insert_id,
            'message' => 'Đã thêm bản ghi thành công'
        );
    }
    
    /**
     * Cập nhật bản ghi trong bảng
     */
    public function update_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (!isset($params['data']) || empty($params['data'])) {
            return new WP_Error('no_data', 'Không có dữ liệu để cập nhật', array('status' => 400));
        }
        
        // Thêm prefix cho tên bảng nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . 'hmm_' . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Kiểm tra xem bản ghi có tồn tại không
        $record_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $id));
        if (!$record_exists) {
            return new WP_Error('record_not_found', 'Không tìm thấy bản ghi', array('status' => 404));
        }
        
        // Cập nhật dữ liệu trong bảng
        $data = $params['data'];
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
            'id' => $id,
            'rows_affected' => $result,
            'message' => 'Đã cập nhật bản ghi thành công'
        );
    }
    
    /**
     * Xóa bản ghi từ bảng
     */
    public function delete_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        
        // Thêm prefix cho tên bảng nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . 'hmm_' . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Kiểm tra xem bản ghi có tồn tại không
        $record_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $id));
        if (!$record_exists) {
            return new WP_Error('record_not_found', 'Không tìm thấy bản ghi', array('status' => 404));
        }
        
        // Xóa bản ghi khỏi bảng
        $result = $wpdb->delete(
            $table_name,
            array('id' => $id)
        );
        
        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'success' => true,
            'id' => $id,
            'message' => 'Đã xóa bản ghi thành công'
        );
    }
    
    /**
     * Custom/v1 endpoint để thêm dữ liệu
     */
    public function db_insert_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $params = $request->get_json_params();
        
        if (!isset($params['data']) || empty($params['data'])) {
            return new WP_Error('no_data', 'Không có dữ liệu để thêm vào', array('status' => 400));
        }
        
        // Xử lý tên bảng từ params nếu có
        if (isset($params['table']) && !empty($params['table'])) {
            $table_name = $params['table'];
        }
        
        // Thêm prefix nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Thêm dữ liệu vào bảng
        $data = $params['data'];
        $result = $wpdb->insert($table_name, $data);
        
        if ($result === false) {
            return new WP_Error('insert_error', $wpdb->last_error, array('status' => 400));
        }
        
        $insert_id = $wpdb->insert_id;
        
        return array(
            'success' => true,
            'id' => $insert_id,
            'message' => 'Đã thêm bản ghi thành công'
        );
    }
    
    /**
     * Custom/v1 endpoint để cập nhật dữ liệu
     */
    public function db_update_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        $params = $request->get_json_params();
        
        if (!isset($params['data']) || empty($params['data'])) {
            return new WP_Error('no_data', 'Không có dữ liệu để cập nhật', array('status' => 400));
        }
        
        // Xử lý tên bảng từ params nếu có
        if (isset($params['table']) && !empty($params['table'])) {
            $table_name = $params['table'];
        }
        
        // Thêm prefix nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Kiểm tra xem bản ghi có tồn tại không
        $record_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $id));
        if (!$record_exists) {
            return new WP_Error('record_not_found', 'Không tìm thấy bản ghi', array('status' => 404));
        }
        
        // Cập nhật dữ liệu trong bảng
        $data = $params['data'];
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
            'id' => $id,
            'message' => 'Đã cập nhật bản ghi thành công'
        );
    }
    
    /**
     * Custom/v1 endpoint để xóa dữ liệu
     */
    public function db_delete_record($request) {
        global $wpdb;
        
        $table_name = $request['table_name'];
        $id = $request['id'];
        $params = $request->get_json_params();
        
        // Xử lý tên bảng từ params nếu có
        if (isset($params['table']) && !empty($params['table'])) {
            $table_name = $params['table'];
        }
        
        // Thêm prefix nếu chưa có
        if (strpos($table_name, $wpdb->prefix) !== 0) {
            $table_name = $wpdb->prefix . $table_name;
        }
        
        // Kiểm tra xem bảng có tồn tại không
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'");
        if (!$table_exists) {
            return new WP_Error('table_not_found', 'Không tìm thấy bảng', array('status' => 404));
        }
        
        // Kiểm tra xem bản ghi có tồn tại không
        $record_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE id = %d", $id));
        if (!$record_exists) {
            return new WP_Error('record_not_found', 'Không tìm thấy bản ghi', array('status' => 404));
        }
        
        // Xóa bản ghi khỏi bảng
        $result = $wpdb->delete(
            $table_name,
            array('id' => $id)
        );
        
        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 400));
        }
        
        return array(
            'success' => true,
            'id' => $id,
            'message' => 'Đã xóa bản ghi thành công'
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
                        const response = await fetch('<?php echo rest_url('hmm/v1/status'); ?>', {
                            method: 'GET',
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