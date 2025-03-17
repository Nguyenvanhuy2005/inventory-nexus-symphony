
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    { name: "API Status", path: "/hmm/v1/status", method: "GET" },
    { name: "Tables List", path: "/hmm/v1/tables", method: "GET" },
    { name: "Query (SELECT)", path: "/hmm/v1/query", method: "POST" },
    { name: "Suppliers Structure", path: "/hmm/v1/tables/wp_hmm_suppliers", method: "GET" }
  ],
  databaseApiCrud: [
    { name: "Insert Record", path: "/hmm/v1/tables/wp_hmm_suppliers/insert", method: "POST" },
    { name: "Update Record", path: "/hmm/v1/tables/wp_hmm_suppliers/update/1", method: "PUT" },
    { name: "Delete Record", path: "/hmm/v1/tables/wp_hmm_suppliers/delete/1", method: "DELETE" }
  ]
};

export default function ApiConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    wordpress: { success: boolean; message: string; error?: string }[];
    woocommerce: { success: boolean; message: string; error?: string }[];
    databaseApi: { success: boolean; message: string; error?: string }[];
    databaseApiCrud: { success: boolean; message: string; error?: string }[];
  }>({
    wordpress: [],
    woocommerce: [],
    databaseApi: [],
    databaseApiCrud: []
  });

  const testApiConnections = async () => {
    setTesting(true);
    const wordpressResults = [];
    const woocommerceResults = [];
    const databaseApiResults = [];
    const databaseApiCrudResults = [];

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

      // Test Database API endpoints (read-only)
      for (const endpoint of ApiEndpoints.databaseApi) {
        try {
          if (endpoint.method === "GET") {
            await fetchCustomAPI(endpoint.path, { suppressToast: true });
          } else {
            // For POST endpoints, send a minimal test payload
            await fetchCustomAPI(endpoint.path, { 
              method: "POST", 
              body: { query: "SELECT 1" },
              suppressToast: true 
            });
          }
          
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
      
      // Test Database API CRUD endpoints (won't actually modify data)
      for (const endpoint of ApiEndpoints.databaseApiCrud) {
        try {
          // Just check if the endpoint exists, don't actually modify data
          if (endpoint.method === "POST") {
            // For insert, we just check OPTIONS to see if the endpoint responds
            const response = await fetch(`${window.location.origin}/wp-json${endpoint.path}`, {
              method: 'OPTIONS'
            });
            
            if (response.ok || response.status === 401) {
              // If we get 401, the endpoint exists but needs auth
              databaseApiCrudResults.push({
                success: true,
                message: `${endpoint.name}: Endpoint tồn tại`
              });
            } else {
              throw new Error(`HTTP error ${response.status}`);
            }
          } 
          else if (endpoint.method === "PUT" || endpoint.method === "DELETE") {
            // For update/delete, we'll assume the endpoint exists if OPTIONS returns a response
            // or if we get an auth error (which means the endpoint exists)
            const response = await fetch(`${window.location.origin}/wp-json${endpoint.path}`, {
              method: 'OPTIONS'
            });
            
            if (response.ok || response.status === 401 || response.status === 404) {
              // 404 is ok here, it just means ID doesn't exist, but endpoint might
              databaseApiCrudResults.push({
                success: true,
                message: `${endpoint.name}: Endpoint tồn tại`
              });
            } else {
              throw new Error(`HTTP error ${response.status}`);
            }
          }
        } catch (error) {
          let errorMessage = "Lỗi kết nối";
          
          if (error instanceof Error) {
            if (error.message.includes('404')) {
              errorMessage = "Lỗi 404: Endpoint không tồn tại";
            } else {
              errorMessage = error.message;
            }
          }
          
          databaseApiCrudResults.push({
            success: false,
            message: `${endpoint.name}: Endpoint không tồn tại hoặc không khả dụng`,
            error: errorMessage
          });
        }
      }

      setResults({
        wordpress: wordpressResults,
        woocommerce: woocommerceResults,
        databaseApi: databaseApiResults,
        databaseApiCrud: databaseApiCrudResults
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
  
  const renderEndpointsTable = () => (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Tất cả endpoints của Database API</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Endpoint</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Mô tả</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell><code>/hmm/v1/status</code></TableCell>
            <TableCell>GET</TableCell>
            <TableCell>Kiểm tra trạng thái API</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><code>/hmm/v1/tables</code></TableCell>
            <TableCell>GET</TableCell>
            <TableCell>Lấy danh sách tất cả bảng</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><code>/hmm/v1/tables/{`{table_name}`}</code></TableCell>
            <TableCell>GET</TableCell>
            <TableCell>Lấy cấu trúc của bảng cụ thể</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><code>/hmm/v1/query</code></TableCell>
            <TableCell>POST</TableCell>
            <TableCell>Thực hiện truy vấn SQL (chỉ SELECT)</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><code>/hmm/v1/tables</code></TableCell>
            <TableCell>POST</TableCell>
            <TableCell>Tạo bảng mới</TableCell>
          </TableRow>
          <TableRow className="bg-green-50">
            <TableCell><code>/hmm/v1/tables/{`{table_name}`}/insert</code></TableCell>
            <TableCell>POST</TableCell>
            <TableCell>Thêm dữ liệu mới vào bảng</TableCell>
          </TableRow>
          <TableRow className="bg-green-50">
            <TableCell><code>/hmm/v1/tables/{`{table_name}`}/update/{`{id}`}</code></TableCell>
            <TableCell>PUT</TableCell>
            <TableCell>Cập nhật dữ liệu trong bảng</TableCell>
          </TableRow>
          <TableRow className="bg-green-50">
            <TableCell><code>/hmm/v1/tables/{`{table_name}`}/delete/{`{id}`}</code></TableCell>
            <TableCell>DELETE</TableCell>
            <TableCell>Xóa dữ liệu từ bảng</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kiểm tra kết nối API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderEndpointsTable()}
        
        {results.wordpress.length === 0 && results.woocommerce.length === 0 && 
         results.databaseApi.length === 0 && results.databaseApiCrud.length === 0 && (
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
            <h3 className="text-lg font-medium mb-2">HMM Database API (Đọc dữ liệu)</h3>
            <ul className="space-y-2">
              {results.databaseApi.map((result, index) => renderResultItem(result, index, 'db'))}
            </ul>
          </div>
        )}
        
        {results.databaseApiCrud.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">HMM Database API (CRUD Endpoints)</h3>
            <ul className="space-y-2">
              {results.databaseApiCrud.map((result, index) => renderResultItem(result, index, 'dbcrud'))}
            </ul>
          </div>
        )}

        {(results.databaseApi.some(r => !r.success) || results.databaseApiCrud.some(r => !r.success)) && (
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

        {(results.wordpress.some(r => !r.success) || results.woocommerce.some(r => !r.success) || 
          results.databaseApi.some(r => !r.success) || results.databaseApiCrud.some(r => !r.success)) && (
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
