/**
 * Seller Dashboard Page
 * Real-time dashboard with Firebase data
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { useSellerOrders, type OrderStatus } from '@/hooks/useRealtimeOrder';
import { useSellerProducts } from '@/hooks/useProducts';
import { useProductStock } from '@/hooks/useStockUpdate';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/hooks/useCurrency';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

function StatCard({ title, value, description, icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% vs mois dernier
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// ORDER ROW COMPONENT
// ============================================

interface OrderRowProps {
  order: any;
  sellerId: string;
  onViewOrder: (orderId: string) => void;
}

function OrderRow({ order, sellerId, onViewOrder }: OrderRowProps) {
  const { format: formatPrice } = useCurrency();
  const sellerData = order.sellers?.[sellerId];
  const amount = sellerData?.subtotal || 0;
  
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'Préparation',
    ready: 'Prête',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{order.id}</p>
          <p className="text-sm text-muted-foreground">
            {order.createdAt?.toDate ? 
              formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true, locale: fr }) :
              'Récemment'
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Badge className={statusColors[order.status] || 'bg-gray-100'}>
          {statusLabels[order.status] || order.status}
        </Badge>
        <span className="font-semibold min-w-[100px] text-right">
          {formatPrice(amount)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewOrder(order.id)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            {order.status === 'pending' && (
              <DropdownMenuItem>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer
              </DropdownMenuItem>
            )}
            {order.status === 'confirmed' && (
              <DropdownMenuItem>
                <Package className="h-4 w-4 mr-2" />
                Marquer en préparation
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ============================================
// LOW STOCK ALERT COMPONENT
// ============================================

interface LowStockItemProps {
  product: any;
  variant: any;
}

function LowStockItem({ product, variant }: LowStockItemProps) {
  const stockPercentage = Math.min((variant.stock / 10) * 100, 100);
  
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        {product.thumbnail ? (
          <img 
            src={product.thumbnail} 
            alt={product.name}
            className="h-10 w-10 rounded object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="font-medium text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground">{variant.name}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-2">
          <Progress value={stockPercentage} className="w-16 h-2" />
          <span className={`text-sm font-medium ${variant.stock <= 2 ? 'text-red-600' : 'text-yellow-600'}`}>
            {variant.stock}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export default function SellerDashboardFirebase() {
  const { profile } = useAuth();
  const sellerId = profile?.claims?.ecommerceId || profile?.uid;
  
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  
  // Fetch data with realtime updates
  const { orders, loading: ordersLoading, stats } = useSellerOrders(sellerId, statusFilter);
  const { products, loading: productsLoading } = useSellerProducts(sellerId, { 
    limit: 100,
    realtime: true 
  });

  const { format: formatPrice } = useCurrency();

  // Calculate low stock products
  const lowStockProducts = useMemo(() => {
    const lowStock: Array<{ product: any; variant: any }> = [];
    
    products.forEach(product => {
      (product.variants || []).forEach((variant: any) => {
        if (variant.stock <= 5) {
          lowStock.push({ product, variant });
        }
      });
    });
    
    return lowStock.sort((a, b) => a.variant.stock - b.variant.stock).slice(0, 5);
  }, [products]);

  // Recent orders (last 10)
  const recentOrders = useMemo(() => {
    return orders.slice(0, 10);
  }, [orders]);

  const handleViewOrder = (orderId: string) => {
    // Navigate to order detail
    window.location.href = `/seller/orders/${orderId}`;
  };

  const isLoading = ordersLoading || productsLoading;

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Vue d'ensemble de votre activité
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commandes en attente"
            value={stats.pendingCount}
            description="À traiter"
            icon={<Clock className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="En cours"
            value={stats.processingCount}
            description="En préparation / expédition"
            icon={<Package className="h-4 w-4" />}
            loading={isLoading}
          />
          <StatCard
            title="Livrées"
            value={stats.completedCount}
            description="Ce mois"
            icon={<CheckCircle className="h-4 w-4" />}
            trend={{ value: 12, isPositive: true }}
            loading={isLoading}
          />
          <StatCard
            title="Revenus"
            value={formatPrice(stats.totalRevenue)}
            description="Ce mois"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 8, isPositive: true }}
            loading={isLoading}
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Orders Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Commandes récentes</CardTitle>
                  <CardDescription>
                    Mises à jour en temps réel
                  </CardDescription>
                </div>
                <Tabs value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v as OrderStatus)}>
                  <TabsList>
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                    <TabsTrigger value="pending">En attente</TabsTrigger>
                    <TabsTrigger value="preparing">Préparation</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="divide-y">
                    {recentOrders.map(order => (
                      <OrderRow 
                        key={order.id} 
                        order={order} 
                        sellerId={sellerId || ''}
                        onViewOrder={handleViewOrder}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune commande</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Stock faible
                  </CardTitle>
                  <Badge variant="outline">{lowStockProducts.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {productsLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : lowStockProducts.length > 0 ? (
                  <div>
                    {lowStockProducts.map(({ product, variant }, idx) => (
                      <LowStockItem key={`${product.id}-${variant.sku}`} product={product} variant={variant} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    Tous les stocks sont suffisants
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a href="/seller/products/new">
                    <Package className="h-4 w-4" />
                    Ajouter un produit
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a href="/seller/orders">
                    <ShoppingCart className="h-4 w-4" />
                    Gérer les commandes
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <a href="/seller/finances">
                    <DollarSign className="h-4 w-4" />
                    Voir les finances
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
