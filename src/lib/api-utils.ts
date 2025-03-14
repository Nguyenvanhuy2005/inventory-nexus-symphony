
import { toast } from 'sonner';

// WooCommerce API credentials
let WOO_API_URL = 'https://hmm.vn/wp-json/wc/v3';
let CONSUMER_KEY = 'ck_bb8635bb0fd810ceb013f1a01423e03a7ddf955a';
let CONSUMER_SECRET = 'cs_d2157fd9d4ef2ae3bcb1690ae4fd7c317c9f4460';

// WordPress API credentials
let WP_API_URL = 'https://hmm.vn/wp-json/wp/v2';
let WP_USERNAME = 'admin';
let APPLICATION_PASSWORD = 'w6fl K60U uSgH qrs4 F6gh LDBl';

// Custom API endpoint
let CUSTOM_API_URL = 'https://hmm.vn/wp-json/custom/v1';

// Thử lấy cấu hình từ localStorage nếu có
try {
  const savedSettings = localStorage.getItem('api_settings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (settings.woocommerce_url) WOO_API_URL = settings.woocommerce_url;
    if (settings.consumer_key) CONSUMER_KEY = settings.consumer_key;
    if (settings.consumer_secret) CONSUMER_SECRET = settings.consumer_secret;
    if (settings.wp_username) WP_USERNAME = settings.wp_username;
    if (settings.application_password) APPLICATION_PASSWORD = settings.application_password;
    
    // Cập nhật URL API tùy chỉnh dựa trên domain của WooCommerce
    if (settings.woocommerce_url) {
      const domainMatch = settings.woocommerce_url.match(/(https?:\/\/[^\/]+)/);
      if (domainMatch && domainMatch[1]) {
        CUSTOM_API_URL = `${domainMatch[1]}/wp-json/custom/v1`;
      }
    }
  }
} catch (error) {
  console.error('Error loading API settings from localStorage:', error);
}

// Interface for API options
interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  suppressToast?: boolean; // Add option to suppress toast notifications
  retryCount?: number; // Số lần thử lại khi có lỗi
  params?: Record<string, string>; // Thêm tham số query string
}

/**
 * Fetch data from WooCommerce API
 */
export async function fetchWooCommerce(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    let url = `${WOO_API_URL}${endpoint}`;
    const params = new URLSearchParams();
    
    // Thêm consumer key và secret
    params.append('consumer_key', CONSUMER_KEY);
    params.append('consumer_secret', CONSUMER_SECRET);
    
    // Thêm các tham số bổ sung
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    // Thêm params vào URL
    const requestUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    
    console.log(`Fetching WooCommerce API: ${endpoint}`);
    
    const response = await fetch(requestUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`WooCommerce API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WooCommerce API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404
    if (retryCount < 2 && !error.message?.includes('404')) {
      console.log(`Retrying WooCommerce API request (${retryCount + 1}/2)...`);
      return fetchWooCommerce(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      toast.error('Lỗi khi tải dữ liệu từ WooCommerce API');
    }
    throw error;
  }
}

/**
 * Fetch data from WordPress API
 */
export async function fetchWordPress(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    let url = `${WP_API_URL}${endpoint}`;
    const credentials = btoa(`${WP_USERNAME}:${APPLICATION_PASSWORD}`);
    
    // Thêm các tham số vào URL nếu có
    if (options.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        params.append(key, value);
      });
      url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }
    
    console.log(`Fetching WordPress API: ${endpoint}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`WordPress API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WordPress API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404
    if (retryCount < 2 && !error.message?.includes('404')) {
      console.log(`Retrying WordPress API request (${retryCount + 1}/2)...`);
      return fetchWordPress(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      toast.error('Lỗi khi tải dữ liệu từ WordPress API');
    }
    throw error;
  }
}

/**
 * Fetch data from custom API
 */
export async function fetchCustomAPI(endpoint: string, options: ApiOptions = {}) {
  const retryCount = options.retryCount || 0;
  
  try {
    let url = `${CUSTOM_API_URL}${endpoint}`;
    const credentials = btoa(`${WP_USERNAME}:${APPLICATION_PASSWORD}`);
    
    // Thêm các tham số vào URL nếu có
    if (options.params) {
      const params = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        params.append(key, value);
      });
      url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
    }
    
    console.log(`Fetching Custom API: ${endpoint}`, url);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Log the raw response for debugging
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Custom API response error: ${response.status}`, errorText);
      
      // Kiểm tra cụ thể lỗi 404 và trả về thông báo rõ ràng hơn
      if (response.status === 404) {
        // Kiểm tra nếu JSON có chứa thông báo rest_no_route
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.code === 'rest_no_route') {
            throw new Error('Plugin HMM Custom API chưa được kích hoạt hoặc các endpoint chưa được đăng ký đúng.');
          }
        } catch (e) {
          // Nếu không phải JSON hoặc không có code
        }
        throw new Error('API endpoint không tồn tại. Vui lòng cài đặt plugin HMM Custom API.');
      }
      
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Custom API response data:`, data);
    return data;
  } catch (error) {
    console.error('Custom API error:', error);
    
    // Nếu vẫn còn lần thử lại và không phải lỗi 404 (vì 404 là lỗi route không tồn tại)
    if (retryCount < 2 && !error.message?.includes('404') && !error.message?.includes('kích hoạt')) {
      console.log(`Retrying Custom API request (${retryCount + 1}/2)...`);
      return fetchCustomAPI(endpoint, { ...options, retryCount: retryCount + 1 });
    }
    
    if (!options.suppressToast) {
      if (error.message?.includes('plugin') || error.message?.includes('kích hoạt')) {
        toast.error(error.message);
      } else {
        toast.error('Lỗi khi tải dữ liệu từ API tùy chỉnh');
      }
    }
    throw error;
  }
}

/**
 * Kiểm tra trạng thái API
 */
export async function checkAPIStatus() {
  try {
    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime();
    
    try {
      // Thử kiểm tra endpoint /status trước
      const result = await fetchCustomAPI('/status', { 
        suppressToast: true,
        params: { '_': timestamp.toString() }
      });
      
      return {
        isConnected: true,
        status: result
      };
    } catch (statusError) {
      // Nếu endpoint /status không tồn tại, thử endpoint /suppliers
      // vì đây là endpoint cơ bản luôn tồn tại trong plugin
      console.log('Status endpoint not found, trying suppliers endpoint...');
      const suppliers = await fetchCustomAPI('/suppliers', { 
        suppressToast: true,
        params: { '_': timestamp.toString() }
      });
      
      // Nếu không có lỗi khi gọi /suppliers, xem như plugin đã được cài đặt
      return {
        isConnected: true,
        status: {
          plugin_version: 'Unknown version',
          suppliers_count: suppliers.length,
          timestamp: new Date().toISOString()
        }
      };
    }
  } catch (error) {
    console.error('API Status check failed:', error);
    return {
      isConnected: false,
      error: error.message
    };
  }
}

/**
 * Upload file lên WooCommerce Media
 */
export async function uploadMedia(file: File) {
  try {
    console.log('Uploading file:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('file', file);
    
    const credentials = btoa(`${WP_USERNAME}:${APPLICATION_PASSWORD}`);
    
    const response = await fetch(`${WP_API_URL}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Upload media error: ${response.status}`, errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Upload successful:', data);
    
    // Trả về URL của tập tin đã tải lên
    return {
      url: data.source_url,
      id: data.id,
      filename: data.title.rendered
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    toast.error('Lỗi khi tải lên tập tin');
    throw error;
  }
}

/**
 * Upload file attachment cho các phiếu và lưu trữ trong Custom API
 */
export async function uploadAttachment(file: File, entityType: string, entityId?: number) {
  try {
    console.log(`Uploading attachment for ${entityType} ${entityId}:`, file.name);
    
    // 1. Upload the file to WordPress Media Library
    const mediaResult = await uploadMedia(file);
    
    // 2. If we have an entityType and entityId, associate the file with the entity
    if (entityType && entityId) {
      // Gọi API tùy chỉnh để liên kết tập tin với thực thể
      await fetchCustomAPI('/attachments', {
        method: 'POST',
        body: {
          entity_type: entityType,
          entity_id: entityId,
          attachment_url: mediaResult.url,
          filename: file.name,
          mime_type: file.type,
          media_id: mediaResult.id
        }
      });
    }
    
    return mediaResult.url;
  } catch (error) {
    console.error('Error uploading attachment:', error);
    toast.error('Lỗi khi tải lên tập tin đính kèm');
    throw error;
  }
}

/**
 * Tạo tập tin PDF từ dữ liệu và tải xuống
 */
export function generatePDF(filename: string, htmlContent: string) {
  try {
    // Chức năng này sẽ được triển khai khi thêm thư viện tạo PDF
    toast.error('Chức năng xuất PDF sẽ được triển khai trong bản cập nhật tiếp theo');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Lỗi khi tạo tập tin PDF');
  }
}

/**
 * Tạo và tải xuống tập tin CSV từ dữ liệu
 */
export function exportToCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) {
    toast.error('Không có dữ liệu để xuất');
    return;
  }
  
  try {
    // Tạo tiêu đề từ keys của object đầu tiên
    const headers = Object.keys(rows[0]);
    
    // Chuyển các dòng thành chuỗi CSV
    const csvContent = [
      headers.join(','), // Tiêu đề
      ...rows.map(row => {
        return headers.map(header => {
          // Đảm bảo các giá trị có dấu phẩy được bọc trong dấu ngoặc kép
          const cell = row[header] === null || row[header] === undefined ? '' : row[header];
          return typeof cell === 'string' && cell.includes(',') 
            ? `"${cell}"` 
            : String(cell);
        }).join(',');
      })
    ].join('\n');
    
    // Tạo Blob và tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Xuất dữ liệu CSV thành công');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error('Lỗi khi xuất dữ liệu CSV');
  }
}

/**
 * Lấy danh sách người dùng WordPress
 */
export async function getWordPressUsers() {
  return await fetchWordPress('/users?per_page=100');
}

// Lưu ý: Phần code dưới đây nên được triển khai trong plugin WordPress,
// không phải trong file TypeScript này
/* 
API status endpoint function - PHP code for WordPress plugin:

function hmm_api_status() {
    global $wpdb;
    
    // Kiểm tra kết nối cơ sở dữ liệu
    $db_status = !empty($wpdb->last_error) ? false : true;
    
    // Kiểm tra bảng nhà cung cấp
    $suppliers_table = $wpdb->prefix . 'inventory_suppliers';
    $suppliers_exists = $wpdb->get_var("SHOW TABLES LIKE '$suppliers_table'") == $suppliers_table;
    
    // Đếm số nhà cung cấp
    $suppliers_count = $suppliers_exists ? $wpdb->get_var("SELECT COUNT(*) FROM $suppliers_table") : 0;
    
    return [
        'status' => 'active',
        'plugin_version' => '1.0.1',
        'db_connection' => $db_status,
        'suppliers_table_exists' => $suppliers_exists,
        'suppliers_count' => (int)$suppliers_count,
        'timestamp' => current_time('mysql')
    ];
}

// CODE TO BE ADDED TO WORDPRESS PLUGIN:

// Endpoint to handle file uploads
function hmm_upload_attachment() {
    // Check if user has permissions
    if (!current_user_can('upload_files')) {
        return new WP_Error('permission_denied', 'You do not have permission to upload files', ['status' => 403]);
    }
    
    // Check if file was uploaded
    if (empty($_FILES['file'])) {
        return new WP_Error('no_file', 'No file was uploaded', ['status' => 400]);
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
    
    // Save the association in custom table if entity info provided
    $entity_type = isset($_POST['entity_type']) ? sanitize_text_field($_POST['entity_type']) : '';
    $entity_id = isset($_POST['entity_id']) ? intval($_POST['entity_id']) : 0;
    
    if (!empty($entity_type) && $entity_id > 0) {
        global $wpdb;
        $attachments_table = $wpdb->prefix . 'inventory_attachments';
        
        // Create attachments table if it doesn't exist
        if ($wpdb->get_var("SHOW TABLES LIKE '$attachments_table'") != $attachments_table) {
            $charset_collate = $wpdb->get_charset_collate();
            $sql = "CREATE TABLE $attachments_table (
                id mediumint(9) NOT NULL AUTO_INCREMENT,
                entity_type varchar(50) NOT NULL,
                entity_id mediumint(9) NOT NULL,
                attachment_id mediumint(9) NOT NULL,
                attachment_url varchar(255) NOT NULL,
                filename varchar(255) NOT NULL,
                mime_type varchar(100) NOT NULL,
                created_at datetime DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY  (id)
            ) $charset_collate;";
            
            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
        
        // Insert attachment association
        $wpdb->insert(
            $attachments_table,
            [
                'entity_type' => $entity_type,
                'entity_id' => $entity_id,
                'attachment_id' => $attach_id,
                'attachment_url' => wp_get_attachment_url($attach_id),
                'filename' => $file_name,
                'mime_type' => $file_type['type']
            ]
        );
    }
    
    // Return attachment details
    return [
        'id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id),
        'file' => $file_name,
        'type' => $file_type['type']
    ];
}

// Register attachments endpoint
function hmm_register_attachment_endpoints() {
    register_rest_route('custom/v1', '/attachments', [
        'methods' => 'POST',
        'callback' => 'hmm_upload_attachment',
        'permission_callback' => function () {
            return current_user_can('upload_files');
        }
    ]);
}
add_action('rest_api_init', 'hmm_register_attachment_endpoints');
*/
