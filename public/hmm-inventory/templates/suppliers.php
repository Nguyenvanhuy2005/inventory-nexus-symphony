
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Quản lý nhà cung cấp</h1>
    
    <div class="hmm-tabs">
        <div class="hmm-tab-nav">
            <button class="hmm-tab-link active" data-tab="list">Danh sách nhà cung cấp</button>
            <button class="hmm-tab-link" data-tab="create">Tạo mới</button>
        </div>
        
        <div class="hmm-tab-content active" id="list-tab">
            <!-- Supplier list will be loaded here -->
            <p>Placeholder for supplier list</p>
        </div>
        
        <div class="hmm-tab-content" id="create-tab">
            <!-- Create supplier form will be here -->
            <p>Placeholder for create supplier form</p>
        </div>
    </div>
</div>
