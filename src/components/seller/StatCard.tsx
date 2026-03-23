import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: "primary" | "accent" | "destructive" | "muted";
  delay?: number;
  compact?: boolean;
}

const iconColors = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = "primary",
  delay = 0,
  compact = false,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow",
        compact ? "p-3 sm:p-5" : "p-6"
      )}
    >
      <div className={cn(
        "flex items-start justify-between",
        compact && "gap-2"
      )}>
        <div className={cn("space-y-1", compact ? "space-y-0.5" : "space-y-2")}>
          <p className={cn(
            "font-medium text-muted-foreground",
            compact ? "text-[11px] sm:text-sm leading-tight" : "text-sm"
          )}>{title}</p>
          <p className={cn(
            "font-bold text-foreground",
            compact ? "text-base sm:text-2xl" : "text-2xl"
          )}>{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive && (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              )}
              {isNegative && (
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  isPositive && "text-primary",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn(
          "rounded-xl flex-shrink-0",
          iconColors[iconColor],
          compact ? "p-2 sm:p-3" : "p-3"
        )}>
          <Icon className={cn(compact ? "w-4 h-4 sm:w-6 sm:h-6" : "w-6 h-6")} />
        </div>
      </div>
    </motion.div>
  );
}
