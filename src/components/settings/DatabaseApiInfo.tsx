
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";
import { fetchCustomAPI, fetchDatabaseTable } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertCircle, ShieldCheck, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DbTable {
  table_name: string;
  row_count: number;
}

export default function DatabaseApiInfo() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{status: 'pending'|'success'|'error', message?: string}>({
    status: 'pending'
  });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [loadingTableData, setLoadingTableData] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await fetchCustomAPI('/hmm/v1/status', { suppressToast: true });
        setAuthStatus({
          status: 'success',
          message: 'Xác thực thành công với Database API'
        });
      } catch (err) {
        console.error('Error checking database API auth status:', err);
        let errorMessage = 'Không thể xác thực với Database API';
        if (err instanceof Error) {
          if (err.message.includes('401')) {
            errorMessage = 'Lỗi xác thực (401): Thông tin xác thực không hợp lệ';
          } else if (err.message.includes('404')) {
            errorMessage = 'Lỗi 404: Endpoint không tồn tại, kiểm tra plugin HMM Database API';
          }
        }
        setAuthStatus({
          status: 'error',
          message: errorMessage
        });
      }
    };

    const fetchTables = async () => {
      try {
        const data = await fetchCustomAPI('/hmm/v1/tables', { suppressToast: true });
        if (data && Array.isArray(data.tables)) {
          setTables(data.tables.map(table => ({
            table_name: table.name,
            row_count: table.rows
          })));
        } else {
          setTables([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching database tables:', err);
        let errorMessage = 'Không thể kết nối đến Database API.';
        if (err instanceof Error) {
          if (err.message.includes('401')) {
            errorMessage = 'Lỗi xác thực (401): Vui lòng kiểm tra tên người dùng và mật khẩu';
          } else if (err.message.includes('404')) {
            errorMessage = 'Lỗi 404: Plugin HMM Database API có thể chưa được kích hoạt';
          } else {
            errorMessage += ' ' + err.message;
          }
        }
        setError(errorMessage);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    fetchTables();
  }, []);

  const fetchTableData = async (tableName: string) => {
    setLoadingTableData(true);
    setTableData(null);
    setTableError(null);
    setSelectedTable(tableName);

    try {
      const tableNameWithoutPrefix = tableName.replace('wp_hmm_', '');
      const result = await fetchDatabaseTable(tableNameWithoutPrefix, { suppressToast: true });
      if (result && result.data && Array.isArray(result.data)) {
        setTableData(result.data.slice(0, 5)); // Show only first 5 items
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error(`Error fetching data from table ${tableName}:`, err);
      let errorMessage = `Không thể truy xuất dữ liệu từ bảng ${tableName}.`;
      if (err instanceof Error) {
        errorMessage += ' ' + err.message;
      }
      setTableError(errorMessage);
    } finally {
      setLoadingTableData(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>HMM Database API</CardTitle>
        <Badge variant={authStatus.status === 'success' ? 'default' : 'destructive'}>
          {authStatus.status === 'success' ? 'Đã xác thực' : 'Chưa xác thực'}
        </Badge>
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

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Trạng thái xác thực</h3>
          <Alert variant={authStatus.status === 'success' ? 'default' : 'destructive'}>
            {authStatus.status === 'success' ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {authStatus.message || 'Đang kiểm tra trạng thái xác thực...'}
            </AlertDescription>
          </Alert>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">API Endpoint cơ bản</h3>
          <code className="block bg-gray-100 p-2 rounded">
            https://hmm.vn/wp-json/hmm/v1/status
          </code>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Xác thực API</h3>
          <p className="mb-2">
            API này sử dụng Basic Authentication với tên người dùng WordPress và Application Password. 
            Đảm bảo bạn đã cấu hình đúng trong phần "Thông tin xác thực API".
          </p>
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
                <TableCell>Lấy cấu trúc và dữ liệu của bảng cụ thể</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">/hmm/v1/query</TableCell>
                <TableCell>POST</TableCell>
                <TableCell>Thực hiện truy vấn SQL (chỉ SELECT)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">Đang tải thông tin bảng...</div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi kết nối</AlertTitle>
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                <strong>Hướng dẫn khắc phục:</strong>
                <ul className="list-disc pl-5">
                  <li>Kiểm tra thông tin đăng nhập trong tab "Thông tin xác thực API"</li>
                  <li>Đảm bảo plugin HMM Database API đã được kích hoạt trong WordPress</li>
                  <li>Kiểm tra Application Password đã được tạo trong WordPress</li>
                  <li>Đăng nhập lại vào WordPress và thử lại</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-2">Các bảng trong database</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên bảng</TableHead>
                  <TableHead>Số dòng</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Không tìm thấy bảng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  tables.filter(table => table.table_name.includes('wp_hmm_')).map(table => (
                    <TableRow key={table.table_name}>
                      <TableCell className="font-mono">{table.table_name}</TableCell>
                      <TableCell>{table.row_count}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fetchTableData(table.table_name)}
                          disabled={loadingTableData && selectedTable === table.table_name}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Xem dữ liệu
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {selectedTable && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">
                  Dữ liệu từ bảng <span className="font-mono">{selectedTable}</span>
                </h3>
                
                {loadingTableData ? (
                  <div className="flex justify-center py-4">Đang tải dữ liệu...</div>
                ) : tableError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{tableError}</AlertDescription>
                  </Alert>
                ) : tableData && tableData.length > 0 ? (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(tableData[0]).map(key => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, i) => (
                              <TableCell key={i}>{value === null ? 'NULL' : String(value)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {tableData.length > 0 && <div className="p-2 text-center text-sm text-muted-foreground">Hiển thị 5 dòng đầu tiên</div>}
                  </div>
                ) : (
                  <div className="flex justify-center py-4 border rounded-md">Không có dữ liệu trong bảng</div>
                )}
              </div>
            )}
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
