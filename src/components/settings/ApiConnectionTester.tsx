
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from "@/lib/api-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ApiEndpoints = {
  wordpress: [
    { name: "Users", path: "/users" },
    { name: "Posts", path: "/posts" },
    { name: "Pages", path: "/pages" }
  ],
  woocommerce: [
    { name: "Products", path: "/products" },
    { name: "Orders", path: "/orders" },
    { name: "Customers", path: "/customers" }
  ],
  databaseApi: [
    { name: "API Status", path: "/hmm/v1/status" },
    { name: "Tables List", path: "/hmm/v1/tables" },
    { name: "Suppliers", path: "/hmm/v1/tables/wp_hmm_suppliers" }
  ]
};

export default function ApiConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    wordpress: { success: boolean; message: string; error?: string }[];
    woocommerce: { success: boolean; message: string; error?: string }[];
    databaseApi: { success: boolean; message: string; error?: string }[];
  }>({
    wordpress: [],
    woocommerce: [],
    databaseApi: []
  });

  const testApiConnections = async () => {
    setTesting(true);
    const wordpressResults = [];
    const woocommerceResults = [];
    const databaseApiResults = [];

    try {
      // Test WordPress endpoints
      for (const endpoint of ApiEndpoints.wordpress) {
        try {
          await fetchWordPress(endpoint.path, { suppressToast: true });
          wordpressResults.push({
            success: true,
            message: `${endpoint.name}: Kết nối thành công`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Lỗi kết nối";
          wordpressResults.push({
            success: false,
            message: `${endpoint.name}: Kết nối thất bại`,
            error: errorMessage
          });
        }
      }

      // Test WooCommerce endpoints
      for (const endpoint of ApiEndpoints.woocommerce) {
        try {
          await fetchWooCommerce(endpoint.path, { suppressToast: true });
          woocommerceResults.push({
            success: true,
            message: `${endpoint.name}: Kết nối thành công`
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Lỗi kết nối";
          woocommerceResults.push({
            success: false,
            message: `${endpoint.name}: Kết nối thất bại`,
            error: errorMessage
          });
        }
      }

      // Test Database API endpoints
      for (const endpoint of ApiEndpoints.databaseApi) {
        try {
          await fetchCustomAPI(endpoint.path, { suppressToast: true });
          databaseApiResults.push({
            success: true,
            message: `${endpoint.name}: Kết nối thành công`
          });
        } catch (error) {
          let errorMessage = "Lỗi kết nối";
          
          if (error instanceof Error) {
            // Enhance error messages for common issues
            if (error.message.includes('401')) {
              errorMessage = "Lỗi xác thực (401): Thông tin đăng nhập không hợp lệ";
            } else if (error.message.includes('404')) {
              errorMessage = "Lỗi 404: Plugin HMM Database API có thể chưa được kích hoạt";
            } else {
              errorMessage = error.message;
            }
          }
          
          databaseApiResults.push({
            success: false,
            message: `${endpoint.name}: Kết nối thất bại`,
            error: errorMessage
          });
        }
      }

      setResults({
        wordpress: wordpressResults,
        woocommerce: woocommerceResults,
        databaseApi: databaseApiResults
      });

      toast.success("Đã hoàn thành kiểm tra kết nối API");
    } catch (error) {
      toast.error("Lỗi khi kiểm tra kết nối API");
      console.error("API connection test error:", error);
    } finally {
      setTesting(false);
    }
  };

  const renderResultItem = (result, index, prefix) => (
    <li key={`${prefix}-${index}`} className="flex items-start gap-2">
      {result.success ? (
        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
      )}
      <div className="flex flex-col">
        <span>{result.message}</span>
        {result.error && (
          <span className="text-sm text-red-500">{result.error}</span>
        )}
      </div>
    </li>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kiểm tra kết nối API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.wordpress.length === 0 && results.woocommerce.length === 0 && results.databaseApi.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            Nhấn nút "Kiểm tra kết nối API" để xem tình trạng kết nối với các API.
          </div>
        )}

        {results.wordpress.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">WordPress API</h3>
            <ul className="space-y-2">
              {results.wordpress.map((result, index) => renderResultItem(result, index, 'wp'))}
            </ul>
          </div>
        )}

        {results.woocommerce.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">WooCommerce API</h3>
            <ul className="space-y-2">
              {results.woocommerce.map((result, index) => renderResultItem(result, index, 'woo'))}
            </ul>
          </div>
        )}
        
        {results.databaseApi.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">HMM Database API</h3>
            <ul className="space-y-2">
              {results.databaseApi.map((result, index) => renderResultItem(result, index, 'db'))}
            </ul>

            {results.databaseApi.some(r => !r.success) && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nếu bạn thấy lỗi "401" hoặc "Unauthorized", hãy kiểm tra xác thực WordPress và đảm bảo rằng:
                  <ol className="list-decimal ml-5 mt-2">
                    <li>Plugin HMM Database API đã được kích hoạt</li>
                    <li>Bạn đã đăng nhập vào WordPress với tên người dùng và mật khẩu đúng</li>
                    <li>Bạn đã tạo Application Password trong WordPress</li>
                    <li>Thông tin xác thực đã được nhập chính xác trong tab "Thông tin xác thực API"</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {(results.wordpress.some(r => !r.success) || results.woocommerce.some(r => !r.success) || results.databaseApi.some(r => !r.success)) && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Một số kết nối không thành công. Kiểm tra cài đặt xác thực API và đảm bảo rằng các plugin WordPress đã được kích hoạt đúng cách.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testApiConnections} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang kiểm tra kết nối...
            </>
          ) : (
            "Kiểm tra kết nối API"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
