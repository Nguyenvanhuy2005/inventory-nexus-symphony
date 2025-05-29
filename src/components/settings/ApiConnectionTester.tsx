
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api/base-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";

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
  hmmApiBridge: [
    { name: "API Status", path: "/hmm/v1/status", method: "GET" },
    { name: "Tables List", path: "/hmm/v1/tables", method: "GET" },
    { name: "Dashboard Stats", path: "/hmm/v1/dashboard/stats", method: "GET" },
    { name: "Query Test", path: "/hmm/v1/query", method: "POST" }
  ],
  hmmApiCrud: [
    { name: "Insert Test", path: "/hmm/v1/tables/wp_hmm_suppliers/insert", method: "POST" },
    { name: "Update Test", path: "/hmm/v1/tables/wp_hmm_suppliers/update/1", method: "PUT" },
    { name: "Delete Test", path: "/hmm/v1/tables/wp_hmm_suppliers/delete/1", method: "DELETE" }
  ]
};

export default function ApiConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [forceClearingCache, setForceClearingCache] = useState(false);
  const queryClient = useQueryClient();
  const [results, setResults] = useState<{
    wordpress: { success: boolean; message: string; error?: string }[];
    woocommerce: { success: boolean; message: string; error?: string }[];
    hmmApiBridge: { success: boolean; message: string; error?: string }[];
    hmmApiCrud: { success: boolean; message: string; error?: string }[];
  }>({
    wordpress: [],
    woocommerce: [],
    hmmApiBridge: [],
    hmmApiCrud: []
  });

  const testApiConnections = async (useCache = true) => {
    setTesting(true);
    const wordpressResults = [];
    const woocommerceResults = [];
    const hmmApiBridgeResults = [];
    const hmmApiCrudResults = [];

    try {
      // Test WordPress endpoints
      for (const endpoint of ApiEndpoints.wordpress) {
        try {
          const cacheParam = !useCache ? `?_=${Date.now()}` : '';
          await fetchWordPress(endpoint.path + cacheParam, { suppressToast: true });
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
          const cacheParam = !useCache ? `?_=${Date.now()}` : '';
          await fetchWooCommerce(endpoint.path + cacheParam, { suppressToast: true });
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

      // Test HMM API Bridge endpoints
      for (const endpoint of ApiEndpoints.hmmApiBridge) {
        try {
          if (endpoint.method === "GET") {
            const cacheParam = !useCache ? `?_=${Date.now()}` : '';
            await fetchCustomAPI(endpoint.path + cacheParam, { suppressToast: true });
          } else if (endpoint.method === "POST") {
            // For query endpoint, send a test query
            await fetchCustomAPI(endpoint.path, { 
              method: "POST", 
              body: { query: "SELECT 1 as test" },
              suppressToast: true,
              cache: useCache ? 'default' : 'no-cache'
            });
          }
          
          hmmApiBridgeResults.push({
            success: true,
            message: `${endpoint.name}: Kết nối thành công`
          });
        } catch (error) {
          let errorMessage = "Lỗi kết nối";
          
          if (error instanceof Error) {
            if (error.message.includes('401')) {
              errorMessage = "Lỗi xác thực (401): Kiểm tra thông tin đăng nhập WordPress";
            } else if (error.message.includes('404')) {
              errorMessage = "Lỗi 404: Plugin HMM API Bridge chưa được kích hoạt";
            } else if (error.message.includes('403')) {
              errorMessage = "Lỗi 403: Không đủ quyền truy cập";
            } else {
              errorMessage = error.message;
            }
          }
          
          hmmApiBridgeResults.push({
            success: false,
            message: `${endpoint.name}: Kết nối thất bại`,
            error: errorMessage
          });
        }
      }
      
      // Test HMM API Bridge CRUD endpoints (OPTIONS only, don't modify data)
      for (const endpoint of ApiEndpoints.hmmApiCrud) {
        try {
          const cacheParam = !useCache ? `?_=${Date.now()}` : '';
          const url = `${API_BASE_URL}${endpoint.path}${cacheParam}`;
          const response = await fetch(url, {
            method: 'OPTIONS',
            cache: useCache ? 'default' : 'no-cache'
          });
          
          if (response.ok || response.status === 401) {
            hmmApiCrudResults.push({
              success: true,
              message: `${endpoint.name}: Endpoint khả dụng`
            });
          } else {
            throw new Error(`HTTP error ${response.status}`);
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
          
          hmmApiCrudResults.push({
            success: false,
            message: `${endpoint.name}: Endpoint không khả dụng`,
            error: errorMessage
          });
        }
      }

      setResults({
        wordpress: wordpressResults,
        woocommerce: woocommerceResults,
        hmmApiBridge: hmmApiBridgeResults,
        hmmApiCrud: hmmApiCrudResults
      });

      toast.success("Đã hoàn thành kiểm tra kết nối API");
    } catch (error) {
      toast.error("Lỗi khi kiểm tra kết nối API");
      console.error("API connection test error:", error);
    } finally {
      setTesting(false);
    }
  };

  const forceRefreshCache = async () => {
    try {
      setForceClearingCache(true);
      queryClient.clear();
      await testApiConnections(false);
      toast.success("Đã xóa cache và làm mới kết nối API thành công");
    } catch (error) {
      toast.error("Lỗi khi làm mới kết nối API");
      console.error("Error during force refresh:", error);
    } finally {
      setForceClearingCache(false);
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
        {results.wordpress.length === 0 && results.woocommerce.length === 0 && 
         results.hmmApiBridge.length === 0 && results.hmmApiCrud.length === 0 && (
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
        
        {results.hmmApiBridge.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">HMM API Bridge (Đọc dữ liệu)</h3>
            <ul className="space-y-2">
              {results.hmmApiBridge.map((result, index) => renderResultItem(result, index, 'hmm'))}
            </ul>
          </div>
        )}
        
        {results.hmmApiCrud.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">HMM API Bridge (CRUD Endpoints)</h3>
            <ul className="space-y-2">
              {results.hmmApiCrud.map((result, index) => renderResultItem(result, index, 'hmmcrud'))}
            </ul>
          </div>
        )}

        {(results.hmmApiBridge.some(r => !r.success) || results.hmmApiCrud.some(r => !r.success)) && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nếu bạn thấy lỗi kết nối HMM API Bridge, hãy kiểm tra:
              <ol className="list-decimal ml-5 mt-2">
                <li>Plugin HMM API Bridge đã được kích hoạt trong WordPress</li>
                <li>Thông tin WordPress Username và Application Password chính xác</li>
                <li>Người dùng có quyền edit_posts hoặc manage_options</li>
                <li>Plugin đã tự động tạo các bảng cần thiết</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Button onClick={() => testApiConnections()} disabled={testing || forceClearingCache} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang kiểm tra kết nối...
            </>
          ) : (
            "Kiểm tra kết nối API"
          )}
        </Button>
        <Button 
          onClick={forceRefreshCache} 
          variant="outline" 
          disabled={testing || forceClearingCache} 
          className="w-full"
        >
          {forceClearingCache ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang làm mới...
            </>
          ) : (
            "Làm mới hoàn toàn (xóa cache)"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
