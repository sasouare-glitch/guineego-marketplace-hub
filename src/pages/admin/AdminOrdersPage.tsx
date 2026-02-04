/**
 * Admin Orders Page - Order Management
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MoreHorizontal, Filter, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

// Mock data
const mockOrders = [
  { id: 'GGO-12345678', customer: 'Mamadou D.', seller: 'TechStore GN', total: 450000, status: 'pending', date: '2024-01-20' },
  { id: 'GGO-12345679', customer: 'Fatoumata B.', seller: 'Mode Conakry', total: 125000, status: 'confirmed', date: '2024-01-20' },
  { id: 'GGO-12345680', customer: 'Ibrahima S.', seller: 'ElectroGN', total: 890000, status: 'shipping', date: '2024-01-19' },
  { id: 'GGO-12345681', customer: 'Aissatou C.', seller: 'BeautyGN', total: 75000, status: 'delivered', date: '2024-01-18' },
  { id: 'GGO-12345682', customer: 'Oumar B.', seller: 'TechStore GN', total: 320000, status: 'cancelled', date: '2024-01-17' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'En attente', variant: 'secondary', icon: Package },
  confirmed: { label: 'Confirmée', variant: 'default', icon: CheckCircle },
  shipping: { label: 'En livraison', variant: 'outline', icon: Truck },
  delivered: { label: 'Livrée', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
};

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <AdminLayout title="Commandes" description="Suivi et gestion des commandes">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Total aujourd'hui</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-600">12</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-blue-600">28</p>
              <p className="text-sm text-muted-foreground">En livraison</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">112</p>
              <p className="text-sm text-muted-foreground">Livrées</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-600">4</p>
              <p className="text-sm text-muted-foreground">Annulées</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Liste des commandes</CardTitle>
                <CardDescription>Gérez et suivez toutes les commandes</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par ID..." 
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="pending">En attente</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmées</TabsTrigger>
                <TabsTrigger value="shipping">En livraison</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-muted-foreground">{order.seller}</TableCell>
                      <TableCell className="font-medium">{format(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem>Mettre à jour statut</DropdownMenuItem>
                            <DropdownMenuItem>Contacter client</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Annuler
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
