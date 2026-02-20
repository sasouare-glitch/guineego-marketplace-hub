/**
 * Admin Sellers Page - Seller / E-commerçant Management (Firestore)
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, MoreHorizontal, Filter, Eye, Store,
  CheckCircle, XCircle, Clock, TrendingUp, ShoppingBag, Star,
  Edit, Trash2, ShieldCheck, Ban, PlayCircle, Loader2
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { useRealtimeCollection } from '@/lib/firebase/queries';
import { updateDocument, deleteDocument } from '@/lib/firebase/mutations';
import type { FirestoreDoc } from '@/lib/firebase/queries';

interface Seller extends FirestoreDoc {
  name: string;
  owner: string;
  email: string;
  phone?: string;
  category: string;
  status: 'active' | 'pending' | 'suspended';
  verified: boolean;
  products: number;
  totalSales: number;
  revenue: number;
  rating: number;
  joinedAt?: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  active:    { label: 'Actif',    variant: 'default',     icon: CheckCircle },
  pending:   { label: 'En attente', variant: 'secondary', icon: Clock },
  suspended: { label: 'Suspendu', variant: 'destructive', icon: XCircle },
};

export default function AdminSellersPage() {
  const { data: sellers, loading, error } = useRealtimeCollection<Seller>('ecommerces');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [editDialog, setEditDialog] = useState<{ open: boolean; seller: Seller | null }>({ open: false, seller: null });
  const [editForm, setEditForm] = useState({ name: '', owner: '', email: '', category: '' });
  const [saving, setSaving] = useState(false);

  const filtered = sellers.filter(s => {
    const matchSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.owner || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab =
      activeTab === 'all' ||
      s.status === activeTab ||
      (activeTab === 'verified' && s.verified);
    return matchSearch && matchTab;
  });

  const totalActive    = sellers.filter(s => s.status === 'active').length;
  const totalPending   = sellers.filter(s => s.status === 'pending').length;
  const totalSuspended = sellers.filter(s => s.status === 'suspended').length;
  const totalRevenue   = sellers.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const handleSuspend = (seller: Seller) => {
    setConfirmDialog({
      open: true,
      title: 'Suspendre ce vendeur ?',
      description: `Le compte de "${seller.name}" sera suspendu. Ses produits ne seront plus visibles.`,
      action: async () => {
        try {
          await updateDocument('ecommerces', seller.id, { status: 'suspended' });
          toast.success(`Vendeur "${seller.name}" suspendu`);
        } catch { toast.error('Erreur lors de la suspension'); }
      }
    });
  };

  const handleReactivate = async (seller: Seller) => {
    try {
      await updateDocument('ecommerces', seller.id, { status: 'active' });
      toast.success(`Vendeur "${seller.name}" réactivé`);
    } catch { toast.error('Erreur lors de la réactivation'); }
  };

  const handleApprove = async (seller: Seller) => {
    try {
      await updateDocument('ecommerces', seller.id, { status: 'active', verified: true });
      toast.success(`Vendeur "${seller.name}" approuvé et vérifié`);
    } catch { toast.error('Erreur lors de l\'approbation'); }
  };

  const handleVerify = async (seller: Seller) => {
    try {
      await updateDocument('ecommerces', seller.id, { verified: true });
      toast.success(`Compte "${seller.name}" vérifié`);
    } catch { toast.error('Erreur lors de la vérification'); }
  };

  const handleDelete = (seller: Seller) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer ce vendeur ?',
      description: `Cette action est irréversible. Le compte de "${seller.name}" sera supprimé.`,
      action: async () => {
        try {
          await deleteDocument('ecommerces', seller.id);
          toast.success(`Vendeur "${seller.name}" supprimé`);
        } catch { toast.error('Erreur lors de la suppression'); }
      }
    });
  };

  const handleEdit = (seller: Seller) => {
    setEditForm({ name: seller.name, owner: seller.owner, email: seller.email, category: seller.category });
    setEditDialog({ open: true, seller });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.seller) return;
    setSaving(true);
    try {
      await updateDocument('ecommerces', editDialog.seller.id, editForm);
      toast.success('Vendeur modifié avec succès');
      setEditDialog({ open: false, seller: null });
    } catch { toast.error('Erreur lors de la modification'); }
    finally { setSaving(false); }
  };

  return (
    <AdminLayout title="Vendeurs" description="Gestion des e-commerçants partenaires">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{sellers.length}</p>
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
                <TabsTrigger value="all">Tous ({sellers.length})</TabsTrigger>
                <TabsTrigger value="active">Actifs ({totalActive})</TabsTrigger>
                <TabsTrigger value="pending">En attente ({totalPending})</TabsTrigger>
                <TabsTrigger value="suspended">Suspendus ({totalSuspended})</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>Erreur lors du chargement</p>
              </div>
            ) : (
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
                    const status = statusConfig[seller.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const initials = (seller.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
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
                            {seller.products || 0}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{(seller.totalSales || 0).toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">{format(seller.revenue || 0)}</TableCell>
                        <TableCell>
                          {(seller.rating || 0) > 0 ? (
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
                              <DropdownMenuItem onClick={() => handleEdit(seller)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              {!seller.verified && (
                                <DropdownMenuItem onClick={() => handleVerify(seller)}>
                                  <ShieldCheck className="w-4 h-4 mr-2" />
                                  Vérifier le compte
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {seller.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleSuspend(seller)} className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" />
                                  Suspendre
                                </DropdownMenuItem>
                              ) : seller.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleReactivate(seller)}>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Réactiver
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleApprove(seller)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approuver
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(seller)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.action}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le vendeur</DialogTitle>
            <DialogDescription>Modifiez les informations de "{editDialog.seller?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la boutique</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Propriétaire</Label>
              <Input value={editForm.owner} onChange={(e) => setEditForm(prev => ({ ...prev, owner: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, seller: null })}>Annuler</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
