import { Link } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Package, Trash2, Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRentalItems } from "@/hooks/useRentalItems";
import { deleteRentalItem } from "@/lib/rental/deleteItem";
import { useToast } from "@/hooks/use-toast";
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

export default function LessorItems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, loading } = useRentalItems({ ownerId: user?.uid });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, images?: string[]) => {
    setDeletingId(id);
    try {
      await deleteRentalItem(id, images);
      toast({ title: "Équipement supprimé" });
    } catch (err: any) {
      console.error("[LessorItems] delete error", err);
      toast({
        title: "Erreur",
        description: err?.message || "Suppression impossible",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 lg:pt-32">
        <div className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Mes équipements</h1>
            <Button asChild>
              <Link to="/lessor/items/new"><Plus className="w-4 h-4 mr-2" /> Ajouter</Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : items.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground mb-4">Vous n'avez aucun équipement en location.</p>
              <Button asChild>
                <Link to="/lessor/items/new">Créer mon premier équipement</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted relative">
                    <img src={item.thumbnail || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-primary font-semibold text-sm">{formatGNF(item.pricePerDay)}/j</p>
                    <div className="flex gap-1 mt-auto">
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to={`/rental/items/${item.id}`}>
                          <Pencil className="w-3 h-3" />
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
                              « {item.title} » sera retiré du catalogue et ses photos supprimées. Cette action est irréversible.
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
