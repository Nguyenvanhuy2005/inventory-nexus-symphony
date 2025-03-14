
import { useState } from "react";
import { useGetCustomers } from "@/hooks/use-mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Edit, Eye, Mail, Phone } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatDate } from "@/lib/utils";

export default function Customers() {
  const { data: customers, isLoading } = useGetCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter customers based on search term
  const filteredCustomers = customers?.filter(customer => {
    const searchFields = [
      customer.first_name,
      customer.last_name,
      customer.email,
      customer.billing?.phone
    ].filter(Boolean).join(" ").toLowerCase();
    
    return searchFields.includes(searchTerm.toLowerCase());
  });
  
  // Get customer initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Quản lý khách hàng" 
        description="Quản lý thông tin khách hàng và lịch sử mua hàng"
      />
      
      <Card>
        <div className="p-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm khách hàng..."
                className="pl-8 w-full md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Thêm khách hàng
            </Button>
          </div>
          
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead>Số đơn hàng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="flex items-center justify-center py-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Không tìm thấy khách hàng nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={customer.avatar_url} />
                          <AvatarFallback>
                            {getInitials(customer.first_name, customer.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                          <div className="text-xs text-muted-foreground">ID: {customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        {customer.billing?.phone || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.billing?.address_1 
                        ? `${customer.billing.address_1}, ${customer.billing.city}` 
                        : "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(customer.created_at)}</TableCell>
                    <TableCell>
                      {customer.orders_count || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
