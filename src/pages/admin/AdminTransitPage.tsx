/**
 * Admin Transit Page - China-Guinea Shipment Management
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
  Search, MoreHorizontal, Globe, Package, Plane, Ship, 
  Clock, CheckCircle2, AlertCircle, RefreshCw, Banknote 
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const mockShipments = [
  {
    id: 'TRN-001', client: 'Alpha Import SARL', weight: 45, mode: 'air',
    origin: 'Guangzhou', destination: 'Conakry', cost: 540000,
    status: 'in_transit', eta: '2024-01-25', createdAt: '2024-01-15',
  },
  {
    id: 'TRN-002', client: 'Mamadou Commerce', weight: 320, mode: 'sea',
    origin: 'Shanghai', destination: 'Conakry', cost: 1120000,
    status: 'customs', eta: '2024-02-10', createdAt: '2024-01-05',
  },
  {
    id: 'TRN-003', client: 'TechGN Import', weight: 18, mode: 'air',
    origin: 'Shenzhen', destination: 'Conakry', cost: 216000,
    status: 'delivered', eta: '2024-01-18', createdAt: '2024-01-10',
  },
  {
    id: 'TRN-004', client: 'Mode Guinée', weight: 85, mode: 'sea',
    origin: 'Guangzhou', destination: 'Conakry', cost: 297500,
    status: 'pending', eta: '2024-02-20', createdAt: '2024-01-19',
  },
  {
    id: 'TRN-005', client: 'ElectroGN', weight: 60, mode: 'air',
    origin: 'Yiwu', destination: 'Conakry', cost: 720000,
    status: 'preparation', eta: '2024-01-30', createdAt: '2024-01-18',
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending:     { label: 'En attente',   variant: 'secondary',    icon: Clock },
  preparation: { label: 'Préparation',  variant: 'outline',      icon: Package },
  in_transit:  { label: 'En transit',   variant: 'default',      icon: Globe },
  customs:     { label: 'Douanes',      variant: 'outline',      icon: AlertCircle },
  delivered:   { label: 'Livré',        variant: 'default',      icon: CheckCircle2 },
};

const modeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  air: { label: 'Fret Aérien', icon: Plane },
  sea: { label: 'Fret Maritime', icon: Ship },
};

export default function AdminTransitPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filtered = mockShipments.filter(s => {
    const matchSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || s.status === activeTab;
    return matchSearch && matchTab;
  });

  const totalRevenue = mockShipments.reduce((sum, s) => sum + s.cost, 0);
  const totalWeight = mockShipments.reduce((sum, s) => sum + s.weight, 0);
  const airCount = mockShipments.filter(s => s.mode === 'air').length;
  const seaCount = mockShipments.filter(s => s.mode === 'sea').length;

  return (
    <AdminLayout title="Transit" description="Gestion des expéditions Chine-Guinée">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{mockShipments.length}</p>
              <p className="text-sm text-muted-foreground">Expéditions totales</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                <p className="text-xl font-bold text-primary">{format(totalRevenue)}</p>
              </div>
              <p className="text-sm text-muted-foreground">Revenus transit</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{airCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Fret Aérien</p>
            </CardContent>
          </Card>
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-cyan-600" />
                <p className="text-2xl font-bold text-cyan-600">{seaCount}</p>
              </div>
              <p className="text-sm text-muted-foreground">Fret Maritime</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Expéditions</CardTitle>
                <CardDescription>Suivi de toutes les expéditions Chine-Guinée</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="ID, client..."
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
                <TabsTrigger value="preparation">Préparation</TabsTrigger>
                <TabsTrigger value="in_transit">En transit</TabsTrigger>
                <TabsTrigger value="customs">Douanes</TabsTrigger>
                <TabsTrigger value="delivered">Livrées</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => {
                  const status = statusConfig[s.status];
                  const mode = modeConfig[s.mode];
                  const StatusIcon = status.icon;
                  const ModeIcon = mode.icon;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono font-medium">{s.id}</TableCell>
                      <TableCell>{s.client}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ModeIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{mode.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.origin} → {s.destination}
                      </TableCell>
                      <TableCell>{s.weight} kg</TableCell>
                      <TableCell className="font-medium">{format(s.cost)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.eta).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
                            <DropdownMenuItem>Mettre à jour statut</DropdownMenuItem>
                            <DropdownMenuItem>Générer facture</DropdownMenuItem>
                            <DropdownMenuItem>Contacter client</DropdownMenuItem>
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
