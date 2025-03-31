
<?php
/**
 * Database handler class
 * 
 * Manages database tables and operations
 */

// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

class HMM_Inventory_Database {
    /**
     * Create database tables
     */
    public function create_tables() {
        global $wpdb;
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        $charset_collate = $wpdb->get_charset_collate();
        
        // Bảng nhà cung cấp
        $suppliers_table = $wpdb->prefix . 'hmm_suppliers';
        $suppliers_sql = "CREATE TABLE $suppliers_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            name varchar(255) NOT NULL,
            address text,
            phone varchar(50),
            email varchar(100),
            notes text,
            initial_debt decimal(15,2) DEFAULT 0,
            current_debt decimal(15,2) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($suppliers_sql);
        
        // Bảng phiếu nhập hàng
        $receipts_table = $wpdb->prefix . 'hmm_goods_receipts';
        $receipts_sql = "CREATE TABLE $receipts_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id varchar(50) NOT NULL,
            supplier_id bigint(20) NOT NULL,
            supplier_name varchar(255) NOT NULL,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            total_amount decimal(15,2) NOT NULL DEFAULT 0,
            payment_amount decimal(15,2) NOT NULL DEFAULT 0,
            payment_status varchar(20) NOT NULL DEFAULT 'pending',
            status varchar(20) NOT NULL DEFAULT 'pending',
            notes text,
            affects_stock tinyint(1) DEFAULT 1,
            sync_status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($receipts_sql);
        
        // Bảng chi tiết sản phẩm nhập
        $items_table = $wpdb->prefix . 'hmm_goods_receipt_items';
        $items_sql = "CREATE TABLE $items_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            receipt_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            unit_price decimal(15,2) NOT NULL,
            total_price decimal(15,2) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY receipt_id (receipt_id)
        ) $charset_collate;";
        dbDelta($items_sql);
        
        // Bảng phiếu trả hàng
        $returns_table = $wpdb->prefix . 'hmm_returns';
        $returns_sql = "CREATE TABLE $returns_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id varchar(50) NOT NULL,
            entity_id bigint(20) NOT NULL,
            entity_name varchar(255) NOT NULL,
            type varchar(20) NOT NULL, 
            date datetime DEFAULT CURRENT_TIMESTAMP,
            total_amount decimal(15,2) NOT NULL DEFAULT 0,
            refund_amount decimal(15,2) NOT NULL DEFAULT 0,
            reason text,
            status varchar(20) NOT NULL DEFAULT 'pending',
            notes text,
            affects_stock tinyint(1) DEFAULT 1,
            sync_status varchar(20) DEFAULT 'pending',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($returns_sql);
        
        // Bảng chi tiết sản phẩm trả
        $return_items_table = $wpdb->prefix . 'hmm_return_items';
        $return_items_sql = "CREATE TABLE $return_items_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            return_id bigint(20) NOT NULL,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            unit_price decimal(15,2) NOT NULL,
            total_price decimal(15,2) NOT NULL,
            reason text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY return_id (return_id)
        ) $charset_collate;";
        dbDelta($return_items_sql);
        
        // Bảng hàng hỏng
        $damaged_table = $wpdb->prefix . 'hmm_damaged_stock';
        $damaged_sql = "CREATE TABLE $damaged_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            product_id bigint(20) NOT NULL,
            product_name varchar(255) NOT NULL,
            quantity int(11) NOT NULL,
            reason text NOT NULL,
            notes text,
            date datetime DEFAULT CURRENT_TIMESTAMP,
            sync_status varchar(20) DEFAULT 'pending',
            processed tinyint(1) DEFAULT 0,
            PRIMARY KEY  (id)
        ) $charset_collate;";
        dbDelta($damaged_sql);
    }
    
    /**
     * Execute a database query
     */
    public function query($sql, $args = array()) {
        global $wpdb;
        
        if (!empty($args)) {
            $sql = $wpdb->prepare($sql, $args);
        }
        
        return $wpdb->get_results($sql, ARRAY_A);
    }
    
    /**
     * Insert data into a table
     */
    public function insert($table, $data) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_' . $table;
        
        $wpdb->insert($table_name, $data);
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', $wpdb->last_error);
        }
        
        return $wpdb->insert_id;
    }
    
    /**
     * Update data in a table
     */
    public function update($table, $data, $where) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_' . $table;
        
        $wpdb->update($table_name, $data, $where);
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', $wpdb->last_error);
        }
        
        return true;
    }
    
    /**
     * Delete data from a table
     */
    public function delete($table, $where) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'hmm_' . $table;
        
        $wpdb->delete($table_name, $where);
        
        if ($wpdb->last_error) {
            return new WP_Error('db_error', $wpdb->last_error);
        }
        
        return true;
    }
}
