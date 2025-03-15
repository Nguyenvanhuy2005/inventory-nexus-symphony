import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Key, Server, Database, User, Globe, Cog, RefreshCw, BarChart } from "lucide-react";
import { useCheckAPIStatus } from "@/hooks/api-hooks";
import { fetchWordPress, getWordPressUsers } from "@/lib/api-utils";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DEFAULT_WOOCOMMERCE_CREDENTIALS, DEFAULT_WORDPRESS_CREDENTIALS } from "@/lib/auth-utils";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [apiKeys, setApiKeys] = useState({
    woocommerce_consumer_key: localStorage.getItem('woocommerce_consumer_key') || DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key,
    woocommerce_consumer_secret: localStorage.getItem('woocommerce_consumer_secret') || DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret,
    custom_api_key: localStorage.getItem('custom_api_key') || '',
    wordpress_username: localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username,
    wordpress_application_password: localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password,
  });
  
  const [apiUrls, setApiUrls] = useState({
    api_url: localStorage.getItem('api_url') || 'https://hmm.vn/wp-json',
    woocommerce_api_url: localStorage.getItem('woocommerce_api_url') || 'https://hmm.vn/wp-json/wc/v3',
  });
  
  const [generalSettings, setGeneralSettings] = useState({
    default_currency: localStorage.getItem('default_currency') || 'VND',
    default_language: localStorage.getItem('default_language') || 'vi',
    enable_dark_mode: localStorage.getItem('enable_dark_mode') === 'true',
    enable_notifications: localStorage.getItem('enable_notifications') === 'true',
    auto_sync_interval: localStorage.getItem('auto_sync_interval') || '60',
  });
  
  const [inventorySettings, setInventorySettings] = useState({
    low_stock_threshold: localStorage.getItem('low_stock_threshold') || '5',
    enable_auto_order: localStorage.getItem('enable_auto_order') === 'true',
    enable_stock_notifications: localStorage.getItem('enable_stock_notifications') === 'true',
    default_supplier: localStorage.getItem('default_supplier') || '',
    sync_on_receipt: localStorage.getItem('sync_on_receipt') === 'true',
    sync_on_return: localStorage.getItem('sync_on_return') === 'true',
    sync_on_adjustment: localStorage.getItem('sync_on_adjustment') === 'true',
  });
  
  const [selectedUser, setSelectedUser] = useState(localStorage.getItem('selected_user') || '');
  const [wpUsers, setWpUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const { data: apiStatus, isLoading: isLoadingStatus, refetch: refetchApiStatus } = useCheckAPIStatus();
  
  useEffect(() => {
    loadWpUsers();
  }, []);
  
  const loadWpUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await getWordPressUsers();
      setWpUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error:', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error(error.message as string);
      } else {
        toast.error(String(error));
      }
      setWpUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const saveApiKeys = () => {
    localStorage.setItem('woocommerce_consumer_key', apiKeys.woocommerce_consumer_key);
    localStorage.setItem('woocommerce_consumer_secret', apiKeys.woocommerce_consumer_secret);
    localStorage.setItem('custom_api_key', apiKeys.custom_api_key);
    localStorage.setItem('wordpress_username', apiKeys.wordpress_username);
    localStorage.setItem('wordpress_application_password', apiKeys.wordpress_application_password);
    
    if (typeof window !== 'undefined') {
      (window as any).process = {
        ...(window as any).process,
        env: {
          ...(window as any).process?.env,
          VITE_WOOCOMMERCE_CONSUMER_KEY: apiKeys.woocommerce_consumer_key,
          VITE_WOOCOMMERCE_CONSUMER_SECRET: apiKeys.woocommerce_consumer_secret,
          VITE_CUSTOM_API_KEY: apiKeys.custom_api_key,
        }
      };
    }
    
    toast.success('Đã lưu khóa API');
    setTimeout(() => refetchApiStatus(), 500);
  };
  
  const saveApiUrls = () => {
    localStorage.setItem('api_url', apiUrls.api_url);
    localStorage.setItem('woocommerce_api_url', apiUrls.woocommerce_api_url);
    
    if (typeof window !== 'undefined') {
      (window as any).process = {
        ...(window as any).process,
        env: {
          ...(window as any).process?.env,
          VITE_API_URL: apiUrls.api_url,
          VITE_WOOCOMMERCE_API_URL: apiUrls.woocommerce_api_url,
        }
      };
    }
    
    toast.success('Đã lưu URL API');
    setTimeout(() => refetchApiStatus(), 500);
  };
  
  const saveGeneralSettings = () => {
    localStorage.setItem('default_currency', generalSettings.default_currency);
    localStorage.setItem('default_language', generalSettings.default_language);
    localStorage.setItem('enable_dark_mode', generalSettings.enable_dark_mode.toString());
    localStorage.setItem('enable_notifications', generalSettings.enable_notifications.toString());
    localStorage.setItem('auto_sync_interval', generalSettings.auto_sync_interval);
    
    toast.success('Đã lưu cài đặt chung');
  };
  
  const saveInventorySettings = () => {
    localStorage.setItem('low_stock_threshold', inventorySettings.low_stock_threshold);
    localStorage.setItem('enable_auto_order', inventorySettings.enable_auto_order.toString());
    localStorage.setItem('enable_stock_notifications', inventorySettings.enable_stock_notifications.toString());
    localStorage.setItem('default_supplier', inventorySettings.default_supplier);
    localStorage.setItem('sync_on_receipt', inventorySettings.sync_on_receipt.toString());
    localStorage.setItem('sync_on_return', inventorySettings.sync_on_return.toString());
    localStorage.setItem('sync_on_adjustment', inventorySettings.sync_on_adjustment.toString());
    
    toast.success('Đã lưu cài đặt tồn kho');
  };
  
  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    localStorage.setItem('selected_user', value);
    toast.success('Đã chọn người dùng mặc định');
  };
  
  const resetApiKeysToDefault = () => {
    setApiKeys({
      ...apiKeys,
      woocommerce_consumer_key: DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key,
      woocommerce_consumer_secret: DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret,
      wordpress_username: DEFAULT_WORDPRESS_CREDENTIALS.username,
      wordpress_application_password: DEFAULT_WORDPRESS_CREDENTIALS.application_password,
    });
    
    toast.info('Đã khôi phục khóa API mặc định. Nhấn "Lưu khóa API" để áp dụng.');
  };
  
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Cài đặt hệ thống" 
        description="Quản lý cài đặt và tùy chỉnh hệ thống"
      />
      
      <Tabs defaultValue={activeTab} className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            Cài đặt chung
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API và Kết nối
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tồn kho
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Người dùng
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt chung</CardTitle>
              <CardDescription>
                Quản lý ngôn ngữ, tiền tệ và các tùy chỉnh cơ bản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Đơn vị tiền tệ</Label>
                  <Select
                    defaultValue={generalSettings.default_currency}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, default_currency: value})}
                  >
                    <SelectTrigger id="default_currency">
                      <SelectValue placeholder="Chọn đơn vị tiền tệ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND - Việt Nam Đồng</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_language">Ngôn ngữ</Label>
                  <Select
                    defaultValue={generalSettings.default_language}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, default_language: value})}
                  >
                    <SelectTrigger id="default_language">
                      <SelectValue placeholder="Chọn ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto_sync_interval">Thời gian đồng bộ tự động (phút)</Label>
                  <Input
                    id="auto_sync_interval"
                    type="number"
                    min="1"
                    value={generalSettings.auto_sync_interval}
                    onChange={(e) => setGeneralSettings({...generalSettings, auto_sync_interval: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark_mode">Chế độ tối</Label>
                    <p className="text-sm text-muted-foreground">Bật chế độ tối cho giao diện</p>
                  </div>
                  <Switch
                    id="dark_mode"
                    checked={generalSettings.enable_dark_mode}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enable_dark_mode: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Thông báo</Label>
                    <p className="text-sm text-muted-foreground">Bật thông báo khi có sự kiện quan trọng</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={generalSettings.enable_notifications}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enable_notifications: checked})}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveGeneralSettings}>Lưu cài đặt</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trạng thái API</CardTitle>
                <CardDescription>
                  Kiểm tra kết nối API với WordPress và WooCommerce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingStatus ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span>Đang kiểm tra kết nối...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      {apiStatus?.isConnected ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          WordPress API: {apiStatus?.isConnected ? 'Đã kết nối' : 'Lỗi kết nối'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apiStatus?.status?.message || 'Không có thông tin trạng thái'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      {apiStatus?.woocommerce?.isConnected ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          WooCommerce API: {apiStatus?.woocommerce?.isConnected ? 'Đã kết nối' : 'Lỗi kết n���i'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apiStatus?.woocommerce?.error || 'Không có thông tin lỗi'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => refetchApiStatus()}
                  disabled={isLoadingStatus}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kiểm tra lại kết nối
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Khóa API WooCommerce</CardTitle>
                <CardDescription>
                  Cài đặt khóa API cho WooCommerce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="woocommerce_consumer_key">WooCommerce Consumer Key</Label>
                  <Input
                    id="woocommerce_consumer_key"
                    value={apiKeys.woocommerce_consumer_key}
                    onChange={(e) => setApiKeys({...apiKeys, woocommerce_consumer_key: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="woocommerce_consumer_secret">WooCommerce Consumer Secret</Label>
                  <Input
                    id="woocommerce_consumer_secret"
                    value={apiKeys.woocommerce_consumer_secret}
                    onChange={(e) => setApiKeys({...apiKeys, woocommerce_consumer_secret: e.target.value})}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveApiKeys} className="flex-1">Lưu khóa API</Button>
                  <Button onClick={resetApiKeysToDefault} variant="outline" className="flex-1">Khôi phục mặc định</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Khóa API WordPress</CardTitle>
                <CardDescription>
                  Cài đặt khóa API cho WordPress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wordpress_username">WordPress Username</Label>
                  <Input
                    id="wordpress_username"
                    value={apiKeys.wordpress_username}
                    onChange={(e) => setApiKeys({...apiKeys, wordpress_username: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="wordpress_application_password">WordPress Application Password</Label>
                  <Input
                    id="wordpress_application_password"
                    type="password"
                    value={apiKeys.wordpress_application_password}
                    onChange={(e) => setApiKeys({...apiKeys, wordpress_application_password: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="custom_api_key">Custom API Key (Nếu cần)</Label>
                  <Input
                    id="custom_api_key"
                    type="password"
                    value={apiKeys.custom_api_key}
                    onChange={(e) => setApiKeys({...apiKeys, custom_api_key: e.target.value})}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveApiKeys} className="flex-1">Lưu khóa API</Button>
                  <Button onClick={resetApiKeysToDefault} variant="outline" className="flex-1">Khôi phục mặc định</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>URL API</CardTitle>
                <CardDescription>
                  Cài đặt đường dẫn API cho WordPress và WooCommerce
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_url">WordPress API URL</Label>
                    <Input
                      id="api_url"
                      type="text"
                      value={apiUrls.api_url}
                      onChange={(e) => setApiUrls({...apiUrls, api_url: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="woocommerce_api_url">WooCommerce API URL</Label>
                    <Input
                      id="woocommerce_api_url"
                      type="text"
                      value={apiUrls.woocommerce_api_url}
                      onChange={(e) => setApiUrls({...apiUrls, woocommerce_api_url: e.target.value})}
                    />
                  </div>
                </div>
                
                <Button onClick={saveApiUrls}>Lưu URL API</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt tồn kho</CardTitle>
              <CardDescription>
                Quản lý cài đặt liên quan đến tồn kho và đặt hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Ngưỡng tồn kho thấp</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="1"
                    value={inventorySettings.low_stock_threshold}
                    onChange={(e) => setInventorySettings({...inventorySettings, low_stock_threshold: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_supplier">Nhà cung cấp mặc định</Label>
                  <Input
                    id="default_supplier"
                    type="text"
                    value={inventorySettings.default_supplier}
                    onChange={(e) => setInventorySettings({...inventorySettings, default_supplier: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto_order">Đặt hàng tự động</Label>
                    <p className="text-sm text-muted-foreground">Tự động tạo đơn đặt hàng khi tồn kho thấp</p>
                  </div>
                  <Switch
                    id="auto_order"
                    checked={inventorySettings.enable_auto_order}
                    onCheckedChange={(checked) => setInventorySettings({...inventorySettings, enable_auto_order: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="stock_notifications">Thông báo tồn kho</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo khi tồn kho dưới ngưỡng</p>
                  </div>
                  <Switch
                    id="stock_notifications"
                    checked={inventorySettings.enable_stock_notifications}
                    onCheckedChange={(checked) => setInventorySettings({...inventorySettings, enable_stock_notifications: checked})}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">Cài đặt đồng bộ tồn kho</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync_on_receipt">Đồng bộ khi nhập hàng</Label>
                      <p className="text-sm text-muted-foreground">Tự động đồng bộ tồn kho với WooCommerce khi nhập hàng</p>
                    </div>
                    <Switch
                      id="sync_on_receipt"
                      checked={inventorySettings.sync_on_receipt}
                      onCheckedChange={(checked) => setInventorySettings({...inventorySettings, sync_on_receipt: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync_on_return">Đồng bộ khi trả hàng</Label>
                      <p className="text-sm text-muted-foreground">Tự động đồng bộ tồn kho với WooCommerce khi trả hàng</p>
                    </div>
                    <Switch
                      id="sync_on_return"
                      checked={inventorySettings.sync_on_return}
                      onCheckedChange={(checked) => setInventorySettings({...inventorySettings, sync_on_return: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync_on_adjustment">Đồng bộ khi điều chỉnh</Label>
                      <p className="text-sm text-muted-foreground">Tự động đồng bộ tồn kho với WooCommerce khi điều chỉnh tồn kho</p>
                    </div>
                    <Switch
                      id="sync_on_adjustment"
                      checked={inventorySettings.sync_on_adjustment}
                      onCheckedChange={(checked) => setInventorySettings({...inventorySettings, sync_on_adjustment: checked})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveInventorySettings}>Lưu cài đặt</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt người dùng</CardTitle>
              <CardDescription>
                Quản lý người dùng và phân quyền
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="user_select">Người dùng mặc định</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadWpUsers}
                  disabled={isLoadingUsers}
                >
                  {isLoadingUsers ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Select
                value={selectedUser}
                onValueChange={handleUserChange}
              >
                <SelectTrigger id="user_select">
                  <SelectValue placeholder="Chọn người dùng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(wpUsers) && wpUsers.length > 0 ? (
                    wpUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Không có người dùng</SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <div className="pt-4">
                <h3 className="text-lg font-medium">Quản lý quyền</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Quản lý quyền truy cập cho người dùng
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_inventory">Quản lý tồn kho</Label>
                    <Switch id="perm_inventory" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_orders">Quản lý đơn hàng</Label>
                    <Switch id="perm_orders" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_customers">Quản lý khách hàng</Label>
                    <Switch id="perm_customers" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_suppliers">Quản lý nhà cung cấp</Label>
                    <Switch id="perm_suppliers" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_reports">Báo cáo thống kê</Label>
                    <Switch id="perm_reports" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perm_settings">Cài đặt hệ thống</Label>
                    <Switch id="perm_settings" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu cài đặt</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
