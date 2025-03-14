
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trendValue?: number;
  trendLabel?: string;
  className?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trendValue,
  trendLabel,
  className,
  iconColor = "text-primary"
}: StatsCardProps) {
  const isPositiveTrend = trendValue !== undefined && trendValue > 0;
  const isNegativeTrend = trendValue !== undefined && trendValue < 0;
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trendValue !== undefined && trendLabel && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={cn("text-xs font-medium", {
                "text-green-500": isPositiveTrend,
                "text-red-500": isNegativeTrend,
                "text-muted-foreground": !isPositiveTrend && !isNegativeTrend
              })}
            >
              {trendValue > 0 ? "+" : ""}
              {trendValue}%
            </span>
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
