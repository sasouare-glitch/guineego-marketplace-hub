import { useState } from "react";
import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/investor/InvestorLayout";
import { OpportunityCard } from "@/components/investor/OpportunityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, SlidersHorizontal, TrendingUp, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = ["Tous", "E-commerce", "Immobilier", "Agriculture", "Transit", "Tech"];

const opportunities = [
  {
    id: "1",
    title: "Marketplace mode africaine - Expansion régionale",
    category: "E-commerce",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
    returnRate: "18%",
    duration: "12 mois",
    minInvestment: "1 000 000 GNF",
    riskLevel: "medium" as const,
    funded: 72,
    target: "50 000 000 GNF",
    investors: 45,
    featured: true
  },
  {
    id: "2",
    title: "Complexe résidentiel Kipé - Phase 2",
    category: "Immobilier",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
    returnRate: "22%",
    duration: "24 mois",
    minInvestment: "5 000 000 GNF",
    riskLevel: "low" as const,
    funded: 45,
    target: "200 000 000 GNF",
    investors: 28
  },
  {
    id: "3",
    title: "Ferme avicole moderne - Kindia",
    category: "Agriculture",
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=300&fit=crop",
    returnRate: "15%",
    duration: "18 mois",
    minInvestment: "500 000 GNF",
    riskLevel: "low" as const,
    funded: 88,
    target: "30 000 000 GNF",
    investors: 67
  },
  {
    id: "4",
    title: "Import containers Guangzhou-Conakry",
    category: "Transit",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&h=300&fit=crop",
    returnRate: "25%",
    duration: "6 mois",
    minInvestment: "2 000 000 GNF",
    riskLevel: "high" as const,
    funded: 60,
    target: "100 000 000 GNF",
    investors: 34
  },
  {
    id: "5",
    title: "App de livraison - Développement V2",
    category: "Tech",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    returnRate: "30%",
    duration: "18 mois",
    minInvestment: "3 000 000 GNF",
    riskLevel: "high" as const,
    funded: 35,
    target: "80 000 000 GNF",
    investors: 22
  },
  {
    id: "6",
    title: "Supermarché bio - Ratoma",
    category: "E-commerce",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
    returnRate: "16%",
    duration: "12 mois",
    minInvestment: "1 500 000 GNF",
    riskLevel: "low" as const,
    funded: 92,
    target: "40 000 000 GNF",
    investors: 56
  }
];

export default function InvestorOpportunities() {
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesCategory = selectedCategory === "Tous" || opp.category === selectedCategory;
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <InvestorLayout 
      title="Opportunités" 
      subtitle="Découvrez les projets à financer"
    >
      <div className="space-y-6">
        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-guinea-green/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-guinea-green rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-guinea-green">18.5%</p>
              <p className="text-sm text-muted-foreground">Rendement moyen</p>
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">98%</p>
              <p className="text-sm text-muted-foreground">Taux de succès</p>
            </div>
          </div>
          <div className="bg-guinea-yellow/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-guinea-yellow rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-guinea-yellow">12</p>
              <p className="text-sm text-muted-foreground">Projets actifs</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtres
          </Button>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 overflow-x-auto pb-2"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex-shrink-0"
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Tabs for sorting */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="trending">Tendances</TabsTrigger>
            <TabsTrigger value="ending">Bientôt clôturées</TabsTrigger>
            <TabsTrigger value="new">Nouvelles</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <OpportunityCard {...opportunity} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.filter(o => o.featured || o.investors > 40).map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <OpportunityCard {...opportunity} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.filter(o => o.funded > 80).map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <OpportunityCard {...opportunity} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.filter(o => o.funded < 50).map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <OpportunityCard {...opportunity} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </InvestorLayout>
  );
}
