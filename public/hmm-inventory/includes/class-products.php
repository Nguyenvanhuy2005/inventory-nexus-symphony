
<?php
/**
 * Products handler class
 * 
 * Manages product operations and WooCommerce integration
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Products {
    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_hmm_get_products', array($this, 'ajax_get_products'));
        add_action('wp_ajax_hmm_search_products', array($this, 'ajax_search_products'));
        
        // Register API handlers
        // Implementation to be added
    }
    
    /**
     * Get all products (from WooCommerce)
     */
    public function get_all() {
        $products = array();
        
        // Check if WooCommerce is active
        if (class_exists('WooCommerce')) {
            $args = array(
                'status' => 'publish',
                'limit' => -1,
            );
            
            $wc_products = wc_get_products($args);
            
            foreach ($wc_products as $product) {
                $products[] = array(
                    'id' => $product->get_id(),
                    'name' => $product->get_name(),
                    'sku' => $product->get_sku(),
                    'price' => $product->get_price(),
                    'type' => $product->get_type(),
                    'stock_quantity' => $product->get_stock_quantity(),
                    'stock_status' => $product->get_stock_status()
                );
            }
        }
        
        return $products;
    }
    
    /**
     * Search products
     */
    public function search($term) {
        $products = array();
        
        // Check if WooCommerce is active
        if (class_exists('WooCommerce')) {
            $args = array(
                'status' => 'publish',
                'limit' => 20,
                's' => $term
            );
            
            $wc_products = wc_get_products($args);
            
            foreach ($wc_products as $product) {
                $products[] = array(
                    'value' => $product->get_id(),
                    'label' => $product->get_name() . ' (' . $product->get_sku() . ')'
                );
            }
        }
        
        return $products;
    }
    
    /**
     * AJAX handler for getting products
     */
    public function ajax_get_products() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $products = $this->get_all();
        
        wp_send_json_success(array(
            'products' => $products
        ));
    }
    
    /**
     * AJAX handler for searching products
     */
    public function ajax_search_products() {
        check_ajax_referer('hmm-inventory-nonce', 'nonce');
        
        $term = isset($_GET['term']) ? sanitize_text_field($_GET['term']) : '';
        
        $products = $this->search($term);
        
        wp_send_json_success($products);
    }
}

// Initialize the class
$hmm_inventory_products = new HMM_Inventory_Products();
