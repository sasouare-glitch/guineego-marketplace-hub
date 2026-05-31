/**
 * ADMIN: Gestion des équipements de location (tous loueurs)
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit as fbLimit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Package, Search, Eye } from "lucide-react";
import { deleteRentalItem } from "@/lib/rental/deleteItem";
import { useToast } from "@/hooks/use-toast";
import type { RentalItem } from "@/types/rental";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formatGNF = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " GNF";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  inactive: "outline",
  rented: "secondary",
  maintenance: "destructive",
};

export default function AdminRentalsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "rental_items"),
      orderBy("createdAt", "desc"),
      fbLimit(500)
    );
    const unsub = safeOnSnapshot(
      q as any,
      (snap: any) => {
        setItems(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as RentalItem[]);
        setLoading(false);
      },
      () => setLoading(false),
      "AdminRentalsPage"
    );
    return unsub;
  }, []);

  const handleDelete = async (id: string, images?: string[]) => {
    setDeletingId(id);
    try {
      await deleteRentalItem(id, images);
      toast({ title: "Équipement supprimé" });
    } catch (err: any) {
      console.error("[AdminRentalsPage] delete error", err);
      toast({
        title: "Erreur",
        description: err?.message || "Suppression impossible",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const s = search.trim().toLowerCase();
  const filtered = s
    ? items.filter(
        (i) =>
          i.title?.toLowerCase().includes(s) ||
          i.category?.toLowerCase().includes(s) ||
          i.ownerId?.toLowerCase().includes(s) ||
          i.location?.commune?.toLowerCase().includes(s)
      )
    : items;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 lg:pt-32">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Équipements de location</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} équipement{items.length > 1 ? "s" : ""} au total
              </p>
            </div>
            <Button asChild>
              <Link to="/lessor/items/new">
                <Plus className="w-4 h-4 mr-2" /> Ajouter un équipement
              </Link>
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, catégorie, commune, propriétaire…"
              className="pl-9"
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">Aucun équipement trouvé.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted relative">
                    <img
                      src={item.thumbnail || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      variant={STATUS_VARIANTS[item.status] || "outline"}
                      className="absolute top-2 left-2 text-[10px]"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div>
                      <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.category} · {item.location?.commune || "—"}
                      </p>
                    </div>
                    <p className="text-primary font-semibold text-sm">
                      {formatGNF(item.pricePerDay)}/j
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Loueur : {item.ownerId}
                    </p>
                    <div className="flex gap-1 mt-auto">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to={`/rental/items/${item.id}`}>
                          <Eye className="w-3 h-3 mr-1" /> Voir
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet équipement ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              « {item.title} » sera définitivement retiré du catalogue, ses photos
                              supprimées et il ne sera plus louable.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id, item.images)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
