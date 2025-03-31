
<?php
// Đảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1>Cài đặt</h1>
    
    <form method="post" action="options.php">
        <?php
        // Output security fields for the registered setting
        settings_fields('hmm-inventory-settings');
        // Output setting sections and their fields
        do_settings_sections('hmm-inventory-settings');
        // Output save settings button
        submit_button('Lưu cài đặt');
        ?>
    </form>
</div>
