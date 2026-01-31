import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  iconBg: string;
}

const StatCard = ({ title, value, change, changeType = "neutral", icon: Icon, iconBg }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-2xl p-6 border border-border"
  >
    <div className="flex items-start justify-between">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {change && (
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          changeType === "positive" && "bg-guinea-green/10 text-guinea-green",
          changeType === "negative" && "bg-guinea-red/10 text-guinea-red",
          changeType === "neutral" && "bg-muted text-muted-foreground"
        )}>
          {changeType === "positive" ? <TrendingUp className="w-4 h-4" /> : 
           changeType === "negative" ? <TrendingDown className="w-4 h-4" /> : null}
          {change}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
    </div>
  </motion.div>
);

export const PortfolioStats = () => {
  const stats = [
    {
      title: "Capital total investi",
      value: "45 500 000 GNF",
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Wallet,
      iconBg: "bg-guinea-green"
    },
    {
      title: "Rendements totaux",
      value: "8 750 000 GNF",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
      iconBg: "bg-guinea-yellow"
    },
    {
      title: "Valeur actuelle",
      value: "54 250 000 GNF",
      change: "+19.2%",
      changeType: "positive" as const,
      icon: PiggyBank,
      iconBg: "bg-blue-500"
    },
    {
      title: "Placements actifs",
      value: "7",
      icon: Target,
      iconBg: "bg-purple-500"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
};
