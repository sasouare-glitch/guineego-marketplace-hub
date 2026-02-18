/**
 * Admin Analytics Page - KPIs and Reporting
 */

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Truck, GraduationCap, Banknote, Package } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const revenueData = [
  { month: 'Août',  gmv: 48000000, commissions: 4800000, transit: 8200000 },
  { month: 'Sep',   gmv: 52000000, commissions: 5200000, transit: 9100000 },
  { month: 'Oct',   gmv: 61000000, commissions: 6100000, transit: 11200000 },
  { month: 'Nov',   gmv: 75000000, commissions: 7500000, transit: 13400000 },
  { month: 'Déc',   gmv: 98000000, commissions: 9800000, transit: 15800000 },
  { month: 'Jan',   gmv: 84000000, commissions: 8400000, transit: 14200000 },
];

const ordersData = [
  { day: 'Lun', commandes: 42, livraisons: 38, annulations: 4 },
  { day: 'Mar', commandes: 58, livraisons: 52, annulations: 6 },
  { day: 'Mer', commandes: 51, livraisons: 48, annulations: 3 },
  { day: 'Jeu', commandes: 67, livraisons: 61, annulations: 6 },
  { day: 'Ven', commandes: 89, livraisons: 82, annulations: 7 },
  { day: 'Sam', commandes: 112, livraisons: 105, annulations: 7 },
  { day: 'Dim', commandes: 78, livraisons: 72, annulations: 6 },
];

const categoryData = [
  { name: 'Électronique',  value: 35, color: 'hsl(var(--primary))' },
  { name: 'Mode',          value: 22, color: 'hsl(var(--chart-2))' },
  { name: 'Alimentation',  value: 18, color: 'hsl(var(--chart-3))' },
  { name: 'Maison',        value: 14, color: 'hsl(var(--chart-4))' },
  { name: 'Autres',        value: 11, color: 'hsl(var(--chart-5))' },
];

const kpis = [
  {
    title: 'GMV ce mois',
    value: '84 000 000 GNF',
    change: +8.2,
    icon: Banknote,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'Nouvelles commandes',
    value: '497',
    change: +12.4,
    icon: ShoppingCart,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Nouveaux utilisateurs',
    value: '1 248',
    change: +5.7,
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Livraisons réussies',
    value: '94.2%',
    change: +1.3,
    icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'Inscrits Academy',
    value: '1 148',
    change: +18.9,
    icon: GraduationCap,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Produits actifs',
    value: '3 412',
    change: +3.1,
    icon: Package,
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10',
  },
];

export default function AdminAnalyticsPage() {
  const { format } = useCurrency();

  return (
    <AdminLayout title="Analytiques" description="KPIs et rapports de performance">
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            const isPositive = kpi.change > 0;
            return (
              <Card key={kpi.title}>
                <CardContent className="pt-5 pb-4">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                  </div>
                  <p className="text-xl font-bold leading-tight">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">{kpi.title}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-destructive'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{kpi.change}% vs mois dernier
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue">
          <TabsList>
            <TabsTrigger value="revenue">Revenus</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
          </TabsList>

          {/* Revenue Chart */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus (6 mois)</CardTitle>
                <CardDescription>GMV, commissions marketplace et revenus transit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: number) => format(v)} labelClassName="font-medium" />
                    <Legend />
                    <Area type="monotone" dataKey="gmv" name="GMV" stroke="hsl(var(--primary))" fill="url(#gmvGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="commissions" name="Commissions" stroke="hsl(var(--chart-2))" fill="url(#commGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="transit" name="Transit" stroke="hsl(var(--chart-3))" fill="none" strokeWidth={2} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Chart */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Commandes cette semaine</CardTitle>
                <CardDescription>Commandes passées, livraisons et annulations par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ordersData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="commandes" name="Commandes" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="livraisons" name="Livrées" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} />
                    <Bar dataKey="annulations" name="Annulées" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Chart */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
                <CardDescription>Part du GMV par catégorie de produits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 min-w-48">
                    {categoryData.map(cat => (
                      <div key={cat.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <Badge variant="secondary">{cat.value}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
