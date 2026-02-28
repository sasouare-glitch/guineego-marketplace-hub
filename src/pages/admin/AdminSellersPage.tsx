/**
 * Admin Sellers Page - Seller / E-commerçant Management (Firestore)
 * Reads from 'users' collection where role == 'ecommerce'
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Search, MoreHorizontal, Filter, Eye, Store, UserPlus,
  CheckCircle, XCircle, Clock, TrendingUp, ShoppingBag, Star,
  Edit, Trash2, ShieldCheck, Ban, PlayCircle, Loader2, Mail, Phone
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateDocument, deleteDocument } from '@/lib/firebase/mutations';

interface SellerUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  status?: 'active' | 'pending' | 'suspended';
  verified?: boolean;
  ecomId?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
  metadata?: {
    createdAt?: any;
    updatedAt?: any;
    lastLoginAt?: any;
  };
  // Seller-specific stats (from sellers collection)
  sellerStats?: {
    shopName?: string;
    totalProducts?: number;
    totalOrders?: number;
    totalRevenue?: number;
    avgRating?: number;
    category?: string;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  active:    { label: 'Actif',    variant: 'default',     icon: CheckCircle },
  pending:   { label: 'En attente', variant: 'secondary', icon: Clock },
  suspended: { label: 'Suspendu', variant: 'destructive', icon: XCircle },
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [editDialog, setEditDialog] = useState<{ open: boolean; seller: SellerUser | null }>({ open: false, seller: null });
  const [editForm, setEditForm] = useState({ shopName: '', firstName: '', lastName: '', email: '' });
  const [saving, setSaving] = useState(false);

  // Listen to users with role 'ecommerce'
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'ecommerce'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SellerUser));

      // Enrich with seller profile data from 'sellers' collection
      const enriched = await Promise.all(userDocs.map(async (user) => {
        try {
          const sellerDoc = await getDoc(doc(db, 'sellers', user.id));
          if (sellerDoc.exists()) {
            const sd = sellerDoc.data();
            user.sellerStats = {
              shopName: sd.shopName,
              totalProducts: sd.stats?.totalProducts || 0,
              totalOrders: sd.stats?.totalOrders || 0,
              totalRevenue: sd.stats?.totalRevenue || 0,
              avgRating: sd.stats?.avgRating || 0,
              category: sd.category,
            };
            // Use seller status if available
            if (sd.status) user.status = sd.status;
          }
        } catch (e) {
          // Seller profile may not exist yet
        }
        // Default status
        if (!user.status) user.status = 'active';
        return user;
      }));

      setSellers(enriched);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error('Error fetching sellers:', err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getDisplayName = (seller: SellerUser) => {
    return seller.sellerStats?.shopName
      || seller.displayName
      || [seller.profile?.firstName, seller.profile?.lastName].filter(Boolean).join(' ')
      || seller.email
      || 'Sans nom';
  };

  const getOwnerName = (seller: SellerUser) => {
    return [seller.profile?.firstName, seller.profile?.lastName].filter(Boolean).join(' ')
      || seller.displayName
      || '';
  };

  const getInitials = (seller: SellerUser) => {
    const name = getDisplayName(seller);
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const filtered = sellers.filter(s => {
    const name = getDisplayName(s).toLowerCase();
    const owner = getOwnerName(s).toLowerCase();
    const email = (s.email || '').toLowerCase();
    const matchSearch = name.includes(searchQuery.toLowerCase()) ||
      owner.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());
    const matchTab =
      activeTab === 'all' ||
      s.status === activeTab ||
      (activeTab === 'verified' && s.verified);
    return matchSearch && matchTab;
  });

  const totalActive    = sellers.filter(s => s.status === 'active').length;
  const totalPending   = sellers.filter(s => s.status === 'pending').length;
  const totalSuspended = sellers.filter(s => s.status === 'suspended').length;
  const totalRevenue   = sellers.reduce((sum, s) => sum + (s.sellerStats?.totalRevenue || 0), 0);

  const handleSuspend = (seller: SellerUser) => {
    setConfirmDialog({
      open: true,
      title: 'Suspendre ce vendeur ?',
      description: `Le compte de "${getDisplayName(seller)}" sera suspendu.`,
      action: async () => {
        try {
          await updateDocument('users', seller.id, { status: 'suspended' });
          // Also update sellers collection if exists
          try { await updateDocument('sellers', seller.id, { status: 'suspended' }); } catch {}
          toast.success(`Vendeur suspendu`);
        } catch { toast.error('Erreur lors de la suspension'); }
      }
    });
  };

  const handleReactivate = async (seller: SellerUser) => {
    try {
      await updateDocument('users', seller.id, { status: 'active' });
      try { await updateDocument('sellers', seller.id, { status: 'active' }); } catch {}
      toast.success(`Vendeur réactivé`);
    } catch { toast.error('Erreur lors de la réactivation'); }
  };

  const handleApprove = async (seller: SellerUser) => {
    try {
      await updateDocument('users', seller.id, { status: 'active', verified: true });
      try { await updateDocument('sellers', seller.id, { status: 'active' }); } catch {}
      toast.success(`Vendeur approuvé`);
    } catch { toast.error("Erreur lors de l'approbation"); }
  };

  const handleVerify = async (seller: SellerUser) => {
    try {
      await updateDocument('users', seller.id, { verified: true });
      toast.success(`Compte vérifié`);
    } catch { toast.error('Erreur lors de la vérification'); }
  };

  const handleDelete = (seller: SellerUser) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer ce vendeur ?',
      description: `Cette action est irréversible. Le compte de "${getDisplayName(seller)}" sera supprimé.`,
      action: async () => {
        try {
          await deleteDocument('users', seller.id);
          try { await deleteDocument('sellers', seller.id); } catch {}
          toast.success(`Vendeur supprimé`);
        } catch { toast.error('Erreur lors de la suppression'); }
      }
    });
  };

  const handleEdit = (seller: SellerUser) => {
    setEditForm({
      shopName: seller.sellerStats?.shopName || getDisplayName(seller),
      firstName: seller.profile?.firstName || '',
      lastName: seller.profile?.lastName || '',
      email: seller.email || '',
    });
    setEditDialog({ open: true, seller });
  };

  const handleSaveEdit = async () => {
    if (!editDialog.seller) return;
    setSaving(true);
    try {
      await updateDocument('users', editDialog.seller.id, {
        email: editForm.email,
        'profile.firstName': editForm.firstName,
        'profile.lastName': editForm.lastName,
      });
      // Update seller profile shop name
      try {
        await updateDocument('sellers', editDialog.seller.id, {
          shopName: editForm.shopName,
        });
      } catch {}
      toast.success('Vendeur modifié avec succès');
      setEditDialog({ open: false, seller: null });
    } catch { toast.error('Erreur lors de la modification'); }
    finally { setSaving(false); }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
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
                <CardDescription>
                  {sellers.length} e-commerçant{sellers.length > 1 ? 's' : ''} inscrit{sellers.length > 1 ? 's' : ''} sur la plateforme
                </CardDescription>
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
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Boutique</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Aucun vendeur trouvé</p>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((seller) => {
                    const status = statusConfig[seller.status || 'pending'] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const displayName = getDisplayName(seller);
                    const ownerName = getOwnerName(seller);
                    const initials = getInitials(seller);
                    const rating = seller.sellerStats?.avgRating || 0;

                    return (
                      <TableRow key={seller.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 shrink-0">
                              {seller.photoURL && <AvatarImage src={seller.photoURL} />}
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium">{ownerName || displayName}</p>
                                {seller.verified && (
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{seller.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {seller.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[140px]">{seller.email}</span>
                              </div>
                            )}
                            {seller.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {seller.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{seller.sellerStats?.shopName || '—'}</p>
                          {seller.sellerStats?.category && (
                            <Badge variant="outline" className="text-xs mt-0.5">{seller.sellerStats.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            {seller.sellerStats?.totalProducts || 0}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{format(seller.sellerStats?.totalRevenue || 0)}</TableCell>
                        <TableCell>
                          {rating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{rating}</span>
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
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(seller.metadata?.createdAt)}
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
            <DialogDescription>Modifiez les informations de "{editDialog.seller ? getDisplayName(editDialog.seller) : ''}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la boutique</Label>
              <Input value={editForm.shopName} onChange={(e) => setEditForm(prev => ({ ...prev, shopName: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
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
