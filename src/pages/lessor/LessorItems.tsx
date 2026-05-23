import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRentalItems } from "@/hooks/useRentalItems";

const formatGNF = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " GNF";

export default function LessorItems() {
  const { user } = useAuth();
  const { items, loading } = useRentalItems({ ownerId: user?.uid });

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
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    <img src={item.thumbnail || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-primary font-semibold text-sm">{formatGNF(item.pricePerDay)}/j</p>
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
