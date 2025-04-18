
<?php
/**
 * Plugin Name: HMM Media API
 * Plugin URI: https://hmm.vn
 * Description: Plugin tạo REST API endpoints cho việc quản lý và tải lên tập tin 
 * Version: 1.0.0
 * Author: HMM Team
 * Author URI: https://hmm.vn
 * Text Domain: hmm-media-api
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đăng ký REST API routes
add_action('rest_api_init', 'hmm_media_register_api_endpoints');

function hmm_media_register_api_endpoints() {
    // Register media upload endpoint
    register_rest_route('media/v1', '/upload', array(
        'methods' => 'POST',
        'callback' => 'hmm_media_upload_file',
        'permission_callback' => 'hmm_media_api_permissions_check',
    ));
    
    // Register attachment endpoints
    register_rest_route('media/v1', '/attachments', array(
        'methods' => 'POST',
        'callback' => 'hmm_media_create_attachment',
        'permission_callback' => 'hmm_media_api_permissions_check',
    ));

    register_rest_route('media/v1', '/attachments/(?P<entity_type>[a-zA-Z0-9_-]+)/(?P<entity_id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'hmm_media_get_attachments',
        'permission_callback' => '__return_true',
    ));
    
    // Register status endpoint
    register_rest_route('media/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'hmm_media_api_status',
        'permission_callback' => '__return_true',
    ));
}

// Kiểm tra quyền truy cập API
function hmm_media_api_permissions_check() {
    // Trong môi trường phát triển, cho phép tất cả truy cập
    return current_user_can('upload_files');
}

/**
 * Upload file lên WordPress Media Library
 */
function hmm_media_upload_file($request) {
    // Check if user has permissions
    if (!current_user_can('upload_files')) {
        return new WP_Error('permission_denied', 'Bạn không có quyền tải lên tập tin', ['status' => 403]);
    }
    
    // Check if file was uploaded
    if (empty($_FILES['file'])) {
        return new WP_Error('no_file', 'Không có tập tin nào được tải lên', ['status' => 400]);
    }
    
    // Upload the file using WordPress media handling
    $upload = wp_handle_upload($_FILES['file'], ['test_form' => false]);
    
    if (isset($upload['error'])) {
        return new WP_Error('upload_error', $upload['error'], ['status' => 400]);
    }
    
    // Create attachment post for the uploaded file
    $file_path = $upload['file'];
    $file_name = basename($file_path);
    $file_type = wp_check_filetype($file_name, null);
    
    $attachment = [
        'post_mime_type' => $file_type['type'],
        'post_title' => sanitize_file_name($file_name),
        'post_content' => '',
        'post_status' => 'inherit'
    ];
    
    $attach_id = wp_insert_attachment($attachment, $file_path);
    
    if (is_wp_error($attach_id)) {
        return $attach_id;
    }
    
    // Generate metadata for the attachment
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
    wp_update_attachment_metadata($attach_id, $attach_data);
    
    // Return attachment details
    return [
        'id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id),
        'file' => $file_name,
        'type' => $file_type['type']
    ];
}

/**
 * Create attachment association with an entity
 */
function hmm_media_create_attachment($request) {
    $params = $request->get_params();
    
    // Validate required fields
    if (empty($params['entity_type']) || empty($params['entity_id']) || 
        empty($params['attachment_url']) || empty($params['filename'])) {
        return new WP_Error('missing_fields', 'Thiếu thông tin bắt buộc', array('status' => 400));
    }
    
    // Create attachments table if it doesn't exist
    hmm_media_create_attachments_table();
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_attachments';
    
    // Insert attachment association
    $wpdb->insert(
        $table_name,
        [
            'entity_type' => $params['entity_type'],
            'entity_id' => $params['entity_id'],
            'attachment_id' => $params['media_id'] ?? 0,
            'attachment_url' => $params['attachment_url'],
            'filename' => $params['filename'],
            'mime_type' => $params['mime_type'] ?? 'application/octet-stream',
            'created_at' => current_time('mysql')
        ]
    );
    
    if ($wpdb->last_error) {
        return new WP_Error('db_error', $wpdb->last_error, array('status' => 500));
    }
    
    $new_id = $wpdb->insert_id;
    $attachment = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $new_id), ARRAY_A);
    
    return $attachment;
}

/**
 * Get attachments for an entity
 */
function hmm_media_get_attachments($request) {
    $entity_type = $request['entity_type'];
    $entity_id = $request['entity_id'];
    
    // Create attachments table if it doesn't exist
    hmm_media_create_attachments_table();
    
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_attachments';
    
    $attachments = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT * FROM $table_name WHERE entity_type = %s AND entity_id = %d ORDER BY created_at DESC",
            $entity_type,
            $entity_id
        ),
        ARRAY_A
    );
    
    return $attachments;
}

/**
 * Create attachments table
 */
function hmm_media_create_attachments_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'hmm_attachments';
    
    // Kiểm tra xem bảng đã tồn tại chưa
    if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
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
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

/**
 * Upload file attachment cho các phiếu và lưu trữ trong database
 */
function hmm_media_upload_and_link($file, $entityType, $entityId = 0) {
    try {
        // 1. Upload the file to WordPress Media Library
        $mediaResult = hmm_media_upload_file_direct($file);
        
        // 2. If we have an entityType and entityId, associate the file with the entity
        if ($entityType && $entityId) {
            // Create attachment record in database
            global $wpdb;
            $table_name = $wpdb->prefix . 'hmm_attachments';
            
            // Ensure the table exists
            hmm_media_create_attachments_table();
            
            // Insert attachment association
            $wpdb->insert(
                $table_name,
                [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'attachment_id' => $mediaResult['id'],
                    'attachment_url' => $mediaResult['url'],
                    'filename' => $file['name'],
                    'mime_type' => $file['type'],
                    'created_at' => current_time('mysql')
                ]
            );
        }
        
        return $mediaResult['url'];
    } catch (Exception $e) {
        error_log('Error uploading attachment: ' . $e->getMessage());
        return false;
    }
}

/**
 * Helper function to upload a file directly (not through REST API)
 */
function hmm_media_upload_file_direct($file) {
    // Upload the file using WordPress media handling
    $upload = wp_handle_upload($file, ['test_form' => false]);
    
    if (isset($upload['error'])) {
        throw new Exception($upload['error']);
    }
    
    // Create attachment post for the uploaded file
    $file_path = $upload['file'];
    $file_name = basename($file_path);
    $file_type = wp_check_filetype($file_name, null);
    
    $attachment = [
        'post_mime_type' => $file_type['type'],
        'post_title' => sanitize_file_name($file_name),
        'post_content' => '',
        'post_status' => 'inherit'
    ];
    
    $attach_id = wp_insert_attachment($attachment, $file_path);
    
    if (is_wp_error($attach_id)) {
        throw new Exception($attach_id->get_error_message());
    }
    
    // Generate metadata for the attachment
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
    wp_update_attachment_metadata($attach_id, $attach_data);
    
    return [
        'id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id),
        'file' => $file_name,
        'type' => $file_type['type']
    ];
}

/**
 * Get API status
 */
function hmm_media_api_status() {
    global $wpdb;
    
    // Kiểm tra kết nối cơ sở dữ liệu
    $db_status = !empty($wpdb->last_error) ? false : true;
    
    // Kiểm tra bảng attachments
    $attachments_table = $wpdb->prefix . 'hmm_attachments';
    $attachments_exists = $wpdb->get_var("SHOW TABLES LIKE '$attachments_table'") == $attachments_table;
    
    // Đếm số lượng attachments
    $attachments_count = $attachments_exists ? $wpdb->get_var("SELECT COUNT(*) FROM $attachments_table") : 0;
    
    return [
        'status' => 'active',
        'plugin_version' => '1.0.0',
        'db_connection' => $db_status,
        'attachments_table_exists' => $attachments_exists,
        'attachments_count' => (int)$attachments_count,
        'timestamp' => current_time('mysql')
    ];
}

// Activation hook để tạo các bảng cần thiết
register_activation_hook(__FILE__, 'hmm_media_activate_plugin');

function hmm_media_activate_plugin() {
    // Log thông tin kích hoạt
    error_log("HMM Media API activated!");
    
    // Tạo bảng attachments
    hmm_media_create_attachments_table();
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'hmm_media_deactivate_plugin');

function hmm_media_deactivate_plugin() {
    // Thực hiện các thao tác khi plugin bị tắt
    error_log("HMM Media API deactivated!");
}
