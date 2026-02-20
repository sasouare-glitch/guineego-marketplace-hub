/**
 * Admin Products Page - Product Catalog Management
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
  Search, MoreHorizontal, Filter, Eye, Package, 
  CheckCircle, XCircle, AlertTriangle, Plus, Star, Edit, Trash2, Power, StarOff
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

interface MockProduct {
  id: string;
  name: string;
  category: string;
  seller: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  rating: number;
  sales: number;
  image: string;
}

const initialProducts: MockProduct[] = [
  { id: 'PRD-001', name: 'iPhone 15 Pro Max 256GB', category: 'Téléphones', seller: 'TechStore GN', price: 8500000, stock: 12, status: 'active', featured: true, rating: 4.8, sales: 34, image: '📱' },
  { id: 'PRD-002', name: 'Robe Bazin Brodée Femme', category: 'Mode', seller: 'Mode Conakry', price: 350000, stock: 45, status: 'active', featured: false, rating: 4.5, sales: 128, image: '👗' },
  { id: 'PRD-003', name: 'Samsung 65" QLED 4K', category: 'Électronique', seller: 'ElectroGN', price: 5200000, stock: 0, status: 'out_of_stock', featured: false, rating: 4.7, sales: 8, image: '📺' },
  { id: 'PRD-004', name: 'Crème Karité Naturelle 500ml', category: 'Beauté', seller: 'BeautyGN', price: 45000, stock: 200, status: 'active', featured: true, rating: 4.9, sales: 312, image: '🧴' },
  { id: 'PRD-005', name: 'Laptop HP Pavilion 15"', category: 'Informatique', seller: 'TechStore GN', price: 4800000, stock: 3, status: 'active', featured: false, rating: 4.3, sales: 17, image: '💻' },
  { id: 'PRD-006', name: 'Chaussures Cuir Homme', category: 'Mode', seller: 'Style Guinée', price: 280000, stock: 0, status: 'inactive', featured: false, rating: 4.1, sales: 56, image: '👞' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  inactive: { label: 'Inactif', variant: 'secondary' },
  out_of_stock: { label: 'Rupture', variant: 'destructive' },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<MockProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: MockProduct | null }>({ open: false, product: null });
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '' });

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === 'all' || 
      product.status === activeTab ||
      (activeTab === 'featured' && product.featured);
    return matchesSearch && matchesTab;
  });

  const totalActive = products.filter(p => p.status === 'active').length;
  const totalOutOfStock = products.filter(p => p.status === 'out_of_stock').length;
  const totalInactive = products.filter(p => p.status === 'inactive').length;
  const totalFeatured = products.filter(p => p.featured).length;

  // Actions
  const handleToggleFeatured = (product: MockProduct) => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, featured: !p.featured } : p));
    toast.success(product.featured ? `"${product.name}" retiré de la vedette` : `"${product.name}" mis en vedette`);
  };

  const handleToggleStatus = (product: MockProduct) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setConfirmDialog({
      open: true,
      title: newStatus === 'inactive' ? 'Désactiver ce produit ?' : 'Activer ce produit ?',
      description: `Le produit "${product.name}" sera ${newStatus === 'inactive' ? 'masqué du catalogue et ne sera plus visible par les clients' : 'visible dans le catalogue'}.`,
      action: () => {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
        toast.success(`Produit ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`);
      }
    });
  };

  const handleDelete = (product: MockProduct) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer ce produit ?',
      description: `Cette action est irréversible. Le produit "${product.name}" sera définitivement supprimé du catalogue.`,
      action: () => {
        setProducts(prev => prev.filter(p => p.id !== product.id));
        toast.success(`Produit "${product.name}" supprimé`);
      }
    });
  };

  const handleEdit = (product: MockProduct) => {
    setEditForm({ name: product.name, price: String(product.price), category: product.category });
    setEditDialog({ open: true, product });
  };

  const handleSaveEdit = () => {
    if (!editDialog.product) return;
    setProducts(prev => prev.map(p => p.id === editDialog.product!.id ? {
      ...p,
      name: editForm.name,
      price: Number(editForm.price),
      category: editForm.category,
    } : p));
    toast.success('Produit modifié avec succès');
    setEditDialog({ open: false, product: null });
  };

  return (
    <AdminLayout title="Produits" description="Gestion du catalogue produits">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-sm text-muted-foreground">Total produits</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-green-600">{totalActive}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-red-600">{totalOutOfStock}</p>
              <p className="text-sm text-muted-foreground">Rupture de stock</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-yellow-600">{totalFeatured}</p>
              <p className="text-sm text-muted-foreground">En vedette</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Catalogue produits</CardTitle>
                <CardDescription>Gérez tous les produits de la plateforme</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un produit..." 
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
                <TabsTrigger value="all">Tous ({products.length})</TabsTrigger>
                <TabsTrigger value="active">Actifs ({totalActive})</TabsTrigger>
                <TabsTrigger value="out_of_stock">Rupture ({totalOutOfStock})</TabsTrigger>
                <TabsTrigger value="inactive">Inactifs ({totalInactive})</TabsTrigger>
                <TabsTrigger value="featured">En vedette ({totalFeatured})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>Aucun produit trouvé</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const status = statusConfig[product.status];
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                              {product.image}
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1 max-w-[180px]">{product.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{product.id}</p>
                            </div>
                            {product.featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{product.seller}</TableCell>
                        <TableCell className="font-medium">{format(product.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {product.stock === 0 ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : product.stock < 5 ? (
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <span className={product.stock === 0 ? 'text-destructive font-medium' : product.stock < 5 ? 'text-yellow-600 font-medium' : ''}>
                              {product.stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{product.rating}</span>
                            <span className="text-xs text-muted-foreground">({product.sales})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
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
                                Voir produit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(product)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleFeatured(product)}>
                                {product.featured ? (
                                  <><StarOff className="w-4 h-4 mr-2" />Retirer de la vedette</>
                                ) : (
                                  <><Star className="w-4 h-4 mr-2" />Mettre en vedette</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                                <Power className="w-4 h-4 mr-2" />
                                {product.status === 'active' ? 'Désactiver' : 'Activer'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
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
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>Modifiez les informations du produit "{editDialog.product?.name}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du produit</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Prix (GNF)</Label>
              <Input type="number" value={editForm.price} onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Input value={editForm.category} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, product: null })}>Annuler</Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
