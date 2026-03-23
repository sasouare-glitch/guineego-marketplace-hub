import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Copy,
  Package,
  Grid3X3,
  List,
  ChevronDown,
  Power,
  PowerOff,
  BarChart3,
  Loader2,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useSellerProducts, type SellerProduct } from "@/hooks/useSellerProducts";
import { AddProductDialog } from "@/components/seller/AddProductDialog";
import { EditProductDialog } from "@/components/seller/EditProductDialog";
import { EditStockDialog } from "@/components/seller/EditStockDialog";
import { SponsorProductDialog } from "@/components/seller/SponsorProductDialog";

const statusConfig = {
  active: {
    label: "Actif",
    variant: "bg-primary/10 text-primary border-primary/20",
  },
  draft: {
    label: "Brouillon",
    variant: "bg-muted text-muted-foreground border-muted",
  },
  out_of_stock: {
    label: "Rupture",
    variant: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

/** Returns days until sponsoring expires, or null if not sponsored */
const getSponsorDaysLeft = (product: any): number | null => {
  if (!product.isSponsored || !product.sponsoredUntil) return null;
  const until = product.sponsoredUntil?.toDate ? product.sponsoredUntil.toDate() : new Date(product.sponsoredUntil);
  const diff = Math.ceil((until.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
};

const formatPrice = (price: number) => {
  return price.toLocaleString("fr-GN") + " GNF";
};

export default function SellerProducts() {
  const { products, loading, addProduct, updateProductStatus, updateStock, updateProduct, deleteProduct } = useSellerProducts();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [stockDialog, setStockDialog] = useState<{ open: boolean; product: SellerProduct | null }>({ open: false, product: null });
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: SellerProduct | null }>({ open: false, product: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: SellerProduct | null }>({ open: false, product: null });
  const [sponsorDialog, setSponsorDialog] = useState<{ open: boolean; product: SellerProduct | null }>({ open: false, product: null });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(products.map((p) => p.category))];

  const handleDeleteConfirm = async () => {
    if (deleteDialog.product) {
      await deleteProduct(deleteDialog.product.id);
      setDeleteDialog({ open: false, product: null });
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-3 sm:space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
          >
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Produits</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {products.length} produit{products.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button size="sm" onClick={() => setAddDialogOpen(true)} className="sm:size-default">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ajouter un produit</span>
            </Button>
          </motion.div>
        </div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-3 sm:p-4"
        >
          <div className="flex flex-col gap-2 sm:gap-4 lg:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[110px] sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm flex-shrink-0">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg overflow-hidden flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9 sm:h-10 sm:w-10",
                    viewMode === "list" && "bg-muted"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-9 w-9 sm:h-10 sm:w-10",
                    viewMode === "grid" && "bg-muted"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Chargement des produits...</p>
          </div>
        )}

        {/* Products List */}
        {!loading && viewMode === "list" && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Produit
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                      Catégorie
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Prix
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4 hidden sm:table-cell">
                      Stock
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4 hidden lg:table-cell">
                      Ventes
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Statut
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((product) => {
                    const status = statusConfig[product.status] || statusConfig.draft;
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.thumbnail && product.thumbnail !== '/placeholder.svg' ? (
                              <img src={product.thumbnail} alt={product.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium text-foreground line-clamp-1">
                              {product.name}
                            </span>
                            {(product as any).isSponsored && (() => {
                              const daysLeft = getSponsorDaysLeft(product);
                              const expiringSoon = daysLeft !== null && daysLeft <= 3;
                              return (
                                <>
                                  <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] ml-1">
                                    <Megaphone className="w-3 h-3 mr-0.5" /> Sponsorisé
                                  </Badge>
                                  {expiringSoon && (
                                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] ml-1 animate-pulse">
                                      <AlertTriangle className="w-3 h-3 mr-0.5" />
                                      {daysLeft! <= 0 ? 'Expiré' : `Expire dans ${daysLeft}j`}
                                    </Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground">
                            {formatPrice(product.price || product.basePrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <button
                            onClick={() => setStockDialog({ open: true, product })}
                            className={cn(
                              "font-medium cursor-pointer hover:underline",
                              product.totalStock === 0 && "text-destructive",
                              product.totalStock > 0 && product.totalStock <= 5 && "text-accent",
                              product.totalStock > 5 && "text-foreground"
                            )}
                          >
                            {product.totalStock}
                          </button>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {product.totalSales || 0} vendus
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={cn(status.variant)}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setEditDialog({ open: true, product })}
                              >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setStockDialog({ open: true, product })}
                              >
                                <BarChart3 className="w-4 h-4" />
                                Gérer le stock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={() => setSponsorDialog({ open: true, product })}
                              >
                                <Megaphone className="w-4 h-4" />
                                {(product as any).isSponsored ? 'Gérer sponsorisation' : 'Sponsoriser'}
                              </DropdownMenuItem>
                              {product.status === 'active' ? (
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => updateProductStatus(product.id, 'draft')}
                                >
                                  <PowerOff className="w-4 h-4" />
                                  Retirer de la vente
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => updateProductStatus(product.id, 'active')}
                                >
                                  <Power className="w-4 h-4" />
                                  Mettre en vente
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-2"
                                onClick={() => setDeleteDialog({ open: true, product })}
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Grid View */}
        {!loading && viewMode === "grid" && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredProducts.map((product) => {
              const status = statusConfig[product.status] || statusConfig.draft;
              return (
                <div
                  key={product.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {product.thumbnail && product.thumbnail !== '/placeholder.svg' ? (
                      <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-16 h-16 text-muted-foreground" />
                    )}
                    <Badge
                      variant="outline"
                      className={cn("absolute top-3 right-3", status.variant)}
                    >
                      {status.label}
                    </Badge>
                    {(product as any).isSponsored && (() => {
                      const daysLeft = getSponsorDaysLeft(product);
                      const expiringSoon = daysLeft !== null && daysLeft <= 3;
                      return (
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">
                            <Megaphone className="w-3 h-3 mr-0.5" /> Sponsorisé
                          </Badge>
                          {expiringSoon && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-0.5" />
                              {daysLeft! <= 0 ? 'Expiré' : `${daysLeft}j restants`}
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-medium text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {formatPrice(product.price || product.basePrice)}
                      </span>
                      <button
                        onClick={() => setStockDialog({ open: true, product })}
                        className={cn(
                          "text-sm cursor-pointer hover:underline",
                          product.totalStock === 0 && "text-destructive",
                          product.totalStock > 0 && "text-muted-foreground"
                        )}
                      >
                        Stock: {product.totalStock}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {product.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => updateProductStatus(product.id, 'draft')}
                        >
                          <PowerOff className="w-3 h-3 mr-1" />
                          Retirer
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => updateProductStatus(product.id, 'active')}
                        >
                          <Power className="w-3 h-3 mr-1" />
                          Activer
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => setEditDialog({ open: true, product })}
                          >
                            <Edit2 className="w-4 h-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() => setStockDialog({ open: true, product })}
                          >
                            <BarChart3 className="w-4 h-4" />
                            Gérer le stock
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive flex items-center gap-2"
                            onClick={() => setDeleteDialog({ open: true, product })}
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {products.length === 0 ? "Aucun produit" : "Aucun produit trouvé"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {products.length === 0
                ? "Commencez par ajouter votre premier produit"
                : "Essayez de modifier vos filtres"}
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>
        )}
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={addProduct}
      />

      {/* Edit Product Dialog */}
      {editDialog.product && (
        <EditProductDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ open, product: open ? editDialog.product : null })}
          product={editDialog.product}
          onSubmit={updateProduct}
        />
      )}

      {/* Edit Stock Dialog */}
      {stockDialog.product && (
        <EditStockDialog
          open={stockDialog.open}
          onOpenChange={(open) => setStockDialog({ open, product: open ? stockDialog.product : null })}
          productName={stockDialog.product.name}
          currentStock={stockDialog.product.totalStock}
          onSubmit={(newStock) => updateStock(stockDialog.product!.id, newStock)}
        />
      )}

      {/* Sponsor Product Dialog */}
      <SponsorProductDialog
        open={sponsorDialog.open}
        onOpenChange={(open) => setSponsorDialog({ open, product: open ? sponsorDialog.product : null })}
        product={sponsorDialog.product}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: open ? deleteDialog.product : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit « {deleteDialog.product?.name} » sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SellerLayout>
  );
}
