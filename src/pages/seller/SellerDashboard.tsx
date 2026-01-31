import { motion } from "framer-motion";
import {
  Wallet,
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  Eye,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { StatCard } from "@/components/seller/StatCard";
import { SalesChart } from "@/components/seller/SalesChart";
import { RecentOrders } from "@/components/seller/RecentOrders";
import { LowStockAlert } from "@/components/seller/LowStockAlert";

export default function SellerDashboard() {
  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, voici un aperçu de votre boutique
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Chiffre d'affaires"
            value="4.920.000 GNF"
            change={12.5}
            changeLabel="vs mois dernier"
            icon={Wallet}
            iconColor="primary"
            delay={0}
          />
          <StatCard
            title="Commandes"
            value="127"
            change={8.2}
            changeLabel="ce mois"
            icon={ShoppingBag}
            iconColor="accent"
            delay={0.1}
          />
          <StatCard
            title="Produits actifs"
            value="48"
            change={-2}
            changeLabel="cette semaine"
            icon={Package}
            iconColor="muted"
            delay={0.15}
          />
          <StatCard
            title="Taux de conversion"
            value="3.2%"
            change={0.5}
            changeLabel="vs moyenne"
            icon={TrendingUp}
            iconColor="primary"
            delay={0.2}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Visiteurs uniques"
            value="1,234"
            change={15}
            changeLabel="cette semaine"
            icon={Eye}
            iconColor="accent"
            delay={0.25}
          />
          <StatCard
            title="Nouveaux clients"
            value="28"
            change={22}
            changeLabel="ce mois"
            icon={Users}
            iconColor="primary"
            delay={0.3}
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SalesChart />
          </div>
          <div>
            <LowStockAlert />
          </div>
        </div>

        {/* Recent Orders */}
        <RecentOrders />
      </div>
    </SellerLayout>
  );
}
