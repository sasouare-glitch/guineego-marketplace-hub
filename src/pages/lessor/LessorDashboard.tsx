import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, CalendarCheck, Plus, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRentalItems } from "@/hooks/useRentalItems";

export default function LessorDashboard() {
  const { user } = useAuth();
  const { items } = useRentalItems({ ownerId: user?.uid });

  const stats = [
    { label: "Mes équipements", value: items.length, icon: Package, to: "/lessor/items" },
    { label: "Réservations", value: 0, icon: CalendarCheck, to: "/lessor/bookings" },
    { label: "Revenus", value: "—", icon: Wallet, to: "/lessor/earnings" },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tableau de bord — Loueur</h1>
              <p className="text-sm text-muted-foreground">Gérez vos équipements et réservations</p>
            </div>
            <Button asChild>
              <Link to="/lessor/items/new"><Plus className="w-4 h-4 mr-2" /> Nouvel équipement</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold">{value}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Card className="p-6 bg-muted/30">
            <h2 className="font-semibold mb-2">Bienvenue dans le module de location</h2>
            <p className="text-sm text-muted-foreground">
              Cette section est en cours de déploiement. Les fonctionnalités complètes (création
              d'équipements, réservations, paiements, caution) seront livrées progressivement.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
