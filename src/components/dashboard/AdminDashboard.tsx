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
  ArrowDownRight,
  Store,
  GraduationCap,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Banknote,
  Target,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Legend,
  ComposedChart
} from 'recharts';
import { useAdminDashboard, useDailyReports } from '@/hooks/useAnalytics';
import { useCurrency } from '@/hooks/useCurrency';

const COLORS = ['hsl(var(--primary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const useFormatPrice = () => {
  const { format } = useCurrency();
  return { formatPrice: format };
};

// Mock alerts for UI
const recentAlerts = [
  { type: 'warning', message: 'Stock faible : Téléphone Samsung A54 (3 restants)', time: 'Il y a 5 min' },
  { type: 'success', message: 'Nouveau vendeur vérifié : TechStore Conakry', time: 'Il y a 12 min' },
  { type: 'error', message: 'Livraison #ORD-2847 en retard de 2h', time: 'Il y a 30 min' },
  { type: 'success', message: 'Paiement reçu : 4 500 000 GNF via Orange Money', time: 'Il y a 1h' },
];

// Mock top sellers
const topSellers = [
  { name: 'TechStore GN', sales: 847, revenue: 48500000, trend: 12.4 },
  { name: 'Mode Africaine', sales: 623, revenue: 31200000, trend: 8.1 },
  { name: 'ElectroConakry', sales: 512, revenue: 27800000, trend: -3.2 },
  { name: 'BioShop Guinea', sales: 389, revenue: 19400000, trend: 22.7 },
  { name: 'SportZone GN', sales: 271, revenue: 14900000, trend: 5.3 },
];

// Mock monthly objectives
const objectives = [
  { label: 'GMV mensuel', current: 842000000, target: 1000000000 },
  { label: 'Nouvelles inscriptions', current: 1240, target: 2000 },
  { label: 'Taux de livraison', current: 87, target: 95, isPercent: true },
  { label: 'Satisfaction client', current: 4.2, target: 4.8, isRating: true },
];

export function AdminDashboard() {
  const { realtime, rolling, today, trends, weeklyReports, loading } = useAdminDashboard();
  const { reports: monthlyReports } = useDailyReports(30);
  const { formatPrice } = useFormatPrice();
  
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const [activeTab, setActiveTab] = useState('overview');

  const selectedRolling = period === '7' ? rolling?.rolling7 : rolling?.rolling30;

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
    : [
        { name: 'Orange Money', value: 45 },
        { name: 'MTN Money', value: 30 },
        { name: 'Espèces', value: 15 },
        { name: 'Carte', value: 10 },
      ];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Direction</h1>
          <p className="text-muted-foreground capitalize">{dateStr} · {timeStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
          <Select value={period} onValueChange={(v) => setPeriod(v as '7' | '30')}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Real-time pulse banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-sm font-semibold text-foreground">Temps réel</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <span className="text-muted-foreground">Achats: <strong className="text-foreground">{realtime?.purchases || 0}</strong></span>
            <span className="text-muted-foreground">Revenus: <strong className="text-primary">{formatPrice(realtime?.revenue || 0)}</strong></span>
            <span className="text-muted-foreground">Paniers: <strong className="text-foreground">{realtime?.addToCart || 0}</strong></span>
            <span className="text-muted-foreground">Checkouts: <strong className="text-foreground">{realtime?.checkouts || 0}</strong></span>
            <span className="text-muted-foreground">Utilisateurs actifs: <strong className="text-foreground">{realtime?.checkouts || 0}</strong></span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="GMV Total"
          value={formatPrice(selectedRolling?.gmv || 0)}
          trend={trends?.gmv}
          icon={DollarSign}
          color="primary"
          subtitle={`Sur ${period} jours`}
        />
        <KPICard
          title="Commandes"
          value={(selectedRolling?.orders || 0).toLocaleString()}
          trend={trends?.orders}
          icon={ShoppingCart}
          color="success"
          subtitle="Toutes sources"
        />
        <KPICard
          title="Livraisons"
          value={(selectedRolling?.deliveries || 0).toLocaleString()}
          trend={trends?.deliveries}
          icon={Truck}
          color="warning"
          subtitle="87% à l'heure"
        />
        <KPICard
          title="Nouveaux Utilisateurs"
          value={(selectedRolling?.newUsers || 0).toLocaleString()}
          trend={trends?.newUsers}
          icon={Users}
          color="accent"
          subtitle="Inscrits"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Vendeurs actifs', value: '48', icon: Store, color: 'text-primary' },
          { label: 'Produits en ligne', value: '1 247', icon: Package, color: 'text-primary' },
          { label: 'Étudiants Academy', value: '312', icon: GraduationCap, color: 'text-primary' },
          { label: 'Expéditions transit', value: '23', icon: Globe, color: 'text-primary' },
          { label: 'Coursiers actifs', value: '67', icon: Truck, color: 'text-primary' },
          { label: 'Taux de conversion', value: '3.4%', icon: Target, color: 'text-primary' },
        ].map((item) => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <item.icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
        </TabsList>

        {/* TAB: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Évolution du CA</CardTitle>
                <CardDescription>GMV et commandes sur {period} jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium mb-1">{payload[0]?.payload.date}</p>
                                <p className="text-sm text-primary">GMV: {formatPrice(payload[0]?.value as number)}</p>
                                <p className="text-sm text-muted-foreground">Commandes: {payload[1]?.value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorGmv)" />
                      <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--primary))" opacity={0.3} radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Moyens de paiement</CardTitle>
                <CardDescription>Répartition sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-[200px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                          {paymentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {paymentData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.value}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Objectives */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Objectifs du mois
              </CardTitle>
              <CardDescription>Progression vers les objectifs mensuels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {objectives.map((obj) => {
                  const progress = obj.isPercent || obj.isRating
                    ? (obj.current / obj.target) * 100
                    : (obj.current / obj.target) * 100;
                  const displayCurrent = obj.isPercent
                    ? `${obj.current}%`
                    : obj.isRating
                    ? `${obj.current}/5`
                    : formatPrice(obj.current);
                  const displayTarget = obj.isPercent
                    ? `${obj.target}%`
                    : obj.isRating
                    ? `${obj.target}/5`
                    : formatPrice(obj.target);

                  return (
                    <div key={obj.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-foreground">{obj.label}</p>
                        <Badge variant={progress >= 80 ? 'default' : progress >= 50 ? 'secondary' : 'destructive'} className="text-xs">
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={Math.min(100, progress)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{displayCurrent}</span>
                        <span>/{displayTarget}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SALES */}
        <TabsContent value="sales" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Activité par heure</CardTitle>
                <CardDescription>Distribution des ventes aujourd'hui</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{payload[0]?.payload.hour}</p>
                                <p className="text-sm text-primary">Revenus: {formatPrice(payload[0]?.value as number)}</p>
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

            {/* Top Communes */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Top Communes</CardTitle>
                <CardDescription>Par nombre de commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(communeData.length > 0 ? communeData : [
                    { commune: 'Kaloum', orders: 324, revenue: 18200000 },
                    { commune: 'Ratoma', orders: 287, revenue: 14500000 },
                    { commune: 'Matam', orders: 198, revenue: 9800000 },
                    { commune: 'Dixinn', orders: 156, revenue: 7200000 },
                    { commune: 'Matoto', orders: 134, revenue: 6100000 },
                  ]).map((c: any, i: number) => (
                    <div key={c.commune} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <span className="font-medium text-foreground text-sm">{c.commune}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{c.orders} cmd</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(c.orders / 324) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-24 text-right">{formatPrice(c.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Sellers */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Top Vendeurs
              </CardTitle>
              <CardDescription>Classement par chiffre d'affaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4">#</th>
                      <th className="text-left text-xs font-medium text-muted-foreground py-3 pr-4">Vendeur</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 pr-4">Ventes</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3 pr-4">CA</th>
                      <th className="text-right text-xs font-medium text-muted-foreground py-3">Tendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellers.map((seller, i) => (
                      <tr key={seller.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground text-sm">{seller.name}</p>
                        </td>
                        <td className="py-3 pr-4 text-right text-sm text-muted-foreground">
                          {seller.sales.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right text-sm font-medium text-foreground">
                          {formatPrice(seller.revenue)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-sm font-medium flex items-center justify-end gap-1 ${
                            seller.trend > 0 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {seller.trend > 0 
                              ? <ArrowUpRight className="w-3 h-3" /> 
                              : <ArrowDownRight className="w-3 h-3" />
                            }
                            {Math.abs(seller.trend)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: OPERATIONS */}
        <TabsContent value="operations" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Closer Performance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Performance Closers
                </CardTitle>
                <CardDescription>Équipe de vente téléphonique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">{today?.closerPerformance?.totalCalls || 0}</p>
                    <p className="text-xs text-muted-foreground">Appels</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary">{today?.closerPerformance?.conversions || 0}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-foreground">
                      {(today?.closerPerformance?.conversionRate || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Taux conv.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Objectif 35%</span>
                    <span className="font-medium text-foreground">
                      {(today?.closerPerformance?.conversionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, ((today?.closerPerformance?.conversionRate || 0) / 35) * 100)} 
                    className="h-2" 
                  />
                </div>
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Répartition des appels</p>
                  {[
                    { label: 'Répondus', value: 78, color: 'bg-primary' },
                    { label: 'Manqués', value: 14, color: 'bg-destructive' },
                    { label: 'Rappels planifiés', value: 8, color: 'bg-yellow-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="flex-1 text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Performance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Performance Livraisons
                </CardTitle>
                <CardDescription>Aujourd'hui</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'En transit', value: 42, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Livrées', value: 137, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'En retard', value: 8, color: 'text-destructive', bg: 'bg-destructive/10' },
                    { label: 'Annulées', value: 3, color: 'text-muted-foreground', bg: 'bg-muted' },
                  ].map(item => (
                    <div key={item.label} className={`${item.bg} rounded-lg p-4 text-center`}>
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux de livraison à l'heure</span>
                    <span className="font-medium text-foreground">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Temps moyen de livraison</span>
                    <Badge variant="secondary">2h 14min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transit & Academy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Transit Chine-Guinée
                </CardTitle>
                <CardDescription>Expéditions en cours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'TRX-2024-089', status: 'En mer', eta: '15 mars', weight: '234 kg', pieces: 48 },
                  { id: 'TRX-2024-090', status: 'En douane', eta: '8 mars', weight: '178 kg', pieces: 32 },
                  { id: 'TRX-2024-091', status: 'Prêt à expédier', eta: '22 mars', weight: '312 kg', pieces: 67 },
                ].map(shipment => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{shipment.id}</p>
                      <p className="text-xs text-muted-foreground">{shipment.weight} · {shipment.pieces} colis</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1">{shipment.status}</Badge>
                      <p className="text-xs text-muted-foreground">ETA: {shipment.eta}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Academy
                </CardTitle>
                <CardDescription>Formations et certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">312</p>
                    <p className="text-xs text-muted-foreground">Étudiants</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-foreground">18</p>
                    <p className="text-xs text-muted-foreground">Cours actifs</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xl font-bold text-primary">67</p>
                    <p className="text-xs text-muted-foreground">Certifiés</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'E-commerce 101', students: 124, completion: 72 },
                    { name: 'Logistique & Livraison', students: 89, completion: 58 },
                    { name: 'Marketing Digital', students: 67, completion: 43 },
                  ].map(course => (
                    <div key={course.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{course.name}</span>
                        <span className="text-muted-foreground">{course.students} étudiants</span>
                      </div>
                      <Progress value={course.completion} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: ALERTS */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Alertes & Activité récente
                  </CardTitle>
                  <CardDescription>Événements nécessitant votre attention</CardDescription>
                </div>
                <Badge variant="destructive">4 nouvelles</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className={`mt-0.5 shrink-0 ${
                      alert.type === 'warning' ? 'text-yellow-500' :
                      alert.type === 'error' ? 'text-destructive' :
                      'text-primary'
                    }`}>
                      {alert.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                      {alert.type === 'error' && <AlertTriangle className="w-4 h-4" />}
                      {alert.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.time}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs shrink-0">Voir</Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Actions en attente</CardTitle>
              <CardDescription>Nécessitent votre validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Vendeurs à valider', count: 3, action: 'Valider', href: '/admin/sellers' },
                  { label: 'Retraits en attente', count: 7, action: 'Traiter', href: '/admin/finances' },
                  { label: 'Signalements produits', count: 2, action: 'Examiner', href: '/admin/products' },
                  { label: 'Litiges commandes', count: 5, action: 'Résoudre', href: '/admin/orders' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="w-7 h-7 p-0 flex items-center justify-center rounded-full text-xs">
                        {item.count}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">{item.action}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
interface KPICardProps {
  title: string;
  value: string;
  trend?: number | null;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'accent';
  subtitle?: string;
}

function KPICard({ title, value, trend, icon: Icon, color, subtitle }: KPICardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    accent: 'bg-violet-500/10 text-violet-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        {trend !== undefined && trend !== null ? (
          <div className="flex items-center gap-1">
            {isPositive && <ArrowUpRight className="w-3.5 h-3.5 text-primary" />}
            {isNegative && <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />}
            <span className={`text-xs font-medium ${
              isPositive ? 'text-primary' : isNegative ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {isPositive && '+'}{trend.toFixed(1)}% vs hier
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </motion.div>
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
