import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/investor/InvestorLayout";
import { PortfolioStats } from "@/components/investor/PortfolioStats";
import { PortfolioChart } from "@/components/investor/PortfolioChart";
import { InvestmentCard } from "@/components/investor/InvestmentCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const recentInvestments = [
  {
    id: "1",
    title: "Expansion boutique mode Conakry",
    category: "E-commerce",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    investedAmount: "5 000 000 GNF",
    currentValue: "5 750 000 GNF",
    returnAmount: "+750 000 GNF",
    returnPercentage: "+15%",
    isPositive: true,
    startDate: "Jan 2024",
    endDate: "Juil 2024",
    progress: 85,
    status: "active" as const
  },
  {
    id: "2",
    title: "Ferme agricole Kindia",
    category: "Agriculture",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=200&h=200&fit=crop",
    investedAmount: "10 000 000 GNF",
    currentValue: "11 200 000 GNF",
    returnAmount: "+1 200 000 GNF",
    returnPercentage: "+12%",
    isPositive: true,
    startDate: "Fév 2024",
    endDate: "Fév 2025",
    progress: 50,
    status: "active" as const
  },
  {
    id: "3",
    title: "Import container Chine-Guinée",
    category: "Transit",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=200&h=200&fit=crop",
    investedAmount: "15 000 000 GNF",
    currentValue: "17 850 000 GNF",
    returnAmount: "+2 850 000 GNF",
    returnPercentage: "+19%",
    isPositive: true,
    startDate: "Mar 2024",
    endDate: "Sept 2024",
    progress: 70,
    status: "active" as const
  }
];

export default function InvestorDashboard() {
  return (
    <InvestorLayout 
      title="Portfolio" 
      subtitle="Vue d'ensemble de vos investissements"
    >
      <div className="space-y-6">
        <WelcomeBanner
          role="investor"
          title="Bienvenue dans votre espace investisseur"
          description="Explorez les opportunités d'investissement et commencez à faire fructifier votre capital avec GuineeGo."
          steps={[
            { label: "Voir les opportunités", href: "/investor/opportunities" },
            { label: "Mes investissements", href: "/investor/investments" },
          ]}
        />
        {/* Stats */}
        <PortfolioStats />

        {/* Charts */}
        <PortfolioChart />

        {/* Recent Investments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Placements actifs</h2>
              <p className="text-sm text-muted-foreground">Vos investissements en cours</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/investor/investments">
                  Voir tout
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button asChild>
                <Link to="/investor/opportunities">
                  <Plus className="w-4 h-4 mr-1" />
                  Investir
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {recentInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <InvestmentCard {...investment} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
