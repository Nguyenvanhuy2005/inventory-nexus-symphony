
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckAPIStatus } from "@/hooks/api-hooks";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function DatabaseApiInfo() {
  const { toast } = useToast();
  const apiStatus = useCheckAPIStatus();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiStatus.refetch();
      toast({
        title: "Làm mới thành công",
        description: "Thông tin trạng thái API đã được cập nhật.",
      });
    } catch (error) {
      toast({
        title: "Làm mới thất bại",
        description: "Không thể cập nhật thông tin API.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const apiTables = apiStatus.data?.databaseApi?.tables || [];
  const isApiAuthenticated = apiStatus.data?.databaseApi?.isAuthenticated || false;
  const apiVersion = apiStatus.data?.databaseApi?.version || 'Unknown';
  const apiError = apiStatus.data?.databaseApi?.error || null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>HMM API Bridge Status</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Trạng thái kết nối và thông tin HMM API Bridge Plugin
              </CardDescription>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || apiStatus.isLoading}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang làm mới...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Làm mới
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {apiStatus.isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Đang kiểm tra trạng thái API...</span>
            </div>
          ) : apiStatus.isError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lỗi kết nối</AlertTitle>
              <AlertDescription>
                Không thể kết nối đến HMM API Bridge: {apiStatus.error?.message || "Unknown error"}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Trạng thái kết nối</h3>
                    <p className="text-sm text-muted-foreground">
                      Kết nối và xác thực với HMM API Bridge Plugin
                    </p>
                  </div>
                  <div className="flex items-center">
                    {isApiAuthenticated ? (
                      <Badge className="bg-green-500">
                        <Check className="mr-1 h-3 w-3" />
                        Đã kết nối
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="mr-1 h-3 w-3" />
                        Chưa kết nối
                      </Badge>
                    )}
                  </div>
                </div>

                {!isApiAuthenticated && apiError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Lỗi kết nối</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <h3 className="text-lg font-medium">Thông tin Plugin</h3>
                  <div className="mt-2 rounded-md border p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Phiên bản</p>
                        <p className="text-sm text-muted-foreground">{apiVersion}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Số lượng bảng</p>
                        <p className="text-sm text-muted-foreground">{apiTables.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {apiTables.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium">Danh sách bảng HMM</h3>
                    <div className="mt-2 max-h-80 overflow-y-auto rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-2 text-left text-sm font-medium">Tên bảng</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Số bản ghi</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiTables.map((table: any, index: number) => (
                            <tr key={index} className="border-b">
                              <td className="px-4 py-2 text-sm font-mono">{table.name}</td>
                              <td className="px-4 py-2 text-sm">{table.count}</td>
                              <td className="px-4 py-2 text-sm">
                                {table.status === 'active' ? (
                                  <Badge className="bg-green-500">
                                    <Check className="mr-1 h-3 w-3" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    {table.status}
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-md border p-4">
                  <h3 className="font-medium">Hướng dẫn sử dụng HMM API Bridge</h3>
                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    <li>Plugin HMM API Bridge cung cấp REST API endpoints để truy cập database WordPress</li>
                    <li>Đảm bảo plugin đã được kích hoạt trong WordPress Admin → Plugins</li>
                    <li>Kiểm tra quyền người dùng (cần có quyền edit_posts hoặc manage_options)</li>
                    <li>Plugin tự động tạo các bảng cần thiết khi được kích hoạt</li>
                    <li>Hỗ trợ các endpoints: /status, /tables, /query, CRUD operations, /dashboard/stats</li>
                  </ul>
                </div>

                {isApiAuthenticated && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-4">
                    <h3 className="font-medium text-green-800">✅ Kết nối thành công!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      HMM API Bridge đang hoạt động bình thường. Bạn có thể sử dụng tất cả các tính năng của hệ thống.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
