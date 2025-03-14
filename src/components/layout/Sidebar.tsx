
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  ArrowLeft, 
  DollarSign, 
  AlertTriangle,
  Settings, 
  Tag,
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <div className="w-5 h-5 shrink-0">{icon}</div>
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <div className="h-screen w-64 flex-shrink-0 border-r bg-sidebar shadow-sm">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h1 className="mb-2 text-xl font-bold tracking-tight text-sidebar-foreground">
            StockWave Harmony
          </h1>
          <p className="text-xs text-sidebar-foreground/70">
            Hệ thống quản lý kho
          </p>
        </div>
        
        <div className="flex-1 overflow-auto px-3 py-2">
          <nav className="flex flex-col gap-1">
            <SidebarItem
              icon={<Home className="h-4 w-4" />}
              label="Tổng quan"
              href="/"
              isActive={path === '/'}
            />
            <SidebarItem
              icon={<Package className="h-4 w-4" />}
              label="Quản lý kho"
              href="/inventory"
              isActive={path === '/inventory'}
            />
            <SidebarItem
              icon={<Tag className="h-4 w-4" />}
              label="Sản phẩm"
              href="/products"
              isActive={path === '/products'}
            />
            <SidebarItem
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Bán hàng"
              href="/sales"
              isActive={path === '/sales'}
            />
            <SidebarItem
              icon={<Users className="h-4 w-4" />}
              label="Khách hàng"
              href="/customers"
              isActive={path === '/customers'}
            />
            <SidebarItem
              icon={<Truck className="h-4 w-4" />}
              label="Nhà cung cấp"
              href="/suppliers"
              isActive={path === '/suppliers'}
            />
            <SidebarItem
              icon={<Truck className="h-4 w-4" />}
              label="Nhập hàng"
              href="/goods-receipt"
              isActive={path === '/goods-receipt'}
            />
            <SidebarItem
              icon={<ArrowLeft className="h-4 w-4" />}
              label="Trả hàng"
              href="/returns"
              isActive={path === '/returns'}
            />
            <SidebarItem
              icon={<DollarSign className="h-4 w-4" />}
              label="Thu tiền"
              href="/payment-receipts"
              isActive={path === '/payment-receipts'}
            />
            <SidebarItem
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Hàng hỏng"
              href="/damaged-stock"
              isActive={path === '/damaged-stock'}
            />
            <SidebarItem
              icon={<Settings className="h-4 w-4" />}
              label="Cài đặt"
              href="/settings"
              isActive={path === '/settings'}
            />
          </nav>
        </div>
        
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent">
              <div className="flex h-full w-full items-center justify-center font-semibold text-sidebar-accent-foreground">
                A
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
              <p className="text-xs text-sidebar-foreground/70">admin@hmm.vn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
