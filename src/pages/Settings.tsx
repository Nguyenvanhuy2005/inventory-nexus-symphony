
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
    // TODO: Save settings
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="woocommerce_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WooCommerce API URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                
                <div className="flex justify-end">
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
