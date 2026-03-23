import { WelcomeBanner } from "@/components/onboarding/WelcomeBanner";
import { motion } from "framer-motion";
import {
  Wallet,
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  Eye,
  Loader2,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { StatCard } from "@/components/seller/StatCard";
import { SalesChart } from "@/components/seller/SalesChart";
import { RecentOrders } from "@/components/seller/RecentOrders";
import { LowStockAlert } from "@/components/seller/LowStockAlert";
import { ShareStoreCard } from "@/components/seller/ShareStoreCard";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import { useCurrency } from "@/hooks/useCurrency";

export default function SellerDashboard() {
  const { stats, orders, lowStockProducts, salesChartData, loading } = useSellerDashboard();
  const { format: formatPrice } = useCurrency();

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-4 sm:space-y-6">
        <WelcomeBanner
          role="ecommerce"
          title="Bienvenue sur votre espace vendeur"
          description="Commencez par ajouter vos premiers produits et personnaliser votre boutique pour attirer vos clients."
          steps={[
            { label: "Ajouter un produit", href: "/seller/products" },
            { label: "Mon profil boutique", href: "/seller/profile" },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Bienvenue, voici un aperçu de votre boutique
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          <StatCard
            title="Chiffre d'affaires"
            value={formatPrice(stats.totalRevenue)}
            icon={Wallet}
            iconColor="primary"
            delay={0}
            compact
          />
          <StatCard
            title="Commandes"
            value={stats.totalOrders.toString()}
            icon={ShoppingBag}
            iconColor="accent"
            delay={0.1}
            compact
          />
          <StatCard
            title="Produits en alerte"
            value={lowStockProducts.length.toString()}
            icon={Package}
            iconColor="destructive"
            delay={0.15}
            compact
          />
          <StatCard
            title="Taux de conversion"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            iconColor="primary"
            delay={0.2}
            compact
          />
          <StatCard
            title="Visiteurs"
            value={stats.uniqueVisitors.toString()}
            icon={Eye}
            iconColor="accent"
            delay={0.25}
            compact
          />
          <StatCard
            title="Nouveaux clients"
            value={stats.newCustomers.toString()}
            icon={Users}
            iconColor="primary"
            delay={0.3}
            compact
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2">
            <SalesChart data={salesChartData} />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <LowStockAlert products={lowStockProducts} />
            <ShareStoreCard />
          </div>
        </div>

        <RecentOrders orders={orders} />
      </div>
    </SellerLayout>
  );
}
