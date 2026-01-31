import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Users, Shield, Star, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  returnRate: string;
  duration: string;
  minInvestment: string;
  riskLevel: "low" | "medium" | "high";
  funded: number;
  target: string;
  investors: number;
  featured?: boolean;
}

export const OpportunityCard = ({
  id,
  title,
  category,
  image,
  returnRate,
  duration,
  minInvestment,
  riskLevel,
  funded,
  target,
  investors,
  featured = false
}: OpportunityCardProps) => {
  const riskConfig = {
    low: { label: "Risque faible", color: "bg-guinea-green/10 text-guinea-green" },
    medium: { label: "Risque modéré", color: "bg-guinea-yellow/10 text-guinea-yellow" },
    high: { label: "Risque élevé", color: "bg-guinea-red/10 text-guinea-red" }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={cn(
        "bg-card rounded-2xl border overflow-hidden card-hover",
        featured ? "border-guinea-yellow" : "border-border"
      )}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-guinea-yellow text-guinea-yellow-foreground px-3 py-1 rounded-full text-xs font-bold">
            <Star className="w-3 h-3" />
            Recommandé
          </div>
        )}
        
        <Badge className={cn("absolute top-3 right-3", riskConfig[riskLevel].color)}>
          <Shield className="w-3 h-3 mr-1" />
          {riskConfig[riskLevel].label}
        </Badge>

        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-block px-2 py-1 bg-white/90 text-foreground rounded-full text-xs font-medium">
            {category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-foreground text-lg line-clamp-2 mb-3">
          {title}
        </h3>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-guinea-green/5 rounded-xl">
            <TrendingUp className="w-4 h-4 text-guinea-green mx-auto mb-1" />
            <p className="text-lg font-bold text-guinea-green">{returnRate}</p>
            <p className="text-xs text-muted-foreground">Rendement</p>
          </div>
          <div className="text-center p-2 bg-secondary rounded-xl">
            <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{duration}</p>
            <p className="text-xs text-muted-foreground">Durée</p>
          </div>
          <div className="text-center p-2 bg-secondary rounded-xl">
            <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{investors}</p>
            <p className="text-xs text-muted-foreground">Investisseurs</p>
          </div>
        </div>

        {/* Funding progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Financement</span>
            <span className="font-medium text-foreground">{funded}%</span>
          </div>
          <Progress value={funded} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Objectif: {target}</p>
        </div>

        {/* Min investment & CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Minimum</p>
            <p className="font-bold text-foreground">{minInvestment}</p>
          </div>
          <Button asChild size="sm">
            <Link to={`/investor/opportunity/${id}`}>
              Voir détails
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
