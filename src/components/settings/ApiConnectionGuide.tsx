
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function ApiConnectionGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn kết nối API</CardTitle>
          <CardDescription>
            Hướng dẫn chi tiết cách thiết lập kết nối API cho ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tổng quan</h3>
            <p className="text-sm text-muted-foreground">
              Ứng dụng này kết nối với WordPress thông qua 3 API chính:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li><strong>WordPress REST API</strong>: Truy cập thông tin người dùng, bài viết, và dữ liệu WordPress core.</li>
              <li><strong>WooCommerce REST API</strong>: Quản lý sản phẩm, đơn hàng, khách hàng và các chức năng thương mại điện tử.</li>
              <li><strong>HMM Core API</strong>: Plugin tùy chỉnh để truy cập cơ sở dữ liệu, quản lý tệp tin, và thực hiện các chức năng kinh doanh.</li>
            </ol>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Quan trọng</AlertTitle>
            <AlertDescription>
              Từ phiên bản mới nhất, chúng tôi đã hợp nhất 3 plugin API riêng biệt thành một plugin duy nhất có tên <strong>HMM Core API</strong> để dễ dàng quản lý và nâng cao hiệu suất.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Cài đặt HMM Core API</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Tải lên thư mục plugin <code>hmm-core-api</code> vào thư mục <code>/wp-content/plugins/</code> trên máy chủ WordPress của bạn.</li>
              <li>Truy cập trang Quản trị WordPress → Plugins → Đã cài đặt.</li>
              <li>Kích hoạt plugin <strong>HMM Core API</strong>.</li>
              <li>Sau khi kích hoạt, plugin sẽ tự động tạo tất cả các bảng cần thiết trong cơ sở dữ liệu.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tạo Application Password WordPress</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Đăng nhập vào trang Quản trị WordPress.</li>
              <li>Truy cập <strong>Users (Người dùng) → Profile (Hồ sơ) → Application Passwords</strong>.</li>
              <li>Nhập tên ứng dụng (ví dụ: "HMM Inventory") và nhấp vào "Add New Application Password".</li>
              <li>Sao chép mật khẩu được tạo ra và dán vào trường "WordPress Application Password" trong trang Cài đặt của ứng dụng này.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tạo API Keys cho WooCommerce</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Truy cập trang Quản trị WordPress → WooCommerce → Settings → Advanced → REST API.</li>
              <li>Nhấp vào "Add key" và điền thông tin sau:
                <ul className="list-disc pl-5 mt-2">
                  <li>Description: HMM Inventory</li>
                  <li>User: Chọn người dùng quản trị</li>
                  <li>Permissions: Read/Write</li>
                </ul>
              </li>
              <li>Nhấp vào "Generate API key".</li>
              <li>Sao chép Consumer Key và Consumer Secret vào các trường tương ứng trong trang Cài đặt của ứng dụng này.</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Kiểm tra CORS</h3>
            <p className="text-sm text-muted-foreground">
              Nếu bạn gặp lỗi CORS, hãy thêm đoạn mã sau vào file <code>.htaccess</code> trên máy chủ WordPress:
            </p>
            <pre className="rounded-md bg-muted p-4 overflow-x-auto text-xs">
              {`# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
  Header set Access-Control-Allow-Credentials "true"
  
  # Handle OPTIONS preflight requests
  RewriteEngine On
  RewriteCond %{REQUEST_METHOD} OPTIONS
  RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>`}
            </pre>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Khắc phục sự cố</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Lỗi 401 Unauthorized</strong>: Kiểm tra lại tên người dùng và mật khẩu ứng dụng.</li>
              <li><strong>Lỗi 403 Forbidden</strong>: Người dùng không có đủ quyền, đảm bảo người dùng có quyền edit_posts hoặc manage_options.</li>
              <li><strong>Lỗi 404 Not Found</strong>: Kiểm tra URL API hoặc plugin chưa được kích hoạt.</li>
              <li><strong>Lỗi CORS</strong>: Kiểm tra cấu hình CORS trên máy chủ.</li>
              <li><strong>Timeout</strong>: Máy chủ mất nhiều thời gian để phản hồi, kiểm tra hiệu suất máy chủ.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
