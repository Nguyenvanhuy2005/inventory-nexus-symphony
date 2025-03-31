
<?php
/**
 * Suppliers handler class
 * 
 * Manages supplier operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Suppliers {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_suppliers', array($this, 'ajax_get_suppliers'));
        add_action('wp_ajax_hmm_create_supplier', array($this, 'ajax_create_supplier'));
        add_action('wp_ajax_hmm_update_supplier', array($this, 'ajax_update_supplier'));
        add_action('wp_ajax_hmm_delete_supplier', array($this, 'ajax_delete_supplier'));
        
        // Register API handlers
        // Implementation to be added
    }
    
    // Implementation to be added
}

// Initialize the class
$hmm_inventory_suppliers = new HMM_Inventory_Suppliers();
