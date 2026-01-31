import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface InvestmentCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  investedAmount: string;
  currentValue: string;
  returnAmount: string;
  returnPercentage: string;
  isPositive: boolean;
  startDate: string;
  endDate: string;
  progress: number;
  status: "active" | "completed" | "pending";
}

export const InvestmentCard = ({
  id,
  title,
  category,
  image,
  investedAmount,
  currentValue,
  returnAmount,
  returnPercentage,
  isPositive,
  startDate,
  endDate,
  progress,
  status
}: InvestmentCardProps) => {
  const statusConfig = {
    active: { label: "En cours", color: "bg-guinea-green/10 text-guinea-green border-guinea-green/20" },
    completed: { label: "Terminé", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    pending: { label: "En attente", color: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 card-hover"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-display font-semibold text-foreground line-clamp-1">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
            <Badge className={statusConfig[status].color}>
              {statusConfig[status].label}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {startDate} - {endDate}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Investi</p>
              <p className="font-semibold text-foreground">{investedAmount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valeur actuelle</p>
              <p className="font-semibold text-foreground">{currentValue}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Rendement</p>
              <div className={cn(
                "flex items-center gap-1 font-bold",
                isPositive ? "text-guinea-green" : "text-guinea-red"
              )}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{returnAmount}</span>
                <span className="text-sm">({returnPercentage})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action */}
      <Link 
        to={`/investor/investment/${id}`}
        className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Voir les détails
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
};
