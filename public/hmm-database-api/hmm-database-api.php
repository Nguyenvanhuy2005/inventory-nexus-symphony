<?php
/**
 * Plugin Name: HMM Database API
 * Description: API để kết nối cơ sở dữ liệu WordPress với ứng dụng HMM Inventory
 * Version: 1.0.2
 * Author: HMM
 */

// Ngăn chặn truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Database_API {
    private static $instance = null;
    
    /**
     * Singleton pattern - chỉ cho phép một instance của plugin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Khởi tạo REST API
        add_action('rest_api_init', array($this, 'register_api_routes'));
        
        // Tạo bảng khi kích hoạt plugin
        register_activation_hook(__FILE__, array($this, 'create_custom_tables'));
        
        // Thêm menu admin
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Cho phép CORS và OPTIONS requests
        add_action('rest_api_init', function() {
            remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
            add_filter('rest_pre_serve_request', function($value) {
                header('Access-Control-Allow-Origin: *');
                header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
                header('Access-Control-Allow-Credentials: true');
                header('Access-Control-Allow-Headers: Authorization, Content-Type');
                
                // Handle OPTIONS request
                if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
                    status_header(200);
                    exit();
                }
                
                return $value;
            });
        }, 15);
    }

    /**
     * Đăng ký các API endpoints
     */
    public function register_api_routes() {
        // Base API route
        $base = 'hmm/v1';
        
        // Status endpoint
        register_rest_route($base, '/status', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_status'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Tables endpoints
        register_rest_route($base, '/tables', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_all_tables'),
                'permission_callback' => array($this, 'api_permissions_check'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'create_table'),
                'permission_callback' => array($this, 'api_permissions_check'),
            )
        ));
        
        // Table structure endpoint
        register_rest_route($base, '/tables/(?P<table_name>[a-zA-Z0-9_-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_table_structure'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Query endpoint
        register_rest_route($base, '/query', array(
            'methods' => 'POST',
            'callback' => array($this, 'execute_query'),
            'permission_callback' => array($this, 'api_permissions_check'),
        ));
        
        // Table data endpoints
        register_rest_route($base, '/data/(?P<table>[a-zA-Z0-9_-]+)', array(
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_table_data'),
                'permission_callback' => array($this, 'api_permissions_check'),
            ),
            array(
                'methods' => 'POST',
                'callback' => array($this, 'insert_table_data'),
                'permission_callback' => array($this, 'api_permissions_check'),
            )
        ));
        
        register_rest_route($base, '/data/(?P<table>[a-zA-Z0-9_-]+)/(?P<id>\d+)', array(
            array(
                'methods' => 'PUT',
                'callback' => array($this, 'update_table_data'),
                'permission_callback' => array($this, 'api_permissions_check'),
            ),
            array(
                'methods' => 'DELETE',
                'callback' => array($this, 'delete_table_data'),
                'permission_callback' => array($this, 'api_permissions_check'),
            )
        ));
        
        // Compatibility endpoints for custom-api
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
    }

    /**
     * Kiểm tra quyền truy cập API
     */
    public function api_permissions_check($request) {
        // Allow OPTIONS requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            return true;
        }
        
        // Check if user is logged in with admin rights
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Check Application Password authentication
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : false;
        
        if (!$auth_header) {
            return false;
        }

        if (preg_match('/Basic\s+(.*)$/i', $auth_header, $matches)) {
            $auth_data = base64_decode($matches[1]);
            list($username, $password) = explode(':', $auth_data, 2);
            
            $user = get_user_by('login', $username);
            
            if (!$user) {
                return false;
            }
            
            // Check normal password
            if (wp_check_password($password, $user->user_pass)) {
                return user_can($user, 'manage_options');
            }
            
            // Check Application Password
            require_once ABSPATH . 'wp-includes/class-wp-application-passwords.php';
            $application_passwords = new WP_Application_Passwords();
            
            if (method_exists($application_passwords, 'validate_application_password')) {
                $result = $application_passwords->validate_application_password($user->user_login, $password);
                if (!is_wp_error($result)) {
                    return user_can($user, 'manage_options');
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
        $write_support = true; // Indicate write support is enabled
        
        return array(
            'status' => 'active',
            'version' => '1.0.2',
            'wordpress_version' => get_bloginfo('version'),
            'database_prefix' => $wpdb->prefix,
            'custom_tables' => $tables,
            'write_support' => $write_support,
            'timestamp' => current_time('mysql')
        );
    }
          // Khởi tạo plugin
$hmm_database_api = new HMM_Database_API();

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
        
        <!-- API Status Card -->
        <div class="card">
            <h2>API Status</h2>
            <p>API endpoint: <code><?php echo rest_url('hmm/v1/status'); ?></code></p>
            <p>Version: 1.0.2 (Hỗ trợ thêm/sửa/xóa dữ liệu)</p>
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
                            resultElement.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                        } else {
                            resultElement.innerHTML = '<div style="color: red;">Kết nối thất bại! Mã lỗi: ' + response.status + '</div>';
                        }
                    } catch (error) {
                        resultElement.innerHTML = '<div style="color: red;">Lỗi kiểm tra kết nối: ' + error.message + '</div>';
                    }
                });
            </script>
        </div>
        
        <!-- API Endpoints Card -->
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
                        <td><code>/hmm/v1/data/{table}</code></td>
                        <td>GET</td>
                        <td>Lấy tất cả dữ liệu từ bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/data/{table}</code></td>
                        <td>POST</td>
                        <td>Thêm dữ liệu mới vào bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/data/{table}/{id}</code></td>
                        <td>PUT</td>
                        <td>Cập nhật dữ liệu trong bảng</td>
                    </tr>
                    <tr>
                        <td><code>/hmm/v1/data/{table}/{id}</code></td>
                        <td>DELETE</td>
                        <td>Xóa dữ liệu khỏi bảng</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Compatibility Endpoints -->
        <div class="card" style="margin-top: 20px;">
            <h2>Endpoints tương thích</h2>
            <p>Các endpoints này được giữ lại để tương thích với phiên bản cũ:</p>
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
                        <td><code>/custom/v1/db/{table}/insert</code></td>
                        <td>POST</td>
                        <td>Thêm dữ liệu mới (tương thích cũ)</td>
                    </tr>
                    <tr>
                        <td><code>/custom/v1/db/{table}/update/{id}</code></td>
                        <td>PUT</td>
                        <td>Cập nhật dữ liệu (tương thích cũ)</td>
                    </tr>
                    <tr>
                        <td><code>/custom/v1/db/{table}/delete/{id}</code></td>
                        <td>DELETE</td>
                        <td>Xóa dữ liệu (tương thích cũ)</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Database Tables Card -->
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
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        foreach ($custom_tables as $table) {
                            $table_name = $table[0];
                            $row_count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
                            $short_name = str_replace($wpdb->prefix . 'hmm_', '', $table_name);
                            ?>
                            <tr>
                                <td><?php echo esc_html($table_name); ?></td>
                                <td><?php echo esc_html($row_count); ?></td>
                                <td>
                                    <button class="button view-structure" data-table="<?php echo esc_attr($table_name); ?>">
                                        Xem cấu trúc
                                    </button>
                                    <div id="structure-<?php echo esc_attr($table_name); ?>" style="display: none;"></div>
                                </td>
                            </tr>
                            <?php
                        }
                        ?>
                    </tbody>
                </table>
            </div>
            
            <script>
                document.querySelectorAll('.view-structure').forEach(button => {
                    button.addEventListener('click', async function() {
                        const tableName = this.dataset.table;
                        const structureDiv = document.getElementById('structure-' + tableName);
                        
                        if (structureDiv.style.display === 'none') {
                            try {
                                const response = await fetch('<?php echo rest_url('hmm/v1/tables/'); ?>' + tableName, {
                                    credentials: 'same-origin'
                                });
                                
                                if (response.ok) {
                                    const data = await response.json();
                                    structureDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                                    structureDiv.style.display = 'block';
                                } else {
                                    structureDiv.innerHTML = '<div style="color: red;">Lỗi lấy cấu trúc bảng</div>';
                                    structureDiv.style.display = 'block';
                                }
                            } catch (error) {
                                structureDiv.innerHTML = '<div style="color: red;">Lỗi: ' + error.message + '</div>';
                                structureDiv.style.display = 'block';
                            }
                        } else {
                            structureDiv.style.display = 'none';
                        }
                    });
                });
            </script>
            <?php
        }
        ?>
        
        <!-- API Documentation -->
        <div class="card" style="margin-top: 20px;">
            <h2>Hướng dẫn sử dụng API</h2>
            
            <h3>1. Xác thực</h3>
            <p>API sử dụng Basic Authentication với hai phương thức:</p>
            <ul>
                <li>WordPress user/password</li>
                <li>Application Password (khuyến nghị)</li>
            </ul>
            
            <h3>2. Ví dụ sử dụng</h3>
            <pre>
// Lấy dữ liệu từ bảng
fetch('/wp-json/hmm/v1/data/suppliers', {
    headers: {
        'Authorization': 'Basic ' + btoa('username:application_password')
    }
})

// Thêm dữ liệu mới
fetch('/wp-json/hmm/v1/data/suppliers', {
    method: 'POST',
    headers: {
        'Authorization': 'Basic ' + btoa('username:application_password'),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Nhà cung cấp mới',
        email: 'email@example.com'
    })
})

// Cập nhật dữ liệu
fetch('/wp-json/hmm/v1/data/suppliers/123', {
    method: 'PUT',
    headers: {
        'Authorization': 'Basic ' + btoa('username:application_password'),
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Tên mới'
    })
})

// Xóa dữ liệu
fetch('/wp-json/hmm/v1/data/suppliers/123', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Basic ' + btoa('username:application_password')
    }
})
            </pre>
            
            <h3>3. Xử lý lỗi</h3>
            <p>API trả về các mã lỗi HTTP tiêu chuẩn:</p>
            <ul>
                <li>200: Thành công</li>
                <li>400: Lỗi dữ liệu đầu vào</li>
                <li>401: Lỗi xác thực</li>
                <li>403: Không có quyền</li>
                <li>404: Không tìm thấy</li>
                <li>500: Lỗi server</li>
            </ul>
        </div>
        
        <style>
            .card {
                background: #fff;
                border: 1px solid #ccd0d4;
                border-radius: 4px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .card h2 {
                margin-top: 0;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
            }
            
            .card h3 {
                margin: 1.5em 0 1em;
            }
            
            .widefat {
                margin: 1em 0;
            }
            
            pre {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                overflow-x: auto;
            }
            
            .view-structure {
                margin-right: 10px;
            }
            
            #api-test-result {
                margin: 1em 0;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            }
            
            .button {
                margin: 5px;
            }
        </style>
    </div>
    <?php
}
