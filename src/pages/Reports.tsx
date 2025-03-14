
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Báo cáo thống kê" 
        description="Cung cấp báo cáo về tồn kho, doanh thu, công nợ khách hàng và nhà cung cấp"
      />
      
      <Card className="p-6">
        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Báo cáo tồn kho</TabsTrigger>
            <TabsTrigger value="sales">Báo cáo doanh thu</TabsTrigger>
            <TabsTrigger value="customer-debts">Công nợ khách hàng</TabsTrigger>
            <TabsTrigger value="supplier-debts">Công nợ nhà cung cấp</TabsTrigger>
          </TabsList>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
          
          <TabsContent value="inventory" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng báo cáo tồn kho sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng báo cáo doanh thu sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="customer-debts" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng báo cáo công nợ khách hàng sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="supplier-debts" className="mt-4">
            <div className="mt-8 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
                <p className="text-muted-foreground mt-1">
                  Chức năng báo cáo công nợ nhà cung cấp sẽ sớm được triển khai
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
