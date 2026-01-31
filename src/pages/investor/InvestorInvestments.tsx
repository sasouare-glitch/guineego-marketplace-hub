import { useState } from "react";
import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/investor/InvestorLayout";
import { InvestmentCard } from "@/components/investor/InvestmentCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter } from "lucide-react";

const investments = [
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
  },
  {
    id: "4",
    title: "Résidence haut standing Kipé",
    category: "Immobilier",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=200&fit=crop",
    investedAmount: "8 000 000 GNF",
    currentValue: "9 600 000 GNF",
    returnAmount: "+1 600 000 GNF",
    returnPercentage: "+20%",
    isPositive: true,
    startDate: "Nov 2023",
    endDate: "Nov 2024",
    progress: 100,
    status: "completed" as const
  },
  {
    id: "5",
    title: "Startup fintech mobile money",
    category: "Tech",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop",
    investedAmount: "3 000 000 GNF",
    currentValue: "2 850 000 GNF",
    returnAmount: "-150 000 GNF",
    returnPercentage: "-5%",
    isPositive: false,
    startDate: "Avr 2024",
    endDate: "Oct 2024",
    progress: 60,
    status: "active" as const
  },
  {
    id: "6",
    title: "Restaurant fusion Almamya",
    category: "Restauration",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
    investedAmount: "4 500 000 GNF",
    currentValue: "4 500 000 GNF",
    returnAmount: "0 GNF",
    returnPercentage: "0%",
    isPositive: true,
    startDate: "Juin 2024",
    endDate: "Déc 2024",
    progress: 10,
    status: "pending" as const
  }
];

export default function InvestorInvestments() {
  const activeInvestments = investments.filter(i => i.status === "active");
  const completedInvestments = investments.filter(i => i.status === "completed");
  const pendingInvestments = investments.filter(i => i.status === "pending");

  const totalInvested = "45 500 000 GNF";
  const totalReturns = "+8 750 000 GNF";

  return (
    <InvestorLayout 
      title="Mes placements" 
      subtitle="Gérez vos investissements"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Total investi</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalInvested}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Rendements totaux</p>
            <p className="text-2xl font-bold text-guinea-green mt-1">{totalReturns}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Placements actifs</p>
            <p className="text-2xl font-bold text-foreground mt-1">{activeInvestments.length}</p>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-sm text-muted-foreground">Placements terminés</p>
            <p className="text-2xl font-bold text-foreground mt-1">{completedInvestments.length}</p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div />
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              En cours ({activeInvestments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminés ({completedInvestments.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              En attente ({pendingInvestments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6 space-y-4">
            {activeInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvestmentCard {...investment} />
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="mt-6 space-y-4">
            {completedInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvestmentCard {...investment} />
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingInvestments.map((investment, index) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvestmentCard {...investment} />
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </InvestorLayout>
  );
}
