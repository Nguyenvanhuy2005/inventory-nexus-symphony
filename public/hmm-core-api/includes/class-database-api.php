
<?php
/**
 * HMM Database API Module
 * 
 * Provides database operations and CRUD endpoints
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
        // Đăng ký REST API routes
        add_action('rest_api_init', array($this, 'register_api_routes'));
    }
    
    /**
     * Đăng ký các API endpoints
     */
    public function register_api_routes() {
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
     * Kiểm tra quyền truy cập API
     */
    public function api_permissions_check($request) {
        // Sử dụng phương thức chung từ lớp chính
        global $hmm_core_api;
        return $hmm_core_api->api_permissions_check($request);
    }
    
    /**
     * Lấy danh sách tất cả bảng
     */
    public function get_all_tables($request) {
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
        
        return array(
            'tables' => $tables,
            'count' => count($tables)
        );
    }
    
    /**
     * Lấy cấu trúc bảng
     */
    public function get_table_structure($request) {
        global $wpdb;
        $table_name = $request['table_name'];
        
        // Đảm bảo bảng tồn tại
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return new WP_Error('table_not_found', 'Bảng không tồn tại', array('status' => 404));
        }
        
        // Lấy cấu trúc bảng
        $columns = $wpdb->get_results("DESCRIBE $table_name", ARRAY_A);
        
        // Lấy số lượng bản ghi
        $count = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
        
        return array(
            'table' => $table_name,
            'columns' => $columns,
            'records_count' => (int) $count
        );
    }
    
    /**
     * Thực thi truy vấn SQL
     */
    public function execute_query($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (empty($params['query'])) {
            return new WP_Error('missing_query', 'Thiếu câu truy vấn SQL', array('status' => 400));
        }
        
        $query = $params['query'];
        
        // Kiểm tra an toàn - chỉ cho phép SELECT
        if (!preg_match('/^SELECT\s/i', $query)) {
            return new WP_Error('invalid_query', 'Chỉ hỗ trợ truy vấn SELECT', array('status' => 403));
        }
        
        // Thực thi truy vấn
        $results = $wpdb->get_results($query, ARRAY_A);
        
        if ($wpdb->last_error) {
            return new WP_Error('query_error', $wpdb->last_error, array('status' => 500));
        }
        
        return array(
            'results' => $results,
            'rows_affected' => count($results)
        );
    }
    
    /**
     * Tạo bảng mới
     */
    public function create_table($request) {
        global $wpdb;
        $params = $request->get_json_params();
        
        if (empty($params['table_name']) || empty($params['columns'])) {
            return new WP_Error('missing_fields', 'Thiếu thông tin bảng hoặc cột', array('status' => 400));
        }
        
        $table_name = $wpdb->prefix . 'hmm_' . $params['table_name'];
        $columns = $params['columns'];
        
        // Kiểm tra bảng đã tồn tại chưa
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name) {
            return new WP_Error('table_exists', 'Bảng đã tồn tại', array('status' => 409));
        }
        
        // Tạo câu lệnh SQL
        $sql = "CREATE TABLE $table_name (";
        
        // Thêm các cột
        foreach ($columns as $column) {
            if (empty($column['name']) || empty($column['type'])) {
                continue;
            }
            
            $sql .= $column['name'] . ' ' . $column['type'];
            
            if (!empty($column['not_null']) && $column['not_null']) {
                $sql .= ' NOT NULL';
            }
            
            if (!empty($column['default'])) {
                $sql .= ' DEFAULT ' . $column['default'];
            }
            
            if (!empty($column['primary_key']) && $column['primary_key']) {
                $sql .= ' PRIMARY KEY';
            }
            
            if (!empty($column['auto_increment']) && $column['auto_increment']) {
                $sql .= ' AUTO_INCREMENT';
            }
            
            $sql .= ', ';
        }
        
        // Loại bỏ dấu phẩy cuối cùng
        $sql = rtrim($sql, ', ');
        
        $sql .= ') ' . $wpdb->get_charset_collate();
        
        // Tạo bảng
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $result = dbDelta($sql);
        
        // Kiểm tra bảng đã được tạo chưa
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") == $table_name) {
            return array(
                'success' => true,
                'message' => 'Đã tạo bảng thành công',
                'table' => $table_name,
                'result' => $result
            );
        } else {
            return new WP_Error('create_failed', 'Không thể tạo bảng', array('status' => 500));
        }
    }
    
    /**
     * Thêm bản ghi mới vào bảng
     */
    public function insert_record($request) {
        global $wpdb;
        $table_name = $request['table_name'];
        $params = $request->get_json_params();
        
        if (empty($params)) {
            return new WP_Error('missing_data', 'Không có dữ liệu để thêm', array('status' => 400));
        }
        
        // Đảm bảo bảng tồn tại
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return new WP_Error('table_not_found', 'Bảng không tồn tại', array('status' => 404));
        }
        
        // Thêm dữ liệu
        $result = $wpdb->insert($table_name, $params);
        
        if ($result === false) {
            return new WP_Error('insert_error', $wpdb->last_error, array('status' => 500));
        }
        
        $new_id = $wpdb->insert_id;
        
        // Lấy bản ghi vừa thêm
        $new_record = $wpdb->get_row("SELECT * FROM $table_name WHERE id = $new_id", ARRAY_A);
        
        return array(
            'success' => true,
            'message' => 'Đã thêm dữ liệu thành công',
            'id' => $new_id,
            'record' => $new_record
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
        
        if (empty($params)) {
            return new WP_Error('missing_data', 'Không có dữ liệu để cập nhật', array('status' => 400));
        }
        
        // Đảm bảo bảng tồn tại
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return new WP_Error('table_not_found', 'Bảng không tồn tại', array('status' => 404));
        }
        
        // Kiểm tra bản ghi tồn tại
        $record = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id), ARRAY_A);
        if (!$record) {
            return new WP_Error('record_not_found', 'Bản ghi không tồn tại', array('status' => 404));
        }
        
        // Cập nhật dữ liệu
        $result = $wpdb->update($table_name, $params, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('update_error', $wpdb->last_error, array('status' => 500));
        }
        
        // Lấy bản ghi đã cập nhật
        $updated_record = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id), ARRAY_A);
        
        return array(
            'success' => true,
            'message' => 'Đã cập nhật dữ liệu thành công',
            'id' => $id,
            'record' => $updated_record
        );
    }
    
    /**
     * Xóa bản ghi từ bảng
     */
    public function delete_record($request) {
        global $wpdb;
        $table_name = $request['table_name'];
        $id = $request['id'];
        
        // Đảm bảo bảng tồn tại
        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            return new WP_Error('table_not_found', 'Bảng không tồn tại', array('status' => 404));
        }
        
        // Kiểm tra bản ghi tồn tại
        $record = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $id), ARRAY_A);
        if (!$record) {
            return new WP_Error('record_not_found', 'Bản ghi không tồn tại', array('status' => 404));
        }
        
        // Xóa dữ liệu
        $result = $wpdb->delete($table_name, array('id' => $id));
        
        if ($result === false) {
            return new WP_Error('delete_error', $wpdb->last_error, array('status' => 500));
        }
        
        return array(
            'success' => true,
            'message' => 'Đã xóa dữ liệu thành công',
            'id' => $id
        );
    }
}
