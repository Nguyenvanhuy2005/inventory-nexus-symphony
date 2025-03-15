
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  CircleSlash, 
  Copy, 
  Loader2, 
  XCircle,
  AlertTriangle
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { 
  DEFAULT_WOOCOMMERCE_CREDENTIALS, 
  DEFAULT_WORDPRESS_CREDENTIALS 
} from "@/lib/auth-utils";
import { useCheckAPIStatus } from "@/hooks/api-hooks";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wooConsumerKey, setWooConsumerKey] = useState(localStorage.getItem('woocommerce_consumer_key') || DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
  const [wooConsumerSecret, setWooConsumerSecret] = useState(localStorage.getItem('woocommerce_consumer_secret') || DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
  const [wpUsername, setWpUsername] = useState(localStorage.getItem('wordpress_username') || DEFAULT_WORDPRESS_CREDENTIALS.username);
  const [wpPassword, setWpPassword] = useState(localStorage.getItem('wordpress_application_password') || DEFAULT_WORDPRESS_CREDENTIALS.application_password);
  const [isSaving, setIsSaving] = useState(false);
  const apiStatus = useCheckAPIStatus();
  
  useEffect(() => {
    if (apiStatus.isSuccess && apiStatus.data) {
      console.log("API Status:", apiStatus.data);
    }
  }, [apiStatus.isSuccess, apiStatus.data]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('woocommerce_consumer_key', wooConsumerKey);
      localStorage.setItem('woocommerce_consumer_secret', wooConsumerSecret);
      localStorage.setItem('wordpress_username', wpUsername);
      localStorage.setItem('wordpress_application_password', wpPassword);
      
      toast({
        title: "Cài đặt đã được lưu",
        description: "Đã lưu thông tin xác thực API thành công.",
      });
      
      navigate(0);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleResetSettings = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục cài đặt mặc định?")) {
      localStorage.setItem('woocommerce_consumer_key', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_key);
      localStorage.setItem('woocommerce_consumer_secret', DEFAULT_WOOCOMMERCE_CREDENTIALS.consumer_secret);
      localStorage.setItem('wordpress_username', DEFAULT_WORDPRESS_CREDENTIALS.username);
      localStorage.setItem('wordpress_application_password', DEFAULT_WORDPRESS_CREDENTIALS.application_password);
      
      toast({
        title: "Đã khôi phục cài đặt",
        description: "Đã khôi phục cài đặt mặc định thành công.",
      });
      
      navigate(0);
    }
  };
  
  const handleCopyKey = () => {
    navigator.clipboard.writeText(wooConsumerKey);
    toast({ description: "Đã sao chép Consumer Key vào clipboard." });
  };
  
  const handleCopySecret = () => {
    navigator.clipboard.writeText(wooConsumerSecret);
    toast({ description: "Đã sao chép Consumer Secret vào clipboard." });
  };
  
  const handleCopyUsername = () => {
    navigator.clipboard.writeText(wpUsername);
    toast({ description: "Đã sao chép Tên người dùng vào clipboard." });
  };
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(wpPassword);
    toast({ description: "Đã sao chép Mật khẩu ứng dụng vào clipboard." });
  };

  // Safely check for nested properties with null checks
  const isConnected = apiStatus.data?.status?.wordpress?.connected || false;
                      
  const wordpressStatus = apiStatus.data?.status?.wordpress?.message || "Unknown status";

  const isWooCommerceAuthenticated = apiStatus.data?.woocommerce?.isAuthenticated || false;
  
  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Cài đặt"
        description="Quản lý cài đặt và cấu hình hệ thống."
      />
      
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Kết nối WooCommerce API</CardTitle>
          <CardDescription>
            Nhập thông tin xác thực API WooCommerce để đồng bộ dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="consumerKey">WooCommerce Consumer Key</Label>
            <div className="relative">
              <Input 
                id="consumerKey" 
                value={wooConsumerKey} 
                onChange={(e) => setWooConsumerKey(e.target.value)} 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleCopyKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumerSecret">WooCommerce Consumer Secret</Label>
            <div className="relative">
              <Input 
                id="consumerSecret" 
                type="password"
                value={wooConsumerSecret} 
                onChange={(e) => setWooConsumerSecret(e.target.value)} 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleCopySecret}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Kết nối WordPress API</CardTitle>
          <CardDescription>
            Nhập thông tin xác thực WordPress API để đồng bộ dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="wpUsername">WordPress Username</Label>
            <div className="relative">
              <Input 
                id="wpUsername" 
                value={wpUsername} 
                onChange={(e) => setWpUsername(e.target.value)} 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleCopyUsername}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wpPassword">WordPress Application Password</Label>
            <div className="relative">
              <Input 
                id="wpPassword" 
                type="password"
                value={wpPassword} 
                onChange={(e) => setWpPassword(e.target.value)} 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleCopyPassword}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Trạng thái kết nối</CardTitle>
          <CardDescription>
            Kiểm tra trạng thái kết nối đến các API.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>WooCommerce API</Label>
              <p className="text-sm text-muted-foreground">
                Trạng thái kết nối đến WooCommerce API.
              </p>
            </div>
            {apiStatus.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : apiStatus.isError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : isWooCommerceAuthenticated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <CircleSlash className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>WordPress API</Label>
              <p className="text-sm text-muted-foreground">
                Trạng thái kết nối đến WordPress API.
              </p>
            </div>
            {apiStatus.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : apiStatus.isError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <CircleSlash className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          
          {apiStatus.error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Lỗi</span>
              </div>
              <p>{String(apiStatus.error)}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleResetSettings}>
          Khôi phục cài đặt mặc định
        </Button>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu cài đặt"
          )}
        </Button>
      </div>
    </div>
  );
}
