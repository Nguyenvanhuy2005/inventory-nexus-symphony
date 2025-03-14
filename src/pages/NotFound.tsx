
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col items-center justify-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <FileX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Trang bạn đang tìm kiếm không tồn tại
      </p>
      <Button asChild>
        <a href="/">Quay lại trang chính</a>
      </Button>
    </div>
  );
};

export default NotFound;
