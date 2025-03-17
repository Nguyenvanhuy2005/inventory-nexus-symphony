
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { fetchCustomAPI } from "@/lib/api-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface DbTable {
  table_name: string;
  row_count: number;
}

export default function DatabaseApiInfo() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await fetchCustomAPI('/hmm/v1/tables', { suppressToast: true });
        if (data && Array.isArray(data.tables)) {
          setTables(data.tables);
        } else {
          setTables([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching database tables:', err);
        setError('Không thể kết nối đến Database API. Vui lòng kiểm tra cài đặt plugin.');
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>HMM Database API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Thông tin API</AlertTitle>
          <AlertDescription>
            HMM Database API cung cấp các endpoints để truy cập và quản lý dữ liệu trong database WordPress.
            Sử dụng API này để đồng bộ dữ liệu giữa ứng dụng và WordPress database.
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="text-lg font-medium mb-2">API Endpoint cơ bản</h3>
          <code className="block bg-gray-100 p-2 rounded">
            https://hmm.vn/wp-json/hmm/v1/status
          </code>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Các endpoints có sẵn</h3>
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
                <TableCell className="font-mono">/hmm/v1/status</TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Kiểm tra trạng thái API</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">/hmm/v1/tables</TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Lấy danh sách tất cả bảng</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">/hmm/v1/tables/{'{table_name}'}</TableCell>
                <TableCell>GET</TableCell>
                <TableCell>Lấy cấu trúc của bảng cụ thể</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">/hmm/v1/query</TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Thực hiện truy vấn SQL (chỉ SELECT)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">/hmm/v1/tables</TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Tạo bảng mới</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">Đang tải thông tin bảng...</div>
        ) : error ? (
          <Alert className="bg-red-50 text-red-800 border-red-200">
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-2">Các bảng trong database</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên bảng</TableHead>
                  <TableHead>Số dòng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      Không tìm thấy bảng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  tables.filter(table => table.table_name.includes('wp_hmm_')).map(table => (
                    <TableRow key={table.table_name}>
                      <TableCell className="font-mono">{table.table_name}</TableCell>
                      <TableCell>{table.row_count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="text-sm text-muted-foreground pt-2">
          <p>
            Sử dụng fetch API endpoint với đường dẫn <code>/hmm/v1/tables/{'<tên_bảng>'}</code> để 
            truy xuất dữ liệu từ một bảng cụ thể, ví dụ: <code>/hmm/v1/tables/wp_hmm_suppliers</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
