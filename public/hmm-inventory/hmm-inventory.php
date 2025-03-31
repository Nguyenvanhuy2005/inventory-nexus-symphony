
<?php
/**
 * Plugin Name: HMM Inventory Management
 * Plugin URI: https://hcm.sithethao.com
 * Description: Quản lý hàng hóa, nhà cung cấp, nhập xuất kho và trả hàng
 * Version: 1.0.0
 * Author: HMM Team
 * Author URI: https://hcm.sithethao.com
 * Text Domain: hmm-inventory
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HMM_INVENTORY_VERSION', '1.0.0');
define('HMM_INVENTORY_PATH', plugin_dir_path(__FILE__));
define('HMM_INVENTORY_URL', plugin_dir_url(__FILE__));

/**
 * Main plugin class
 */
class HMM_Inventory {
    /**
     * Constructor
     */
    public function __construct() {
        // Load required files
        $this->include_files();
        
        // Initialize hooks
        add_action('admin_menu', array($this, 'register_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Register activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate_plugin'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate_plugin'));
    }
    
    /**
     * Include required files
     */
    private function include_files() {
        // Include module files
        require_once(HMM_INVENTORY_PATH . 'includes/class-database.php');
        require_once(HMM_INVENTORY_PATH . 'includes/class-api.php');
        require_once(HMM_INVENTORY_PATH . 'includes/class-suppliers.php');
        require_once(HMM_INVENTORY_PATH . 'includes/class-products.php');
        require_once(HMM_INVENTORY_PATH . 'includes/class-returns.php');
        require_once(HMM_INVENTORY_PATH . 'includes/class-damaged-stock.php');
    }
    
    /**
     * Register admin menu items
     */
    public function register_admin_menu() {
        // Add main menu
        add_menu_page(
            'HMM Inventory', 
            'HMM Inventory', 
            'manage_options', 
            'hmm-inventory', 
            array($this, 'render_main_page'),
            'dashicons-cart',
            30
        );
        
        // Add sub menu pages
        add_submenu_page(
            'hmm-inventory', 
            'Dashboard', 
            'Dashboard', 
            'manage_options', 
            'hmm-inventory',
            array($this, 'render_main_page')
        );
        
        add_submenu_page(
            'hmm-inventory', 
            'Suppliers', 
            'Nhà cung cấp', 
            'manage_options', 
            'hmm-suppliers',
            array($this, 'render_suppliers_page')
        );
        
        add_submenu_page(
            'hmm-inventory', 
            'Goods Receipt', 
            'Nhập hàng', 
            'manage_options', 
            'hmm-goods-receipt',
            array($this, 'render_goods_receipt_page')
        );
        
        add_submenu_page(
            'hmm-inventory', 
            'Returns', 
            'Trả hàng', 
            'manage_options', 
            'hmm-returns',
            array($this, 'render_returns_page')
        );
        
        add_submenu_page(
            'hmm-inventory', 
            'Damaged Stock', 
            'Hàng hỏng', 
            'manage_options', 
            'hmm-damaged-stock',
            array($this, 'render_damaged_stock_page')
        );
        
        add_submenu_page(
            'hmm-inventory', 
            'Settings', 
            'Cài đặt', 
            'manage_options', 
            'hmm-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on our plugin pages
        if (strpos($hook, 'hmm-') === false) {
            return;
        }
        
        // Enqueue CSS
        wp_enqueue_style(
            'hmm-inventory-admin',
            HMM_INVENTORY_URL . 'assets/css/admin.css',
            array(),
            HMM_INVENTORY_VERSION
        );
        
        // Enqueue JS
        wp_enqueue_script(
            'hmm-inventory-admin',
            HMM_INVENTORY_URL . 'assets/js/admin.js',
            array('jquery'),
            HMM_INVENTORY_VERSION,
            true
        );
        
        // Add localized script data
        wp_localize_script(
            'hmm-inventory-admin',
            'hmm_inventory',
            array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('hmm-inventory-nonce')
            )
        );
    }
    
    /**
     * Plugin activation
     */
    public function activate_plugin() {
        // Create database tables
        $database = new HMM_Inventory_Database();
        $database->create_tables();
        
        // Add capabilities to admin users
        $role = get_role('administrator');
        if ($role) {
            $role->add_cap('hmm_manage_inventory');
        }
        
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate_plugin() {
        flush_rewrite_rules();
    }
    
    /**
     * Render main page
     */
    public function render_main_page() {
        include(HMM_INVENTORY_PATH . 'templates/dashboard.php');
    }
    
    /**
     * Render suppliers page
     */
    public function render_suppliers_page() {
        include(HMM_INVENTORY_PATH . 'templates/suppliers.php');
    }
    
    /**
     * Render goods receipt page
     */
    public function render_goods_receipt_page() {
        include(HMM_INVENTORY_PATH . 'templates/goods-receipt.php');
    }
    
    /**
     * Render returns page
     */
    public function render_returns_page() {
        include(HMM_INVENTORY_PATH . 'templates/returns.php');
    }
    
    /**
     * Render damaged stock page
     */
    public function render_damaged_stock_page() {
        include(HMM_INVENTORY_PATH . 'templates/damaged-stock.php');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        include(HMM_INVENTORY_PATH . 'templates/settings.php');
    }
}

// Initialize the plugin
$hmm_inventory = new HMM_Inventory();

