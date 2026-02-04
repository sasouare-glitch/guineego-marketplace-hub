/**
 * ECOM DASHBOARD: Seller Performance Analytics
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Users,
  Star,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useEcomPerformance } from '@/hooks/useAnalytics';
import { useCurrency } from '@/hooks/useCurrency';
import { useAuth } from '@/lib/firebase/auth';
import { StatCard } from '@/components/seller/StatCard';

export function EcomDashboard() {
  const { profile, user } = useAuth();
  const ecomId = profile?.claims?.ecommerceId || user?.uid;
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(dateRange));

  const { data: performance, isLoading } = useEcomPerformance(ecomId || '', startDate);
  const { format: formatPrice } = useCurrency();

  if (isLoading || !performance) {
    return <DashboardSkeleton />;
  }

  // Calculate funnel metrics
  const funnelData = [
    { name: 'Visiteurs', value: 100, fill: 'hsl(var(--muted))' },
    { name: 'Panier', value: 35, fill: 'hsl(var(--accent))' },
    { name: 'Checkout', value: 20, fill: 'hsl(var(--primary) / 0.7)' },
    { name: 'Achat', value: performance.conversionRate, fill: 'hsl(var(--primary))' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon Dashboard</h1>
          <p className="text-muted-foreground">{performance.period}</p>
        </div>
        <div className="flex gap-2">
          {['7', '30', '90'].map((d) => (
            <Button
              key={d}
              variant={dateRange === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(d as '7' | '30' | '90')}
            >
              {d}j
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chiffre d'affaires"
          value={formatPrice(performance.totalRevenue)}
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Commandes"
          value={performance.totalOrders.toString()}
          icon={ShoppingCart}
          iconColor="accent"
        />
        <StatCard
          title="Panier moyen"
          value={formatPrice(performance.averageOrderValue)}
          icon={Package}
          iconColor="primary"
        />
        <StatCard
          title="Taux de conversion"
          value={`${performance.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          iconColor="accent"
        />
      </div>

      {/* Alerts */}
      {(performance.abandonedCarts > 5 || performance.returnRate > 10) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {performance.abandonedCarts > 5 && (
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-2 rounded-full bg-destructive/20">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {performance.abandonedCarts} paniers abandonnés
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Relancez vos clients pour récupérer ces ventes
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Voir
                </Button>
              </CardContent>
            </Card>
          )}
          {performance.returnRate > 10 && (
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-2 rounded-full bg-accent/20">
                  <AlertTriangle className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Taux de retour élevé ({performance.returnRate.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez la qualité de vos produits
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Produits les plus vendus</CardTitle>
            <CardDescription>Par chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performance.topProducts.slice(0, 5).map((product, i) => (
                <div key={product.productId} className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} vendus</p>
                  </div>
                  <p className="font-bold text-foreground">{formatPrice(product.revenue)}</p>
                </div>
              ))}
              {performance.topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune vente sur cette période
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Entonnoir de conversion</CardTitle>
            <CardDescription>Du visiteur à l'achat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={funnelData} 
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    className="text-sm"
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                  >
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux clients</p>
                <p className="text-2xl font-bold text-foreground">{performance.newCustomers}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients fidèles</p>
                <p className="text-2xl font-bold text-foreground">{performance.returningCustomers}</p>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction client</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {performance.customerSatisfaction.toFixed(1)}
                  </p>
                  <Star className="w-5 h-5 text-accent fill-accent" />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <Star className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
