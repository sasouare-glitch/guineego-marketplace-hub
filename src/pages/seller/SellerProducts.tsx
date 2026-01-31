import { useState } from "react";
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
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "out_of_stock";
  sales: number;
  image?: string;
}

const products: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max 256GB",
    category: "Téléphones",
    price: 12500000,
    stock: 2,
    status: "active",
    sales: 45,
  },
  {
    id: "2",
    name: "Samsung Galaxy S24 Ultra",
    category: "Téléphones",
    price: 9800000,
    stock: 3,
    status: "active",
    sales: 32,
  },
  {
    id: "3",
    name: "MacBook Air M3 13\"",
    category: "Ordinateurs",
    price: 15000000,
    stock: 1,
    status: "out_of_stock",
    sales: 18,
  },
  {
    id: "4",
    name: "AirPods Pro 2ème génération",
    category: "Accessoires",
    price: 2500000,
    stock: 15,
    status: "active",
    sales: 89,
  },
  {
    id: "5",
    name: "iPad Pro 11\" M4",
    category: "Tablettes",
    price: 11000000,
    stock: 0,
    status: "out_of_stock",
    sales: 12,
  },
  {
    id: "6",
    name: "Chargeur USB-C 20W Apple",
    category: "Accessoires",
    price: 350000,
    stock: 50,
    status: "active",
    sales: 156,
  },
  {
    id: "7",
    name: "Coque iPhone 15 MagSafe",
    category: "Accessoires",
    price: 450000,
    stock: 0,
    status: "draft",
    sales: 0,
  },
];

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

const formatPrice = (price: number) => {
  return price.toLocaleString("fr-GN") + " GNF";
};

export default function SellerProducts() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-foreground">Produits</h1>
            <p className="text-muted-foreground">
              Gérez votre catalogue de {products.length} produits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Button asChild>
              <Link to="/seller/products/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="out_of_stock">Rupture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-none h-10",
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
                    "rounded-none h-10",
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

        {/* Products List */}
        {viewMode === "list" ? (
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
                    const status = statusConfig[product.status];
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground line-clamp-1">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground">
                            {formatPrice(product.price)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span
                            className={cn(
                              "font-medium",
                              product.stock === 0 && "text-destructive",
                              product.stock > 0 &&
                                product.stock <= 5 &&
                                "text-accent",
                              product.stock > 5 && "text-foreground"
                            )}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {product.sales} vendus
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
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/seller/products/${product.id}`}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/seller/products/${product.id}/edit`}
                                  className="flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" />
                                  Modifier
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Copy className="w-4 h-4" />
                                Dupliquer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive flex items-center gap-2">
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
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredProducts.map((product) => {
              const status = statusConfig[product.status];
              return (
                <div
                  key={product.id}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    <Package className="w-16 h-16 text-muted-foreground" />
                    <Badge
                      variant="outline"
                      className={cn("absolute top-3 right-3", status.variant)}
                    >
                      {status.label}
                    </Badge>
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
                        {formatPrice(product.price)}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          product.stock === 0 && "text-destructive",
                          product.stock > 0 && "text-muted-foreground"
                        )}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/seller/products/${product.id}/edit`}>
                          <Edit2 className="w-3 h-3 mr-1" />
                          Modifier
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Copy className="w-4 h-4" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive flex items-center gap-2">
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
        {filteredProducts.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos filtres ou ajoutez un nouveau produit
            </p>
            <Button asChild>
              <Link to="/seller/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un produit
              </Link>
            </Button>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
