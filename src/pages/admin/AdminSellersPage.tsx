/**
 * Admin Sellers Page - Seller / E-commerçant Management
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, MoreHorizontal, Filter, Eye, Store,
  CheckCircle, XCircle, Clock, TrendingUp, ShoppingBag, Star
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const mockSellers = [
  {
    id: 'ECO-001', name: 'TechStore GN', owner: 'Mamadou Diallo',
    email: 'contact@techstore.gn', phone: '621 00 00 01',
    category: 'Électronique', status: 'active', verified: true,
    products: 48, totalSales: 312, revenue: 145000000, rating: 4.7,
    joinedAt: '2024-01-10',
  },
  {
    id: 'ECO-002', name: 'Mode Conakry', owner: 'Fatoumata Bah',
    email: 'mode@conakry.gn', phone: '622 00 00 02',
    category: 'Mode & Vêtements', status: 'active', verified: true,
    products: 126, totalSales: 890, revenue: 78500000, rating: 4.5,
    joinedAt: '2024-01-15',
  },
  {
    id: 'ECO-003', name: 'ElectroGN', owner: 'Ibrahima Sow',
    email: 'info@electrogn.com', phone: '623 00 00 03',
    category: 'Électronique', status: 'pending', verified: false,
    products: 34, totalSales: 56, revenue: 32000000, rating: 4.2,
    joinedAt: '2024-02-01',
  },
  {
    id: 'ECO-004', name: 'BeautyGN', owner: 'Aissatou Camara',
    email: 'beauty@gn.com', phone: '624 00 00 04',
    category: 'Beauté & Santé', status: 'active', verified: true,
    products: 72, totalSales: 1240, revenue: 55800000, rating: 4.9,
    joinedAt: '2024-01-20',
  },
  {
    id: 'ECO-005', name: 'Style Guinée', owner: 'Oumar Barry',
    email: 'style@guinee.gn', phone: '625 00 00 05',
    category: 'Mode & Vêtements', status: 'suspended', verified: true,
    products: 19, totalSales: 88, revenue: 12400000, rating: 3.8,
    joinedAt: '2024-03-05',
  },
  {
    id: 'ECO-006', name: 'AgroGN', owner: 'Kadiatou Diallo',
    email: 'agro@gn.com', phone: '626 00 00 06',
    category: 'Alimentation', status: 'pending', verified: false,
    products: 8, totalSales: 0, revenue: 0, rating: 0,
    joinedAt: '2024-04-10',
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  active:    { label: 'Actif',    variant: 'default',     icon: CheckCircle },
  pending:   { label: 'En attente', variant: 'secondary', icon: Clock },
  suspended: { label: 'Suspendu', variant: 'destructive', icon: XCircle },
};

export default function AdminSellersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filtered = mockSellers.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab =
      activeTab === 'all' ||
      s.status === activeTab ||
      (activeTab === 'verified' && s.verified);
    return matchSearch && matchTab;
  });

  const totalActive    = mockSellers.filter(s => s.status === 'active').length;
  const totalPending   = mockSellers.filter(s => s.status === 'pending').length;
  const totalSuspended = mockSellers.filter(s => s.status === 'suspended').length;
  const totalRevenue   = mockSellers.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <AdminLayout title="Vendeurs" description="Gestion des e-commerçants partenaires">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{mockSellers.length}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total vendeurs</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Actifs</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">En attente</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <p className="text-xl font-bold text-primary">{format(totalRevenue)}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Chiffre d'affaires total</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Liste des vendeurs</CardTitle>
                <CardDescription>Gérez les comptes e-commerçants de la plateforme</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un vendeur..."
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
                <TabsTrigger value="all">Tous ({mockSellers.length})</TabsTrigger>
                <TabsTrigger value="active">Actifs ({totalActive})</TabsTrigger>
                <TabsTrigger value="pending">En attente ({totalPending})</TabsTrigger>
                <TabsTrigger value="suspended">Suspendus ({totalSuspended})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Ventes</TableHead>
                  <TableHead>Chiffre d'affaires</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucun vendeur trouvé</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((seller) => {
                  const status = statusConfig[seller.status];
                  const StatusIcon = status.icon;
                  const initials = seller.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium">{seller.name}</p>
                              {seller.verified && (
                                <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{seller.owner}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{seller.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          {seller.products}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{seller.totalSales.toLocaleString('fr-FR')}</TableCell>
                      <TableCell className="font-medium">{format(seller.revenue)}</TableCell>
                      <TableCell>
                        {seller.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{seller.rating}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
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
                              Voir profil
                            </DropdownMenuItem>
                            <DropdownMenuItem>Voir produits</DropdownMenuItem>
                            {!seller.verified && (
                              <DropdownMenuItem>Vérifier le compte</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {seller.status === 'active' ? (
                              <DropdownMenuItem className="text-destructive">Suspendre</DropdownMenuItem>
                            ) : seller.status === 'suspended' ? (
                              <DropdownMenuItem>Réactiver</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>Approuver</DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">Supprimer</DropdownMenuItem>
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
