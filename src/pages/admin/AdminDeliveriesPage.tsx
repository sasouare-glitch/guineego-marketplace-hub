/**
 * Admin Deliveries Page - Delivery Mission Management
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MoreHorizontal, Truck, Clock, CheckCircle2, 
  MapPin, AlertCircle, Package, User, RefreshCw 
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const mockDeliveries = [
  { 
    id: 'DEL-001', orderId: 'GGO-12345678', courier: 'Mamadou Diallo', 
    customer: 'Fatoumata B.', zone: 'Kaloum', distance: 3.2, 
    earnings: 15000, status: 'pending', createdAt: '2024-01-20 09:15' 
  },
  { 
    id: 'DEL-002', orderId: 'GGO-12345679', courier: 'Ibrahima Sow', 
    customer: 'Aissatou C.', zone: 'Ratoma', distance: 5.8, 
    earnings: 22000, status: 'assigned', createdAt: '2024-01-20 09:32' 
  },
  { 
    id: 'DEL-003', orderId: 'GGO-12345680', courier: 'Oumar Barry', 
    customer: 'Sekou T.', zone: 'Matam', distance: 2.1, 
    earnings: 12000, status: 'pickup', createdAt: '2024-01-20 10:05' 
  },
  { 
    id: 'DEL-004', orderId: 'GGO-12345681', courier: 'Alpha Condé', 
    customer: 'Mariama D.', zone: 'Dixinn', distance: 4.4, 
    earnings: 18000, status: 'in_transit', createdAt: '2024-01-20 10:20' 
  },
  { 
    id: 'DEL-005', orderId: 'GGO-12345682', courier: 'Mamadou Diallo', 
    customer: 'Kadiatou B.', zone: 'Kaloum', distance: 1.9, 
    earnings: 10000, status: 'delivered', createdAt: '2024-01-20 08:00' 
  },
  { 
    id: 'DEL-006', orderId: 'GGO-12345683', courier: '-', 
    customer: 'Elhadj M.', zone: 'Matoto', distance: 6.2, 
    earnings: 25000, status: 'failed', createdAt: '2024-01-19 15:45' 
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string }> = {
  pending:    { label: 'En attente', variant: 'secondary', icon: Clock,         color: 'text-muted-foreground' },
  assigned:   { label: 'Assignée',   variant: 'outline',   icon: User,          color: 'text-blue-600' },
  pickup:     { label: 'Ramassage',  variant: 'outline',   icon: Package,       color: 'text-yellow-600' },
  in_transit: { label: 'En route',   variant: 'default',   icon: Truck,         color: 'text-primary' },
  delivered:  { label: 'Livrée',     variant: 'default',   icon: CheckCircle2,  color: 'text-green-600' },
  failed:     { label: 'Échouée',    variant: 'destructive', icon: AlertCircle, color: 'text-destructive' },
};

const tabFilters = ['all', 'pending', 'assigned', 'in_transit', 'delivered', 'failed'];

export default function AdminDeliveriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filtered = mockDeliveries.filter(d => {
    const matchSearch = d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.courier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.zone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || d.status === activeTab;
    return matchSearch && matchTab;
  });

  const stats = {
    total: mockDeliveries.length,
    pending: mockDeliveries.filter(d => d.status === 'pending').length,
    inProgress: mockDeliveries.filter(d => ['assigned','pickup','in_transit'].includes(d.status)).length,
    delivered: mockDeliveries.filter(d => d.status === 'delivered').length,
    failed: mockDeliveries.filter(d => d.status === 'failed').length,
  };

  return (
    <AdminLayout title="Livraisons" description="Suivi des missions de livraison en temps réel">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total aujourd'hui</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">Livrées</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Échouées</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Missions de livraison</CardTitle>
                <CardDescription>Toutes les missions coursiers</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, coursier, client, zone..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="assigned">Assignées</TabsTrigger>
                <TabsTrigger value="in_transit">En route</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
                <TabsTrigger value="failed">Échouées</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mission</TableHead>
                  <TableHead>Coursier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Gains</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(d => {
                  const s = statusConfig[d.status];
                  const Icon = s.icon;
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-sm">
                        <div>
                          <p className="font-medium">{d.id}</p>
                          <p className="text-xs text-muted-foreground">{d.orderId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <span className={d.courier === '-' ? 'text-muted-foreground italic' : ''}>
                            {d.courier === '-' ? 'Non assigné' : d.courier}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{d.customer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {d.zone}
                        </div>
                      </TableCell>
                      <TableCell>{d.distance} km</TableCell>
                      <TableCell className="font-medium">{format(d.earnings)}</TableCell>
                      <TableCell>
                        <Badge variant={s.variant} className="gap-1">
                          <Icon className="w-3 h-3" />
                          {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{d.createdAt}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Assigner coursier</DropdownMenuItem>
                            <DropdownMenuItem>Contacter coursier</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Annuler mission
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
