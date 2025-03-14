
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetchWooCommerce, fetchWordPress, fetchCustomAPI } from "@/lib/api-utils";
import { toast } from "sonner";
import { CheckCircle, AlertCircle } from "lucide-react";

// Validation schema for API settings
const apiSettingsSchema = z.object({
  woocommerce_url: z.string().url("URL không hợp lệ"),
  consumer_key: z.string().min(1, "Consumer key không được để trống"),
  consumer_secret: z.string().min(1, "Consumer secret không được để trống"),
  wp_username: z.string().min(1, "Username không được để trống"),
  application_password: z.string().min(1, "Application password không được để trống")
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export default function Settings() {
  const [apiStatus, setApiStatus] = useState({
    woocommerce: null as boolean | null,
    wordpress: null as boolean | null,
    custom: null as boolean | null
  });
  const [isTesting, setIsTesting] = useState(false);

  // Setup form
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
  
  // Handle form submission
  const onSubmit = (data: ApiSettingsFormValues) => {
    console.log("API Settings:", data);
    // Lưu các giá trị vào localStorage để có thể sử dụng lại
    localStorage.setItem('api_settings', JSON.stringify(data));
    toast.success("Cài đặt API đã được lưu");
    // TODO: Implement saving settings to backend
  };
  
  // Test API connections
  const testConnections = async () => {
    setIsTesting(true);
    setApiStatus({
      woocommerce: null,
      wordpress: null,
      custom: null
    });
    
    try {
      // Test WooCommerce API
      await fetchWooCommerce('/products?per_page=1', { suppressToast: true });
      setApiStatus(prev => ({ ...prev, woocommerce: true }));
    } catch (error) {
      console.error('WooCommerce API test failed:', error);
      setApiStatus(prev => ({ ...prev, woocommerce: false }));
    }
    
    try {
      // Test WordPress API
      await fetchWordPress('/posts?per_page=1', { suppressToast: true });
      setApiStatus(prev => ({ ...prev, wordpress: true }));
    } catch (error) {
      console.error('WordPress API test failed:', error);
      setApiStatus(prev => ({ ...prev, wordpress: false }));
    }
    
    try {
      // Test Custom API
      await fetchCustomAPI('/damaged-stock', { suppressToast: true });
      setApiStatus(prev => ({ ...prev, custom: true }));
    } catch (error) {
      console.error('Custom API test failed:', error);
      setApiStatus(prev => ({ ...prev, custom: false }));
    }
    
    setIsTesting(false);
  };
  
  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return null;
    return status ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
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
            <TabsTrigger value="integrations">Tích hợp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="mt-4">
            <div className="mb-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-800">Thông tin quan trọng về plugin HMM Custom API</h3>
              <p className="text-yellow-700 mt-1">
                Để sử dụng đầy đủ các tính năng của ứng dụng, vui lòng cài đặt plugin HMM Custom API vào website WordPress của bạn. 
                Plugin này tạo các endpoint API tùy chỉnh để truy cập và quản lý dữ liệu.
              </p>
              <p className="text-yellow-700 mt-2">
                File plugin đã được tạo tại: <code className="bg-yellow-100 px-2 py-1 rounded">public/hmm-custom-api/hmm-custom-api.php</code>
              </p>
              <p className="text-yellow-700 mt-2">
                Tải file này lên thư mục <code className="bg-yellow-100 px-2 py-1 rounded">wp-content/plugins/</code> trên website WordPress của bạn, 
                sau đó kích hoạt plugin trong trang quản trị WordPress.
              </p>
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
                
                <div className="flex items-center mt-4 border-t pt-4">
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
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng quản lý người dùng sẽ sớm được triển khai
                </p>
              </div>
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
          
          <TabsContent value="integrations" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng tích hợp sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
