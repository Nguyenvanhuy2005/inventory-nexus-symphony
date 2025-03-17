
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

export default function ApiConnectionGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hướng dẫn kết nối WordPress API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Thông tin quan trọng</AlertTitle>
          <AlertDescription>
            Để kết nối thành công với WordPress API, bạn cần cài đặt plugin Application Passwords và
            cấu hình đúng quyền cho người dùng.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Các bước cấu hình WordPress:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Cài đặt Application Passwords:</strong> Từ WordPress 5.6 trở lên, tính năng này đã được tích hợp sẵn. 
              Nếu bạn dùng phiên bản cũ hơn, hãy cài đặt plugin "Application Passwords".
            </li>
            <li>
              <strong>Tạo mật khẩu ứng dụng:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Vào WordPress Admin → Users → Your Profile</li>
                <li>Cuộn xuống phần "Application Passwords"</li>
                <li>Đặt tên cho ứng dụng (ví dụ: "HMM Inventory")</li>
                <li>Nhấn "Add New Application Password"</li>
                <li>Sao chép mật khẩu được tạo (lưu ý rằng nó chỉ hiện một lần)</li>
              </ul>
            </li>
            <li>
              <strong>Đảm bảo REST API đã được bật:</strong> Kiểm tra trong Settings → Permalinks để đảm bảo rằng bạn không sử dụng cấu trúc permalink Plain.
            </li>
            <li>
              <strong>Kiểm tra quyền người dùng:</strong> Đảm bảo người dùng có vai trò Administrator hoặc có đủ quyền truy cập API endpoints cần thiết.
            </li>
          </ol>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Các bước cấu hình WooCommerce API:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Tạo API keys:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Vào WooCommerce → Settings → Advanced → REST API</li>
                <li>Nhấn "Add Key"</li>
                <li>Đặt mô tả cho key (ví dụ: "HMM Inventory")</li>
                <li>Chọn người dùng (nên là Administrator)</li>
                <li>Chọn quyền "Read/Write"</li>
                <li>Nhấn "Generate API Key"</li>
                <li>Sao chép Consumer Key và Consumer Secret</li>
              </ul>
            </li>
          </ol>
        </div>

        <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Khắc phục sự cố</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Nếu bạn vẫn gặp vấn đề kết nối:</p>
            <ul className="list-disc pl-5">
              <li>Kiểm tra URL website - phải bao gồm http/https</li>
              <li>Kiểm tra tính năng REST API đã được bật</li>
              <li>Kiểm tra cài đặt Permalinks trong WordPress</li>
              <li>Kiểm tra không có plugin security nào đang chặn API requests</li>
              <li>Thử tạo lại Application Password</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
