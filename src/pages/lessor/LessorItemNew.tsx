import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

export default function LessorItemNew() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Link to="/lessor" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <Card className="p-8 text-center space-y-4">
            <Construction className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Création d'équipement</h1>
            <p className="text-muted-foreground">
              Le formulaire complet (photos, prix par jour, caution, disponibilités, localisation) sera
              disponible à l'étape suivante du déploiement.
            </p>
            <Button asChild variant="outline">
              <Link to="/lessor">Retour au tableau de bord</Link>
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
