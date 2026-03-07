/**
 * Admin Products Page - Product Catalog Management (Firestore)
 */

import { useState, useRef } from 'react';
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  Search, MoreHorizontal, Filter, Eye, Package, 
  CheckCircle, XCircle, AlertTriangle, Star, Edit, Trash2, Power, StarOff, Loader2,
  ImagePlus, X, Upload, Zap, Sparkles, TrendingUp
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { uploadProductImage } from '@/lib/firebase/storage';
import { CATEGORY_NAMES } from '@/constants/categories';
import { EditProductDialog } from '@/components/seller/EditProductDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';
import { useRealtimeCollection } from '@/lib/firebase/queries';
import { updateDocument, deleteDocument } from '@/lib/firebase/mutations';
import type { FirestoreDoc } from '@/lib/firebase/queries';

interface Seller extends FirestoreDoc {
  businessName?: string;
  shopName?: string;
  name?: string;
  displayName?: string;
}

interface Product extends FirestoreDoc {
  name: string;
  category: string;
  sellerId: string;
  sellerName?: string;
  basePrice: number;
  price: number;
  images: string[];
  thumbnail?: string;
  totalStock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  featured: boolean;
  avgRating: number;
  totalReviews: number;
  totalSales: number;
  tags?: string[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  inactive: { label: 'Inactif', variant: 'secondary' },
  out_of_stock: { label: 'Rupture', variant: 'destructive' },
};

export default function AdminProductsPage() {
  const { data: products, loading, error } = useRealtimeCollection<Product>('products');
  const { data: sellers } = useRealtimeCollection<Seller>('sellers');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} });
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [saving, setSaving] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', price: '', category: '', description: '', stock: '', tags: '', originalPrice: '', isFlashSale: false, isNew: false, isBestSeller: false, sellerId: '' });
  const [addImages, setAddImages] = useState<{ file: File; preview: string }[]>([]);
  const [addUploading, setAddUploading] = useState(false);
  const [addUploadProgress, setAddUploadProgress] = useState(0);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const handleAddProduct = async () => {
    if (!addForm.name || !addForm.price || !addForm.category || !addForm.sellerId) {
      toast.error('Nom, prix, catégorie et vendeur sont requis');
      return;
    }
    setSaving(true);
    try {
      const { addDocument } = await import('@/lib/firebase/mutations');
      const selectedSeller = sellers.find(s => s.id === addForm.sellerId);
      const sellerName = selectedSeller?.businessName || selectedSeller?.shopName || selectedSeller?.name || addForm.sellerId;
      // First create the product to get an ID
      const docRef = await addDocument('products', {
        name: addForm.name,
        description: addForm.description || '',
        category: addForm.category,
        basePrice: Number(addForm.price),
        price: Number(addForm.price),
        images: ['/placeholder.svg'],
        thumbnail: '/placeholder.svg',
        variants: [{ sku: 'DEFAULT', name: 'Standard', price: Number(addForm.price), stock: Number(addForm.stock) || 0 }],
        totalStock: Number(addForm.stock) || 0,
        sellerId: addForm.sellerId,
        sellerName: sellerName,
        tags: addForm.tags ? addForm.tags.split(',').map(s => s.trim()) : [],
        specifications: {},
        avgRating: 0,
        totalReviews: 0,
        totalSales: 0,
        status: 'active',
        featured: false,
        originalPrice: addForm.isFlashSale && addForm.originalPrice ? Number(addForm.originalPrice) : null,
        discount: addForm.isFlashSale && addForm.originalPrice && Number(addForm.originalPrice) > Number(addForm.price)
          ? Math.round(((Number(addForm.originalPrice) - Number(addForm.price)) / Number(addForm.originalPrice)) * 100)
          : 0,
        isNew: addForm.isNew,
        isBestSeller: addForm.isBestSeller,
      });

      // Upload images if any
      if (addImages.length > 0 && docRef) {
        setAddUploading(true);
        setAddUploadProgress(0);
        const productId = typeof docRef === 'string' ? docRef : (docRef as any).id || 'unknown';
        const uploadedUrls: string[] = [];
        for (let i = 0; i < addImages.length; i++) {
          try {
            const result = await uploadProductImage(
              addImages[i].file, productId, i,
              (p) => setAddUploadProgress(((i + p / 100) / addImages.length) * 100)
            );
            uploadedUrls.push(result.url);
          } catch { /* skip failed */ }
        }
        if (uploadedUrls.length > 0) {
          await updateDocument('products', productId, {
            images: uploadedUrls,
            thumbnail: uploadedUrls[0],
          });
        }
        setAddUploading(false);
      }

      toast.success('Produit ajouté avec succès');
      setAddDialog(false);
      setAddForm({ name: '', price: '', category: '', description: '', stock: '', tags: '', originalPrice: '', isFlashSale: false, isNew: false, isBestSeller: false, sellerId: '' });
      addImages.forEach(img => URL.revokeObjectURL(img.preview));
      setAddImages([]);
    } catch (err) {
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setSaving(false);
      setAddUploading(false);
      setAddUploadProgress(0);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sellerName || product.sellerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Firestore Actions
  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateDocument('products', product.id, { featured: !product.featured });
      toast.success(product.featured ? `"${product.name}" retiré de la vedette` : `"${product.name}" mis en vedette`);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setConfirmDialog({
      open: true,
      title: newStatus === 'inactive' ? 'Désactiver ce produit ?' : 'Activer ce produit ?',
      description: `Le produit "${product.name}" sera ${newStatus === 'inactive' ? 'masqué du catalogue' : 'visible dans le catalogue'}.`,
      action: async () => {
        try {
          await updateDocument('products', product.id, { status: newStatus });
          toast.success(`Produit ${newStatus === 'active' ? 'activé' : 'désactivé'} avec succès`);
        } catch (err) {
          toast.error('Erreur lors de la mise à jour');
        }
      }
    });
  };

  const handleDelete = (product: Product) => {
    setConfirmDialog({
      open: true,
      title: 'Supprimer ce produit ?',
      description: `Cette action est irréversible. Le produit "${product.name}" sera définitivement supprimé.`,
      action: async () => {
        try {
          await deleteDocument('products', product.id);
          toast.success(`Produit "${product.name}" supprimé`);
        } catch (err) {
          toast.error('Erreur lors de la suppression');
        }
      }
    });
  };

  const handleEdit = (product: Product) => {
    setEditDialog({ open: true, product });
  };

  const handleSaveEdit = async (productId: string, data: Record<string, any>) => {
    await updateDocument('products', productId, data);
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
                <Button onClick={() => setAddDialog(true)}>
                  <Package className="w-4 h-4 mr-2" />
                  Ajouter
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

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>Erreur lors du chargement des produits</p>
                <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              </div>
            ) : (
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
                      const status = statusConfig[product.status] || statusConfig.active;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0 overflow-hidden">
                                {product.thumbnail ? (
                                  <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : '📦'}
                              </div>
                              <div>
                                <p className="font-medium line-clamp-1 max-w-[180px]">{product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{product.id.slice(0, 12)}</p>
                              </div>
                              {product.featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{product.sellerName || product.sellerId}</TableCell>
                          <TableCell className="font-medium">{format(product.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {product.totalStock === 0 ? (
                                <XCircle className="w-4 h-4 text-destructive" />
                              ) : product.totalStock < 5 ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className={product.totalStock === 0 ? 'text-destructive font-medium' : product.totalStock < 5 ? 'text-yellow-600 font-medium' : ''}>
                                {product.totalStock}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{product.avgRating?.toFixed(1) || '—'}</span>
                              <span className="text-xs text-muted-foreground">({product.totalSales || 0})</span>
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

      {/* Edit Dialog with images & categories */}
      {editDialog.product && (
        <EditProductDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog(prev => ({ ...prev, open }))}
          product={editDialog.product as any}
          onSubmit={handleSaveEdit}
        />
      )}

      {/* Add Product Dialog */}
      <Dialog open={addDialog} onOpenChange={(open) => { setAddDialog(open); if (!open) { addImages.forEach(img => URL.revokeObjectURL(img.preview)); setAddImages([]); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un produit</DialogTitle>
            <DialogDescription>Créez un nouveau produit dans le catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input value={addForm.name} onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: iPhone 15 Pro" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={addForm.description} onChange={(e) => setAddForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Description du produit" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_NAMES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix (GNF) *</Label>
                <Input type="number" value={addForm.price} onChange={(e) => setAddForm(prev => ({ ...prev, price: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stock initial</Label>
              <Input type="number" value={addForm.stock} onChange={(e) => setAddForm(prev => ({ ...prev, stock: e.target.value }))} placeholder="0" />
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Images du produit (max 5)</Label>
              <div className="grid grid-cols-5 gap-2">
                {addImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setAddImages(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); })}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {addImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Ajouter</span>
                  </button>
                )}
              </div>
              <input
                ref={addFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (addImages.length + files.length > 5) return;
                  setAddImages(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
                  if (addFileInputRef.current) addFileInputRef.current.value = '';
                }}
              />
            </div>

            {addUploading && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4 animate-pulse" />
                  <span>Upload des images...</span>
                </div>
                <Progress value={addUploadProgress} className="h-2" />
              </div>
            )}

            {/* Marketplace Options */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <Label className="text-sm font-semibold">Options Marketplace</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Vente Flash</p>
                    <p className="text-xs text-muted-foreground">Afficher dans les promotions</p>
                  </div>
                </div>
                <Switch
                  checked={addForm.isFlashSale}
                  onCheckedChange={(v) => setAddForm(prev => ({ ...prev, isFlashSale: v }))}
                />
              </div>

              {addForm.isFlashSale && (
                <div className="space-y-2 pl-6">
                  <Label>Prix original (GNF) *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={addForm.originalPrice}
                    onChange={(e) => setAddForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="Ex: 800000 (prix avant remise)"
                  />
                  {addForm.originalPrice && addForm.price && Number(addForm.originalPrice) > Number(addForm.price) && (
                    <p className="text-xs text-destructive font-medium">
                      Remise : {Math.round(((Number(addForm.originalPrice) - Number(addForm.price)) / Number(addForm.originalPrice)) * 100)}%
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Nouveauté</p>
                    <p className="text-xs text-muted-foreground">Afficher dans les nouveautés</p>
                  </div>
                </div>
                <Switch
                  checked={addForm.isNew}
                  onCheckedChange={(v) => setAddForm(prev => ({ ...prev, isNew: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-chart-4" />
                  <div>
                    <p className="text-sm font-medium">Best-seller</p>
                    <p className="text-xs text-muted-foreground">Afficher dans les meilleures ventes</p>
                  </div>
                </div>
                <Switch
                  checked={addForm.isBestSeller}
                  onCheckedChange={(v) => setAddForm(prev => ({ ...prev, isBestSeller: v }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (séparés par des virgules)</Label>
              <Input value={addForm.tags} onChange={(e) => setAddForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="promo, nouveau, tendance" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAddProduct} disabled={saving || addUploading}>
              {addUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Upload...</>
              ) : saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ajout...</>
              ) : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
