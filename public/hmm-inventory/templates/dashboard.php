
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Lấy thống kê từ cơ sở dữ liệu
global $wpdb;
$suppliers_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_suppliers");
$goods_receipts_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts");
$returns_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns");
$damaged_count = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock");

// Lấy tổng số nhập hàng, trả hàng, và hàng hỏng trong 30 ngày qua
$thirty_days_ago = date('Y-m-d H:i:s', strtotime('-30 days'));
$recent_receipts = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_goods_receipts WHERE created_at >= %s",
    $thirty_days_ago
));
$recent_returns = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_returns WHERE created_at >= %s",
    $thirty_days_ago
));
$recent_damaged = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM {$wpdb->prefix}hmm_damaged_stock WHERE date >= %s",
    $thirty_days_ago
));

// Lấy 5 phiếu nhập gần đây nhất
$recent_goods_receipts = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}hmm_goods_receipts ORDER BY created_at DESC LIMIT 5",
    ARRAY_A
);

// Lấy 5 phiếu trả gần đây nhất
$recent_returns = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}hmm_returns ORDER BY created_at DESC LIMIT 5",
    ARRAY_A
);

// Lấy 5 nhà cung cấp có nhiều đơn hàng nhất
$top_suppliers = $wpdb->get_results(
    "SELECT s.name, s.id, COUNT(gr.id) as order_count, SUM(gr.total_amount) as total_amount
    FROM {$wpdb->prefix}hmm_suppliers s 
    LEFT JOIN {$wpdb->prefix}hmm_goods_receipts gr ON s.id = gr.supplier_id 
    GROUP BY s.id 
    ORDER BY order_count DESC
    LIMIT 5",
    ARRAY_A
);
?>

<div class="wrap">
    <h1>HMM Inventory Dashboard</h1>
    
    <div class="hmm-dashboard">
        <!-- Tổng quan -->
        <div class="hmm-row">
            <div class="hmm-card hmm-card-primary">
                <div class="hmm-card-header">
                    <h2>Tổng quan</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-stats-grid">
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $suppliers_count; ?></span>
                            <span class="hmm-stat-label">Nhà cung cấp</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $goods_receipts_count; ?></span>
                            <span class="hmm-stat-label">Phiếu nhập hàng</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $returns_count; ?></span>
                            <span class="hmm-stat-label">Phiếu trả hàng</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $damaged_count; ?></span>
                            <span class="hmm-stat-label">Hàng hỏng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Hoạt động gần đây -->
        <div class="hmm-row">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2>Hoạt động 30 ngày qua</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-stats-grid">
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $recent_receipts; ?></span>
                            <span class="hmm-stat-label">Phiếu nhập mới</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $recent_returns; ?></span>
                            <span class="hmm-stat-label">Phiếu trả mới</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-value"><?php echo $recent_damaged; ?></span>
                            <span class="hmm-stat-label">Báo cáo hàng hỏng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Nhập hàng gần đây -->
        <div class="hmm-row">
            <div class="hmm-column hmm-column-half">
                <div class="hmm-card">
                    <div class="hmm-card-header">
                        <h2>Nhập hàng gần đây</h2>
                    </div>
                    <div class="hmm-card-body">
                        <table class="hmm-table">
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Ngày</th>
                                    <th>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($recent_goods_receipts)): ?>
                                    <tr>
                                        <td colspan="4">Không có dữ liệu</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($recent_goods_receipts as $receipt): ?>
                                        <tr>
                                            <td><?php echo esc_html($receipt['receipt_id']); ?></td>
                                            <td><?php echo esc_html($receipt['supplier_name']); ?></td>
                                            <td><?php echo esc_html(date('d/m/Y', strtotime($receipt['date']))); ?></td>
                                            <td><?php echo number_format($receipt['total_amount']); ?> ₫</td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                        <p class="hmm-card-footer">
                            <a href="?page=hmm-goods-receipt" class="button">Xem tất cả</a>
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Trả hàng gần đây -->
            <div class="hmm-column hmm-column-half">
                <div class="hmm-card">
                    <div class="hmm-card-header">
                        <h2>Trả hàng gần đây</h2>
                    </div>
                    <div class="hmm-card-body">
                        <table class="hmm-table">
                            <thead>
                                <tr>
                                    <th>Mã phiếu</th>
                                    <th>Loại</th>
                                    <th>Ngày</th>
                                    <th>Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($recent_returns)): ?>
                                    <tr>
                                        <td colspan="4">Không có dữ liệu</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($recent_returns as $return): ?>
                                        <tr>
                                            <td><?php echo esc_html($return['return_id']); ?></td>
                                            <td>
                                                <?php echo $return['type'] == 'supplier' ? 'Trả NCC' : 'Khách trả'; ?>
                                            </td>
                                            <td><?php echo esc_html(date('d/m/Y', strtotime($return['date']))); ?></td>
                                            <td><?php echo number_format($return['total_amount']); ?> ₫</td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                        <p class="hmm-card-footer">
                            <a href="?page=hmm-returns" class="button">Xem tất cả</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Nhà cung cấp hàng đầu -->
        <div class="hmm-row">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2>Nhà cung cấp hàng đầu</h2>
                </div>
                <div class="hmm-card-body">
                    <table class="hmm-table">
                        <thead>
                            <tr>
                                <th>Nhà cung cấp</th>
                                <th>Số lượng đơn</th>
                                <th>Tổng tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($top_suppliers)): ?>
                                <tr>
                                    <td colspan="3">Không có dữ liệu</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($top_suppliers as $supplier): ?>
                                    <tr>
                                        <td><?php echo esc_html($supplier['name']); ?></td>
                                        <td><?php echo intval($supplier['order_count']); ?></td>
                                        <td>
                                            <?php 
                                            if ($supplier['total_amount']) {
                                                echo number_format($supplier['total_amount']) . ' ₫';
                                            } else {
                                                echo '0 ₫';
                                            }
                                            ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                    <p class="hmm-card-footer">
                        <a href="?page=hmm-suppliers" class="button">Xem tất cả nhà cung cấp</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

