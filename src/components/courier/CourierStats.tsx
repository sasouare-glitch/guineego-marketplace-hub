import { TrendingUp, TrendingDown, Package, Clock, Star, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DeliveryMission } from "@/hooks/useCourierMissions";
import { Wallet as WalletType } from "@/hooks/useWallet";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg?: string;
}

const StatCard = ({ title, value, change, trend, icon, iconBg = "bg-primary/10" }: StatCardProps) => (
  <Card className="p-4 bg-card border-border">
    <div className="flex items-start justify-between">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
        {icon}
      </div>
      {change && (
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
          trend === "up" && "bg-guinea-green/10 text-guinea-green",
          trend === "down" && "bg-guinea-red/10 text-guinea-red",
          trend === "neutral" && "bg-muted text-muted-foreground"
        )}>
          {trend === "up" && <TrendingUp className="w-3 h-3" />}
          {trend === "down" && <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  </Card>
);

interface CourierStatsProps {
  myMissions?: DeliveryMission[];
  wallet?: WalletType | null;
}

export const CourierStats = ({ myMissions = [], wallet }: CourierStatsProps) => {
  // Compute today's stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMissions = myMissions.filter((m) => {
    const created = m.createdAt?.toDate?.() || m.createdAt;
    return created && new Date(created as any) >= today;
  });

  const todayDelivered = todayMissions.filter((m) => m.status === "delivered");
  const todayEarnings = todayDelivered.reduce((sum, m) => sum + (m.fee || 0), 0);

  const allDelivered = myMissions.filter((m) => m.status === "delivered");
  const avgTime = allDelivered.length > 0
    ? Math.round(allDelivered.reduce((sum, m) => sum + (m.estimatedTime || 0), 0) / allDelivered.length)
    : 0;

  const stats = [
    {
      title: "Gains aujourd'hui",
      value: `${todayEarnings.toLocaleString("fr-GN")} GNF`,
      change: wallet ? `Solde: ${(wallet.balance || 0).toLocaleString("fr-GN")}` : undefined,
      trend: "neutral" as const,
      icon: <Wallet className="w-5 h-5 text-guinea-green" />,
      iconBg: "bg-guinea-green/10",
    },
    {
      title: "Livraisons aujourd'hui",
      value: `${todayDelivered.length}`,
      change: `${todayMissions.length} total`,
      trend: "neutral" as const,
      icon: <Package className="w-5 h-5 text-primary" />,
      iconBg: "bg-primary/10",
    },
    {
      title: "Temps moyen",
      value: avgTime > 0 ? `${avgTime} min` : "—",
      icon: <Clock className="w-5 h-5 text-guinea-yellow" />,
      iconBg: "bg-guinea-yellow/10",
    },
    {
      title: "Total livraisons",
      value: `${allDelivered.length}`,
      change: wallet?.completedMissions ? `${wallet.completedMissions} missions` : undefined,
      trend: "neutral" as const,
      icon: <Star className="w-5 h-5 text-guinea-yellow" />,
      iconBg: "bg-guinea-yellow/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
