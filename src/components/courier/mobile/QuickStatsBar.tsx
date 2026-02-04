import { Package, Wallet, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsBarProps {
  todayDeliveries: number;
  todayEarnings: number;
  rating: number;
}

export const QuickStatsBar = ({
  todayDeliveries,
  todayEarnings,
  rating,
}: QuickStatsBarProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Deliveries */}
      <div className="bg-guinea-green/10 rounded-2xl p-4 flex flex-col items-center">
        <div className="w-12 h-12 bg-guinea-green rounded-full flex items-center justify-center mb-2">
          <Package className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-black text-guinea-green">{todayDeliveries}</span>
        <span className="text-xs font-bold text-muted-foreground">LIVRAISONS</span>
      </div>

      {/* Earnings */}
      <div className="bg-guinea-yellow/10 rounded-2xl p-4 flex flex-col items-center">
        <div className="w-12 h-12 bg-guinea-yellow rounded-full flex items-center justify-center mb-2">
          <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-black text-guinea-yellow">
          {(todayEarnings / 1000).toFixed(0)}K
        </span>
        <span className="text-xs font-bold text-muted-foreground">GNF</span>
      </div>

      {/* Rating */}
      <div className="bg-primary/10 rounded-2xl p-4 flex flex-col items-center">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
          <Star className="w-6 h-6 text-white fill-white" strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-black text-primary">{rating.toFixed(1)}</span>
        <span className="text-xs font-bold text-muted-foreground">NOTE</span>
      </div>
    </div>
  );
};
