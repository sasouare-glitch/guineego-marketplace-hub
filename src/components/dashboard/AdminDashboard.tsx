/**
 * ADMIN DASHBOARD: Real-time KPIs and Charts
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Truck, 
  Users,
  Package,
  Phone,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useAdminDashboard, useDailyReports } from '@/hooks/useAnalytics';
import { useCurrency } from '@/hooks/useCurrency';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#10B981', '#F59E0B'];

// Helper to use format from useCurrency
const useFormatPrice = () => {
  const { format } = useCurrency();
  return { formatPrice: format };
};

export function AdminDashboard() {
  const { realtime, rolling, today, trends, weeklyReports, loading } = useAdminDashboard();
  const { reports: monthlyReports } = useDailyReports(30);
  const { formatPrice } = useFormatPrice();
  
  const [period, setPeriod] = useState<'7' | '30'>('7');

  const selectedRolling = period === '7' ? rolling?.rolling7 : rolling?.rolling30;

  // Prepare chart data
  const revenueChartData = weeklyReports
    .slice(0, 7)
    .reverse()
    .map(r => ({
      date: new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      gmv: r.gmv,
      orders: r.totalOrders
    }));

  const hourlyData = realtime?.hourly 
    ? Object.entries(realtime.hourly).map(([hour, data]) => ({
        hour: `${hour}h`,
        revenue: (data as any).revenue || 0,
        orders: (data as any).purchases || 0
      }))
    : [];

  const communeData = today?.topCommunes?.slice(0, 5) || [];
  const categoryData = today?.topCategories?.slice(0, 5) || [];
  const paymentData = today?.paymentMethodBreakdown 
    ? Object.entries(today.paymentMethodBreakdown).map(([method, data]) => ({
        name: formatPaymentMethod(method),
        value: data.count
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Direction</h1>
          <p className="text-muted-foreground">Vue d'ensemble des performances GuineeGo</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as '7' | '30')}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 derniers jours</SelectItem>
            <SelectItem value="30">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="GMV Total"
          value={formatPrice(selectedRolling?.gmv || 0)}
          trend={trends?.gmv}
          icon={DollarSign}
          color="primary"
        />
        <KPICard
          title="Commandes"
          value={(selectedRolling?.orders || 0).toString()}
          trend={trends?.orders}
          icon={ShoppingCart}
          color="accent"
        />
        <KPICard
          title="Livraisons"
          value={(selectedRolling?.deliveries || 0).toString()}
          trend={trends?.deliveries}
          icon={Truck}
          color="primary"
        />
        <KPICard
          title="Nouveaux Utilisateurs"
          value={(selectedRolling?.newUsers || 0).toString()}
          trend={trends?.newUsers}
          icon={Users}
          color="accent"
        />
      </div>

      {/* Real-time Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Activité en temps réel
              </CardTitle>
              <CardDescription>Aujourd'hui</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              MAJ automatique
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <RealtimeStat label="Achats" value={realtime?.purchases || 0} />
            <RealtimeStat label="Revenus" value={formatPrice(realtime?.revenue || 0)} />
            <RealtimeStat label="Ajouts panier" value={realtime?.addToCart || 0} />
            <RealtimeStat label="Checkouts" value={realtime?.checkouts || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Évolution du CA</CardTitle>
            <CardDescription>GMV et commandes sur 7 jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0]?.payload.date}</p>
                            <p className="text-sm text-muted-foreground">
                              GMV: {formatPrice(payload[0]?.value as number)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Commandes: {payload[0]?.payload.orders}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gmv" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorGmv)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Activité par heure</CardTitle>
            <CardDescription>Distribution des ventes aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0]?.payload.hour}</p>
                            <p className="text-sm text-primary">
                              Revenus: {formatPrice(payload[0]?.value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Communes */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Top Communes</CardTitle>
            <CardDescription>Par nombre de commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communeData.map((c, i) => (
                <div key={c.commune} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground">{c.commune}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{c.orders} cmd</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(c.revenue)}</p>
                  </div>
                </div>
              ))}
              {communeData.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Pas de données</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Moyens de paiement</CardTitle>
            <CardDescription>Répartition aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Closer Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Performance Closers
            </CardTitle>
            <CardDescription>Aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Appels effectués</span>
                <span className="font-bold text-foreground">
                  {today?.closerPerformance?.totalCalls || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Conversions</span>
                <span className="font-bold text-primary">
                  {today?.closerPerformance?.conversions || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Taux de conversion</span>
                <Badge variant={
                  (today?.closerPerformance?.conversionRate || 0) >= 30 ? 'default' : 'secondary'
                }>
                  {(today?.closerPerformance?.conversionRate || 0).toFixed(1)}%
                </Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Objectif: 35%</span>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${Math.min(100, ((today?.closerPerformance?.conversionRate || 0) / 35) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-components
interface KPICardProps {
  title: string;
  value: string;
  trend?: number | null;
  icon: React.ElementType;
  color: 'primary' | 'accent';
}

function KPICard({ title, value, trend, icon: Icon, color }: KPICardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-6 border border-border"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend !== undefined && trend !== null && (
            <div className="flex items-center gap-1">
              {isPositive && <ArrowUpRight className="w-4 h-4 text-primary" />}
              {isNegative && <ArrowDownRight className="w-4 h-4 text-destructive" />}
              <span className={`text-sm font-medium ${
                isPositive ? 'text-primary' : isNegative ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {isPositive && '+'}
                {trend.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs hier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${
          color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

function RealtimeStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    orange_money: 'Orange Money',
    mtn_money: 'MTN Money',
    card: 'Carte',
    wallet: 'Wallet',
    cash: 'Espèces'
  };
  return labels[method] || method;
}
