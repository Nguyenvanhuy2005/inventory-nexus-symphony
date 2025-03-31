
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý trả hàng</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách phiếu trả</button>
            <button class="hmm-tab-link" data-tab="create">Tạo phiếu trả</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <!-- Returns list will be loaded here -->
            <p>Placeholder for returns list</p>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <!-- Create return form will be here -->
            <p>Placeholder for create return form</p>
        </div>
    </div>
</div>
