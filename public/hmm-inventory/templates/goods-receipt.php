
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý nhập hàng</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách phiếu nhập</button>
            <button class="hmm-tab-link" data-tab="create">Tạo phiếu nhập</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <!-- Goods receipt list will be loaded here -->
            <p>Placeholder for goods receipt list</p>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <!-- Create goods receipt form will be here -->
            <p>Placeholder for create goods receipt form</p>
        </div>
    </div>
</div>
