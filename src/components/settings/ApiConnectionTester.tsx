
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from "@/lib/api-utils";

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
    { name: "API Status", path: "/status" },
    { name: "Tables List", path: "/tables" },
    { name: "Suppliers", path: "/tables/wp_hmm_suppliers" }
  ]
};

export default function ApiConnectionTester() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    wordpress: { success: boolean; message: string }[];
    woocommerce: { success: boolean; message: string }[];
    databaseApi: { success: boolean; message: string }[];
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
          wordpressResults.push({
            success: false,
            message: `${endpoint.name}: ${error instanceof Error ? error.message : "Lỗi kết nối"}`
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
          woocommerceResults.push({
            success: false,
            message: `${endpoint.name}: ${error instanceof Error ? error.message : "Lỗi kết nối"}`
          });
        }
      }

      // Test Database API endpoints
      for (const endpoint of ApiEndpoints.databaseApi) {
        try {
          await fetchCustomAPI(`/hmm/v1${endpoint.path}`, { suppressToast: true });
          databaseApiResults.push({
            success: true,
            message: `${endpoint.name}: Kết nối thành công`
          });
        } catch (error) {
          databaseApiResults.push({
            success: false,
            message: `${endpoint.name}: ${error instanceof Error ? error.message : "Lỗi kết nối"}`
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kiểm tra kết nối API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.wordpress.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">WordPress API</h3>
            <ul className="space-y-2">
              {results.wordpress.map((result, index) => (
                <li key={`wp-${index}`} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{result.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {results.woocommerce.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">WooCommerce API</h3>
            <ul className="space-y-2">
              {results.woocommerce.map((result, index) => (
                <li key={`woo-${index}`} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{result.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {results.databaseApi.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">HMM Database API</h3>
            <ul className="space-y-2">
              {results.databaseApi.map((result, index) => (
                <li key={`db-${index}`} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{result.message}</span>
                </li>
              ))}
            </ul>
          </div>
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
