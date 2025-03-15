import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI, checkAPIStatus, getWordPressUsers } from "@/lib/api-utils";
import { toast } from "sonner";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  CheckCheck, 
  AlertTriangle,
  User,
  UserCog,
  Lock,
  FileCode,
  ExternalLink,
  Download
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";

const apiSettingsSchema = z.object({
  woocommerce_url: z.string().url("URL không hợp lệ"),
  consumer_key: z.string().min(1, "Consumer key không được để trống"),
  consumer_secret: z.string().min(1, "Consumer secret không được để trống"),
  wp_username: z.string().min(1, "Username không được để trống"),
  application_password: z.string().min(1, "Application password không được để trống")
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

interface Role {
  id: string;
  name: string;
  capabilities: Record<string, boolean>;
}

interface WPUser {
  id: number;
  name: string;
  email?: string;
  roles: string[];
  avatar_urls?: Record<string, string>;
}

export default function Settings() {
  const [apiStatus, setApiStatus] = useState({
    woocommerce: null as boolean | null,
    wordpress: null as boolean | null,
    custom: null as boolean | null
  });
  const [isTesting, setIsTesting] = useState(false);
  const [openPluginInfo, setOpenPluginInfo] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openPluginCode, setOpenPluginCode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<WPUser | null>(null);
  const [detailedStatus, setDetailedStatus] = useState<any>(null);
  const [pluginInstallError, setPluginInstallError] = useState<string | null>(null);

  const { data: wpUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['wordpress-users'],
    queryFn: getWordPressUsers,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const form = useForm<ApiSettingsFormValues>({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      woocommerce_url: "https://hmm.vn/wp-json/wc/v3",
      consumer_key: "ck_bb8635bb0fd810ceb013f1a01423e03a7ddf955a",
      consumer_secret: "cs_d2157fd9d4ef2ae3bcb1690ae4fd7c317c9f4460",
      wp_username: "admin",
      application_password: "w6fl K60U uSgH qrs4 F6gh LDBl"
    }
  });

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('api_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        form.reset(settings);
        
        testConnections();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);
  
  const onSubmit = (data: ApiSettingsFormValues) => {
    console.log("API Settings:", data);
    localStorage.setItem('api_settings', JSON.stringify(data));
    toast.success("Cài đặt API đã được lưu");
    
    setTimeout(() => {
      toast.info("Đang kiểm tra kết nối với cài đặt mới...");
      testConnections();
    }, 1000);
  };
  
  const testConnections = async () => {
    setIsTesting(true);
    setApiStatus({
      woocommerce: null,
      wordpress: null,
      custom: null
    });
    setPluginInstallError(null);
    
    try {
      await fetchWooCommerce('/products?per_page=1', { suppressToast: true });
      setApiStatus(prev => ({ ...prev, woocommerce: true }));
    } catch (error) {
      console.error('WooCommerce API test failed:', error);
      setApiStatus(prev => ({ ...prev, woocommerce: false }));
    }
    
    try {
      await fetchWordPress('/posts?per_page=1', { suppressToast: true });
      setApiStatus(prev => ({ ...prev, wordpress: true }));
    } catch (error) {
      console.error('WordPress API test failed:', error);
      setApiStatus(prev => ({ ...prev, wordpress: false }));
    }
    
    try {
      const statusResult = await checkAPIStatus();
      setApiStatus(prev => ({ ...prev, custom: statusResult.isConnected }));
      setDetailedStatus(statusResult.status);
      
      if (!statusResult.isConnected && statusResult.error) {
        setPluginInstallError(statusResult.error);
      }
    } catch (error) {
      console.error('Custom API test failed:', error);
      setApiStatus(prev => ({ ...prev, custom: false }));
      if (error instanceof Error) {
        setPluginInstallError(error.message);
      }
    }
    
    setIsTesting(false);
  };
  
  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return null;
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const handleEditUser = (user: WPUser) => {
    setSelectedUser(user);
    setOpenUserDialog(true);
  };
  
  const handleDownloadPlugin = () => {
    const link = document.createElement('a');
    link.href = '/hmm-custom-api/hmm-custom-api.php';
    link.download = 'hmm-custom-api.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đang tải xuống file plugin");
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Cài đặt hệ thống" 
        description="Cấu hình hệ thống, quản lý người dùng, tích hợp API"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="api">
          <TabsList>
            <TabsTrigger value="api">Cài đặt API</TabsTrigger>
            <TabsTrigger value="users">Quản lý người dùng</TabsTrigger>
            <TabsTrigger value="system">Cài đặt hệ thống</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="mt-4">
            <div className={`mb-4 p-4 border rounded-md ${apiStatus.custom ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <div className="flex justify-between items-start">
                <h3 className={`font-medium ${apiStatus.custom ? 'text-green-800' : 'text-yellow-800'}`}>
                  Thông tin quan trọng về plugin HMM Custom API
                </h3>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto" 
                    onClick={() => setOpenPluginCode(true)}
                  >
                    <FileCode className="h-4 w-4 text-yellow-800" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto" 
                    onClick={() => setOpenPluginInfo(true)}
                  >
                    <Info className="h-4 w-4 text-yellow-800" />
                  </Button>
                </div>
              </div>
              <p className="text-yellow-700 mt-1">
                Để sử dụng đầy đủ các tính năng của ứng dụng, vui lòng cài đặt plugin HMM Custom API vào website WordPress của bạn. 
                Plugin này tạo các endpoint API tùy chỉnh để truy cập và quản lý dữ liệu.
              </p>
              <p className={`mt-2 font-medium flex items-center ${apiStatus.custom ? 'text-green-600' : 'text-red-600'}`}>
                Trạng thái hiện tại: {
                  apiStatus.custom === true ? (
                    <span className="text-green-600 font-medium inline-flex items-center">
                      <CheckCheck className="h-4 w-4 ml-1 mr-1" /> Đã kết nối thành công
                    </span>
                  ) : apiStatus.custom === false ? (
                    <span className="text-red-600 font-medium inline-flex items-center">
                      <X className="h-4 w-4 ml-1 mr-1" /> Chưa kết nối được
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium inline-flex items-center">
                      <AlertTriangle className="h-4 w-4 ml-1 mr-1" /> Chưa kiểm tra
                    </span>
                  )
                }
              </p>
              
              {pluginInstallError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <div className="font-medium mb-1 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" /> Lỗi phát hiện:
                  </div>
                  <p>{pluginInstallError}</p>
                  <div className="mt-2 text-sm">
                    <strong>Khắc phục:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Đảm bảo plugin đã được cài đặt vào thư mục <code className="bg-white px-1 py-0.5 rounded text-red-700">wp-content/plugins/hmm-custom-api</code></li>
                      <li>Kích hoạt plugin trong trang quản trị WordPress</li>
                      <li>Kiểm tra quyền truy cập tệp và thư mục trong WordPress</li>
                      <li>Xem error logs của WordPress để phát hiện lỗi chi tiết</li>
                    </ul>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button size="sm" variant="outline" onClick={handleDownloadPlugin}>
                      <Download className="mr-1 h-4 w-4" /> Tải plugin
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setOpenPluginInfo(true)}>
                      <Info className="mr-1 h-4 w-4" /> Hướng dẫn cài đặt
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="woocommerce_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WooCommerce API URL</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        {getStatusIcon(apiStatus.woocommerce)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="consumer_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Key</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="consumer_secret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Secret</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="wp_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WordPress Username</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        {getStatusIcon(apiStatus.wordpress)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="application_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col mt-4 border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Custom API: </span>
                    {getStatusIcon(apiStatus.custom)}
                    {apiStatus.custom === false && (
                      <span className="text-sm text-red-500">
                        Plugin chưa được cài đặt hoặc kích hoạt
                      </span>
                    )}
                    {apiStatus.custom === true && (
                      <span className="text-sm text-green-500">
                        Plugin đã được cài đặt và hoạt động tốt
                      </span>
                    )}
                  </div>
                  
                  {detailedStatus && (
                    <div className="text-sm text-gray-600 ml-6">
                      <p>Phiên bản: {detailedStatus.plugin_version}</p>
                      <p>Nhà cung cấp trong DB: {detailedStatus.suppliers_count}</p>
                      <p>Cập nhật lần cuối: {new Date(detailedStatus.timestamp).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={testConnections}
                    disabled={isTesting}
                  >
                    {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                  </Button>
                  <Button type="submit">Lưu cài đặt</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="users" className="mt-4">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <UserCog className="mr-2 h-5 w-5" />
                  Quản lý người dùng hệ thống
                </h3>
              </div>
              
              {apiStatus.wordpress === true ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingUsers ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex justify-center items-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : Array.isArray(wpUsers) && wpUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Không tìm thấy người dùng nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        Array.isArray(wpUsers) && wpUsers.map((user: WPUser) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              {user.avatar_urls?.["48"] ? (
                                <img 
                                  src={user.avatar_urls["48"]} 
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email || "—"}</TableCell>
                            <TableCell>
                              {user.roles?.map(role => (
                                <span 
                                  key={role} 
                                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
                                >
                                  {role === 'administrator' ? 'Quản trị viên' : 
                                   role === 'editor' ? 'Biên tập viên' :
                                   role === 'author' ? 'Tác giả' :
                                   role === 'contributor' ? 'Cộng tác viên' :
                                   role === 'subscriber' ? 'Người đăng ký' : role}
                                </span>
                              ))}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                Phân quyền
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg">
                  <Lock className="h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">Kết nối WordPress API để quản lý người dùng</h3>
                  <p className="text-muted-foreground mt-1 mb-4">
                    Bạn cần kết nối thành công với WordPress API trong tab Cài đặt API để có thể quản lý người dùng
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => document.querySelector('[data-value="api"]')?.dispatchEvent(
                      new MouseEvent('click', { bubbles: true })
                    )}
                  >
                    Đi đến cài đặt API
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="system" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng cài đặt hệ thống sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      <Dialog open={openPluginInfo} onOpenChange={setOpenPluginInfo}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Hướng dẫn cài đặt plugin HMM Custom API</DialogTitle>
            <DialogDescription>
              Plugin này tạo các REST API endpoints để truy cập dữ liệu WordPress từ ứng dụng
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">1. Tải và cài đặt plugin</h4>
              <p className="text-sm mt-2">
                Nhấn vào nút "Tải plugin" bên dưới để tải file plugin về máy của bạn
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2"
                onClick={handleDownloadPlugin}
              >
                <Download className="mr-1 h-4 w-4" /> Tải plugin
              </Button>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">2. Tải plugin lên WordPress</h4>
              <p className="text-sm mt-2">
                <strong>Cách 1:</strong> Tạo thư mục <code className="bg-white px-1 py-0.5 rounded">hmm-custom-api</code> trong <code className="bg-white px-1 py-0.5 rounded">wp-content/plugins/</code> của website WordPress.
                Sau đó tải file <code className="bg-white px-1 py-0.5 rounded">hmm-custom-api.php</code> vào thư mục đó.
              </p>
              <p className="text-sm mt-2">
                <strong>Cách 2:</strong> Đăng nhập vào trang quản trị WordPress, vào phần Plugins &gt; Thêm mới &gt; Tải plugin lên,
                sau đó chọn file hmm-custom-api.php đã tải về.
              </p>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">3. Kích hoạt plugin</h4>
              <p className="text-sm mt-2">
                Đăng nhập vào trang quản trị WordPress, truy cập mục Plugins và kích hoạt plugin "HMM Custom API"
              </p>
              <div className="mt-2">
                <img 
                  src="/lovable-uploads/634a5c0a-f20e-4df5-b916-9f87b3b4c1c6.png" 
                  alt="Plugin trong WordPress" 
                  className="border rounded max-w-full"
                />
              </div>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">4. Kiểm tra kết nối</h4>
              <p className="text-sm mt-2">
                Sau khi kích hoạt, quay lại ứng dụng này và nhấn nút "Kiểm tra kết nối" để xác nhận plugin đã hoạt động
              </p>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">5. Xử lý sự cố</h4>
              <p className="text-sm mt-2">
                Nếu vẫn gặp lỗi sau khi kích hoạt plugin, hãy kiểm tra:
              </p>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li>Plugin đã được kích hoạt thành công trong WordPress</li>
                <li>Các tệp PHP không có lỗi cú pháp</li>
                <li>Xem error log của WordPress</li>
                <li>Cấu hình API trong ứng dụng này được nhập đúng</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setOpenPluginInfo(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openPluginCode} onOpenChange={setOpenPluginCode}>
        <DialogContent className="sm:max-w-[90vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mã nguồn plugin HMM Custom API</DialogTitle>
            <DialogDescription>
              Đây là mã nguồn của plugin, bạn có thể kiểm tra hoặc chỉnh sửa nếu cần
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <h4 className="font-medium">Tệp hmm-custom-api.php</h4>
              <p className="text-sm mt-2">
                Đây là tệp PHP chính của plugin. Bạn có thể tải xuống và cài đặt vào WordPress.
              </p>
              <div className="mt-2 flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadPlugin}
                >
                  <Download className="mr-1 h-4 w-4" /> Tải plugin
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 font-mono text-sm flex justify-between items-center">
                <span>hmm-custom-api.php</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleDownloadPlugin}
                >
                  <Download className="mr-1 h-3 w-3" /> Tải xuống
                </Button>
              </div>
              <pre className="p-4 overflow-x-auto text-xs bg-white">
                <code>{`<?php
/**
 * Plugin Name: HMM Custom API
 * Plugin URI: https://hmm.vn
 * Description: Plugin tạo REST API endpoints tùy chỉnh để truy cập dữ liệu cho ứng dụng React
 * Version: 1.0.1
 * Author: HMM Team
 * Author URI: https://hmm.vn
 * Text Domain: hmm-custom-api
 */

// ��ảm bảo không truy cập trực tiếp
if (!defined('ABSPATH')) {
    exit;
}

// Đăng ký REST API routes
add_action('rest_api_init', 'hmm_register_custom_api_endpoints');

function hmm_register_custom_api_endpoints() {
    // Register status endpoint
    register_rest_route('custom/v1', '/status', array(
        'methods' => 'GET',
        'callback' => 'hmm_api_status',
        'permission_callback' => '__return_true',
    ));

    // Register damaged stock endpoints
    register_rest_route('custom/v1', '/damaged-stock', array(
        'methods' => 'GET',
        'callback' => 'hmm_get_damaged_stock',
        'permission_callback' => 'hmm_api_permissions_check',
    ));
    
    // ... More endpoints registered here
}

// Thêm endpoint kiểm tra trạng thái API
function hmm_api_status() {
    global $wpdb;
    
    // Kiểm tra kết nối cơ sở dữ liệu
    $db_status = !empty($wpdb->last_error) ? false : true;
    
    // Kiểm tra bảng nhà cung cấp
    $suppliers_table = $wpdb->prefix . 'inventory_suppliers';
    $suppliers_exists = $wpdb->get_var("SHOW TABLES LIKE '$suppliers_table'") == $suppliers_table;
    
    // Đếm số nhà cung cấp
    $suppliers_count = $suppliers_exists ? $wpdb->get_var("SELECT COUNT(*) FROM $suppliers_table") : 0;
    
    // Liệt kê tất cả các bảng
    $all_tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
    $tables_list = [];
    foreach($all_tables as $table) {
        $tables_list[] = $table[0];
    }
    
    return [
        'status' => 'active',
        'plugin_version' => '1.0.1',
        'db_connection' => $db_status,
        'suppliers_table_exists' => $suppliers_exists,
        'suppliers_count' => (int)$suppliers_count,
        'tables' => $tables_list,
        'wp_prefix' => $wpdb->prefix,
        'timestamp' => current_time('mysql')
    ];
}

// Kiểm tra quyền truy cập API
function hmm_api_permissions_check() {
    // Luôn cho phép truy cập để test
    return true;
}

// ... Các hàm khác của plugin

// Activation hook để tạo các bảng cần thiết
register_activation_hook(__FILE__, 'hmm_activate_plugin');

function hmm_activate_plugin() {
    // Log thông tin kích hoạt
    error_log("HMM Custom API activated!");
    
    // Tạo các bảng trong database
    hmm_create_damaged_stock_table();
    hmm_create_goods_receipts_table();
    hmm_create_returns_table();
    hmm_create_suppliers_table();
    hmm_create_payment_receipts_table();
    
    // Thêm dữ liệu mẫu nếu chưa có
    hmm_add_sample_data();
}

// Tạo các bảng dữ liệu khi cần
function hmm_create_suppliers_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'inventory_suppliers';
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        address text,
        email varchar(100),
        phone varchar(20),
        initial_debt decimal(15,2) DEFAULT 0,
        current_debt decimal(15,2) DEFAULT 0,
        notes text,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// ... Các hàm khác của plugin
`}</code>
              </pre>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setOpenPluginCode(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Phân quyền người dùng</DialogTitle>
            <DialogDescription>
              Điều chỉnh quyền truy cập cho người dùng {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Phân quyền truy cập</h4>
              
              <div className="space-y-3 border rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-inventory" disabled />
                  <label
                    htmlFor="perm-inventory"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quản lý kho
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-products" disabled />
                  <label
                    htmlFor="perm-products"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quản lý sản phẩm
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-sales" disabled />
                  <label
                    htmlFor="perm-sales"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quản lý bán hàng
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-customers" disabled />
                  <label
                    htmlFor="perm-customers"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quản lý khách hàng
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-suppliers" disabled />
                  <label
                    htmlFor="perm-suppliers"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Quản lý nhà cung cấp
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-reports" disabled />
                  <label
                    htmlFor="perm-reports"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Xem báo cáo
                  </label>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Tính năng phân quyền chi tiết sẽ được triển khai trong bản cập nhật tiếp theo.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenUserDialog(false)}>
              Đóng
            </Button>
            <Button disabled>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
