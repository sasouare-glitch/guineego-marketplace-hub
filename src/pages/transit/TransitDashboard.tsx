import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TransitLayout } from "@/components/transit/TransitLayout";
import { QuoteCalculator } from "@/components/transit/QuoteCalculator";
import { ShipmentCard } from "@/components/transit/ShipmentCard";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Plane, 
  Ship, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Plus
} from "lucide-react";

const stats = [
  { label: "Expéditions en cours", value: "3", icon: Package, color: "bg-blue-500" },
  { label: "Expéditions totales", value: "24", icon: TrendingUp, color: "bg-guinea-green" },
  { label: "Par avion", value: "8", icon: Plane, color: "bg-purple-500" },
  { label: "Par bateau", value: "16", icon: Ship, color: "bg-guinea-red" },
];

const recentShipments = [
  {
    id: "1",
    trackingNumber: "GGT-2024-08956",
    origin: "Guangzhou",
    destination: "Conakry",
    status: "in_transit" as const,
    method: "sea" as const,
    weight: "150 kg",
    createdAt: "10 Jan 2024",
    estimatedArrival: "15 Fév 2024",
    items: "Électronique, Textile"
  },
  {
    id: "2",
    trackingNumber: "GGT-2024-08847",
    origin: "Yiwu",
    destination: "Conakry",
    status: "customs" as const,
    method: "sea" as const,
    weight: "320 kg",
    createdAt: "25 Déc 2023",
    estimatedArrival: "5 Fév 2024",
    items: "Cosmétiques, Accessoires"
  },
  {
    id: "3",
    trackingNumber: "GGT-2024-08723",
    origin: "Shenzhen",
    destination: "Conakry",
    status: "pending" as const,
    method: "air" as const,
    weight: "25 kg",
    createdAt: "28 Jan 2024",
    estimatedArrival: "8 Fév 2024",
    items: "Téléphones, Accessoires"
  },
];

export default function TransitDashboard() {
  return (
    <TransitLayout 
      title="Tableau de bord" 
      subtitle="Gérez vos expéditions Chine-Guinée"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-5 border border-border"
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Link 
            to="/transit/quote"
            className="bg-gradient-to-r from-guinea-red to-red-600 rounded-2xl p-6 text-white group hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-xl mb-2">Nouveau devis</h3>
                <p className="text-white/80 text-sm">Calculez le coût de votre expédition</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </Link>
          <Link 
            to="/transit/tracking"
            className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white group hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-xl mb-2">Suivi de colis</h3>
                <p className="text-white/80 text-sm">Suivez vos expéditions en temps réel</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Recent Shipments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Expéditions récentes</h2>
              <p className="text-sm text-muted-foreground">Vos 3 dernières expéditions</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/transit/shipments">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentShipments.map((shipment, index) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <ShipmentCard {...shipment} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Price Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="font-display font-bold text-foreground">Grille tarifaire</h2>
            <p className="text-sm text-muted-foreground">Nos tarifs pour le transport Chine-Guinée</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-r border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Plane className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Transport aérien</p>
                  <p className="text-sm text-muted-foreground">7-10 jours</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix au kilo</span>
                  <span className="font-bold text-foreground">12 000 GNF/kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Minimum</span>
                  <span className="text-foreground">1 kg</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-guinea-red/10 rounded-xl flex items-center justify-center">
                  <Ship className="w-5 h-5 text-guinea-red" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Transport maritime</p>
                  <p className="text-sm text-muted-foreground">35-45 jours</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix au kilo</span>
                  <span className="font-bold text-foreground">3 500 GNF/kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prix au m³</span>
                  <span className="font-bold text-foreground">2 500 000 GNF/m³</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </TransitLayout>
  );
}
