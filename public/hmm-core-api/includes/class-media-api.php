
<?php
/**
 * HMM Media API Class
 * 
 * Handles media uploads and management
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Media_API {
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
        // API endpoint để upload file
        register_rest_route('hmm/v1', '/media/upload', array(
            'methods' => 'POST,OPTIONS',
            'callback' => array($this, 'upload_media'),
            'permission_callback' => array($this, 'check_permissions'),
        ));
        
        // API endpoint để lấy danh sách media
        register_rest_route('hmm/v1', '/media', array(
            'methods' => 'GET,OPTIONS',
            'callback' => array($this, 'get_media'),
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
        
        return current_user_can('upload_files');
    }
    
    /**
     * Upload media file
     */
    public function upload_media($request) {
        $files = $request->get_file_params();
        
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'Không có file nào được upload', array('status' => 400));
        }
        
        $file = $files['file'];
        
        // Handle file upload
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        $attachment_id = media_handle_upload('file', 0);
        
        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }
        
        $attachment_url = wp_get_attachment_url($attachment_id);
        
        return rest_ensure_response(array(
            'success' => true,
            'attachment_id' => $attachment_id,
            'url' => $attachment_url,
            'message' => 'File đã được upload thành công'
        ));
    }
    
    /**
     * Get media files
     */
    public function get_media($request) {
        $args = array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => isset($request['per_page']) ? intval($request['per_page']) : 20,
            'paged' => isset($request['page']) ? intval($request['page']) : 1
        );
        
        $attachments = get_posts($args);
        $media_items = array();
        
        foreach ($attachments as $attachment) {
            $media_items[] = array(
                'id' => $attachment->ID,
                'title' => $attachment->post_title,
                'url' => wp_get_attachment_url($attachment->ID),
                'mime_type' => $attachment->post_mime_type,
                'date' => $attachment->post_date
            );
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'media' => $media_items
        ));
    }
}
