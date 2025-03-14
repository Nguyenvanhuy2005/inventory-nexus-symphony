
import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DamagedStock() {
  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý hàng hỏng" 
        description="Theo dõi sản phẩm bị hỏng, giảm tồn kho tương ứng"
      />
      
      <Card className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm báo cáo hàng hỏng..."
              className="pl-8 w-full md:w-[300px]"
            />
          </div>
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Báo cáo hàng hỏng
          </Button>
        </div>
        
        <div className="mt-8 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium">Tính năng đang được phát triển</h3>
            <p className="text-muted-foreground mt-1">
              Chức năng quản lý hàng hỏng sẽ sớm được triển khai
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
