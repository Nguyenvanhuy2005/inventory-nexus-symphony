
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Truck, 
  Users,
  Clock
} from "lucide-react";
import { useGetRecentActivities } from "@/hooks/use-mock-data";

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'order':
      return <ShoppingCart className="h-4 w-4" />;
    case 'payment':
      return <DollarSign className="h-4 w-4" />;
    case 'stock':
      return <Package className="h-4 w-4" />;
    case 'goods_receipt':
      return <Truck className="h-4 w-4" />;
    case 'customer':
      return <Users className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-500">Hoàn thành</Badge>;
    case 'processing':
      return <Badge variant="default" className="bg-blue-500">Đang xử lý</Badge>;
    case 'pending':
      return <Badge variant="default" className="bg-yellow-500">Chờ xử lý</Badge>;
    case 'cancelled':
      return <Badge variant="default" className="bg-red-500">Đã hủy</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function RecentActivities() {
  const { data: activities, isLoading } = useGetRecentActivities();

  return (
    <Card className="col-span-12 lg:col-span-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities?.map((activity: ActivityItem) => (
              <div key={activity.id} className="flex items-start rounded-md p-2 hover:bg-accent">
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.description}</p>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
