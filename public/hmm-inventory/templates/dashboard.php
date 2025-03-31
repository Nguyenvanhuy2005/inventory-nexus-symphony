
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
    "SELECT gr.*, s.name as supplier_name 
    FROM {$wpdb->prefix}hmm_goods_receipts gr
    LEFT JOIN {$wpdb->prefix}hmm_suppliers s ON gr.supplier_id = s.id
    ORDER BY gr.created_at DESC LIMIT 5",
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

// Lấy báo cáo tồn kho có vấn đề (sắp hết, đã hết)
$stock_issues = $wpdb->get_results(
    "SELECT p.ID as product_id, p.post_title as product_name, 
            pm1.meta_value as stock_quantity, pm2.meta_value as stock_status
    FROM {$wpdb->prefix}posts p
    LEFT JOIN {$wpdb->prefix}postmeta pm1 ON p.ID = pm1.post_id AND pm1.meta_key = '_stock'
    LEFT JOIN {$wpdb->prefix}postmeta pm2 ON p.ID = pm2.post_id AND pm2.meta_key = '_stock_status'
    WHERE p.post_type = 'product' AND p.post_status = 'publish'
    AND (
        (pm2.meta_value = 'outofstock') OR
        (pm1.meta_value IS NOT NULL AND pm1.meta_value <= 5 AND pm1.meta_value > 0)
    )
    ORDER BY pm1.meta_value ASC
    LIMIT 10",
    ARRAY_A
);

// Lấy doanh thu theo tháng (6 tháng gần đây)
$monthly_stats = array();
for ($i = 5; $i >= 0; $i--) {
    $month = date('m', strtotime("-$i months"));
    $year = date('Y', strtotime("-$i months"));
    $month_name = date('m/Y', strtotime("-$i months"));
    
    $start_date = date('Y-m-01', strtotime("$year-$month-01"));
    $end_date = date('Y-m-t', strtotime("$year-$month-01"));
    
    $total_receipts = $wpdb->get_var($wpdb->prepare(
        "SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_goods_receipts 
        WHERE date BETWEEN %s AND %s AND status = 'completed'",
        $start_date, $end_date
    )) ?: 0;
    
    $total_returns = $wpdb->get_var($wpdb->prepare(
        "SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_returns 
        WHERE date BETWEEN %s AND %s AND status = 'completed'",
        $start_date, $end_date
    )) ?: 0;
    
    $monthly_stats[] = array(
        'month' => $month_name,
        'receipts' => $total_receipts,
        'returns' => $total_returns,
        'net' => $total_receipts - $total_returns
    );
}

// Lấy tổng số tiền đã nhập hàng và còn nợ
$total_receipts_amount = $wpdb->get_var(
    "SELECT SUM(total_amount) FROM {$wpdb->prefix}hmm_goods_receipts WHERE status = 'completed'"
) ?: 0;

$total_paid_amount = $wpdb->get_var(
    "SELECT SUM(payment_amount) FROM {$wpdb->prefix}hmm_goods_receipts WHERE status = 'completed'"
) ?: 0;

$total_debt_amount = $total_receipts_amount - $total_paid_amount;

// Format functions
function format_money($amount) {
    return number_format($amount, 0, ',', '.');
}

function get_payment_status_text($status) {
    switch ($status) {
        case 'paid': return 'Đã thanh toán';
        case 'partial': return 'Một phần';
        case 'pending': return 'Chưa thanh toán';
        default: return 'Không xác định';
    }
}

function get_status_text($status) {
    switch ($status) {
        case 'completed': return 'Hoàn thành';
        case 'pending': return 'Chờ xử lý';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không xác định';
    }
}

function get_status_class($status) {
    switch ($status) {
        case 'completed': return 'status-completed';
        case 'pending': return 'status-pending';
        case 'cancelled': return 'status-cancelled';
        case 'paid': return 'status-completed';
        case 'partial': return 'status-pending';
        default: return '';
    }
}

// Generate chart data
function generate_chart_data($data) {
    $chart_labels = array();
    $receipts_data = array();
    $returns_data = array();
    $net_data = array();
    
    foreach ($data as $item) {
        $chart_labels[] = $item['month'];
        $receipts_data[] = $item['receipts'];
        $returns_data[] = $item['returns'];
        $net_data[] = $item['net'];
    }
    
    return array(
        'labels' => json_encode($chart_labels),
        'receipts' => json_encode($receipts_data),
        'returns' => json_encode($returns_data),
        'net' => json_encode($net_data)
    );
}

$chart_data = generate_chart_data($monthly_stats);
?>

<div class="wrap">
    <h1>HMM Inventory Dashboard</h1>
    
    <div class="hmm-dashboard">
        <!-- Tổng quan -->
        <div class="hmm-row">
            <div class="hmm-card hmm-card-primary">
                <div class="hmm-card-header">
                    <h2><span class="dashicons dashicons-chart-bar"></span> Tổng quan</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-stats-grid">
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-businessman"></span>
                            <span class="hmm-stat-value"><?php echo $suppliers_count; ?></span>
                            <span class="hmm-stat-label">Nhà cung cấp</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-cart"></span>
                            <span class="hmm-stat-value"><?php echo $goods_receipts_count; ?></span>
                            <span class="hmm-stat-label">Phiếu nhập hàng</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-undo"></span>
                            <span class="hmm-stat-value"><?php echo $returns_count; ?></span>
                            <span class="hmm-stat-label">Phiếu trả hàng</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-warning"></span>
                            <span class="hmm-stat-value"><?php echo $damaged_count; ?></span>
                            <span class="hmm-stat-label">Hàng hỏng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tài chính -->
        <div class="hmm-row">
            <div class="hmm-card hmm-card-bordered">
                <div class="hmm-card-header">
                    <h2><span class="dashicons dashicons-money-alt"></span> Tài chính</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-stats-grid">
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-label">Tổng nhập hàng</span>
                            <span class="hmm-stat-value"><?php echo format_money($total_receipts_amount); ?> ₫</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-label">Đã thanh toán</span>
                            <span class="hmm-stat-value"><?php echo format_money($total_paid_amount); ?> ₫</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-label">Còn nợ nhà cung cấp</span>
                            <span class="hmm-stat-value"><?php echo format_money($total_debt_amount); ?> ₫</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Biểu đồ thống kê theo tháng -->
        <div class="hmm-row">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2><span class="dashicons dashicons-chart-line"></span> Thống kê theo tháng (6 tháng gần đây)</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-chart-container">
                        <canvas id="monthlySalesChart"></canvas>
                    </div>
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            var ctx = document.getElementById('monthlySalesChart').getContext('2d');
                            var monthlySalesChart = new Chart(ctx, {
                                type: 'bar',
                                data: {
                                    labels: <?php echo $chart_data['labels']; ?>,
                                    datasets: [{
                                        label: 'Nhập hàng',
                                        data: <?php echo $chart_data['receipts']; ?>,
                                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                        borderColor: 'rgba(54, 162, 235, 1)',
                                        borderWidth: 1
                                    }, {
                                        label: 'Trả hàng',
                                        data: <?php echo $chart_data['returns']; ?>,
                                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                        borderColor: 'rgba(255, 99, 132, 1)',
                                        borderWidth: 1
                                    }, {
                                        label: 'Chênh lệch',
                                        data: <?php echo $chart_data['net']; ?>,
                                        type: 'line',
                                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        borderWidth: 2,
                                        fill: false
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: function(value) {
                                                    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ₫';
                                                }
                                            }
                                        }
                                    },
                                    plugins: {
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    var label = context.dataset.label || '';
                                                    if (label) {
                                                        label += ': ';
                                                    }
                                                    label += context.raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ₫';
                                                    return label;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        });
                    </script>
                </div>
            </div>
        </div>
        
        <!-- Hoạt động gần đây -->
        <div class="hmm-row">
            <div class="hmm-card">
                <div class="hmm-card-header">
                    <h2><span class="dashicons dashicons-calendar-alt"></span> Hoạt động 30 ngày qua</h2>
                </div>
                <div class="hmm-card-body">
                    <div class="hmm-stats-grid">
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-cart"></span>
                            <span class="hmm-stat-value"><?php echo $recent_receipts; ?></span>
                            <span class="hmm-stat-label">Phiếu nhập mới</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-undo"></span>
                            <span class="hmm-stat-value"><?php echo $recent_returns; ?></span>
                            <span class="hmm-stat-label">Phiếu trả mới</span>
                        </div>
                        <div class="hmm-stat-box">
                            <span class="hmm-stat-icon dashicons dashicons-warning"></span>
                            <span class="hmm-stat-value"><?php echo $recent_damaged; ?></span>
                            <span class="hmm-stat-label">Báo cáo hàng hỏng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Cảnh báo tồn kho -->
        <div class="hmm-row">
            <div class="hmm-column hmm-column-half">
                <div class="hmm-card hmm-card-warning">
                    <div class="hmm-card-header">
                        <h2><span class="dashicons dashicons-warning"></span> Cảnh báo tồn kho</h2>
                    </div>
                    <div class="hmm-card-body">
                        <table class="hmm-table">
                            <thead>
                                <tr>
                                    <th>Sản phẩm</th>
                                    <th>Tồn kho</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($stock_issues)): ?>
                                    <tr>
                                        <td colspan="3">Không có cảnh báo tồn kho</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($stock_issues as $item): ?>
                                        <tr>
                                            <td>
                                                <a href="<?php echo admin_url('post.php?post=' . $item['product_id'] . '&action=edit'); ?>" target="_blank">
                                                    <?php echo esc_html($item['product_name']); ?>
                                                </a>
                                            </td>
                                            <td><?php echo (int)$item['stock_quantity']; ?></td>
                                            <td>
                                                <span class="hmm-status-badge <?php echo $item['stock_status'] == 'outofstock' ? 'status-danger' : 'status-warning'; ?>">
                                                    <?php echo $item['stock_status'] == 'outofstock' ? 'Hết hàng' : 'Sắp hết'; ?>
                                                </span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                        <p class="hmm-card-footer">
                            <a href="<?php echo admin_url('admin.php?page=woocommerce-products'); ?>" class="button">Quản lý sản phẩm</a>
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Top nhà cung cấp -->
            <div class="hmm-column hmm-column-half">
                <div class="hmm-card">
                    <div class="hmm-card-header">
                        <h2><span class="dashicons dashicons-groups"></span> Nhà cung cấp hàng đầu</h2>
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
                                                    echo format_money($supplier['total_amount']) . ' ₫';
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
        
        <!-- Nhập hàng và trả hàng gần đây -->
        <div class="hmm-row">
            <div class="hmm-column hmm-column-half">
                <div class="hmm-card">
                    <div class="hmm-card-header">
                        <h2><span class="dashicons dashicons-cart"></span> Nhập hàng gần đây</h2>
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
                                            <td><?php echo format_money($receipt['total_amount']); ?> ₫</td>
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
                        <h2><span class="dashicons dashicons-undo"></span> Trả hàng gần đây</h2>
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
                                            <td><?php echo format_money($return['total_amount']); ?> ₫</td>
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
    </div>
</div>
