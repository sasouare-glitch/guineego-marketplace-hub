import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Shield, Bell, LogOut } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { SavedAddressesCard, Address } from "@/components/profile/SavedAddressesCard";

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
}

// Mock user data
const mockUser = {
  firstName: "Mamadou",
  lastName: "Diallo",
  email: "mamadou.diallo@email.com",
  phone: "+224 622 123 456",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" as string | undefined,
};

const mockAddresses: Address[] = [
  {
    id: "1",
    label: "Domicile",
    type: "home",
    name: "Mamadou Diallo",
    phone: "+224 622 123 456",
    street: "Quartier Cosa, Rue KA-012",
    commune: "Ratoma",
    city: "Conakry",
    landmark: "Près de la pharmacie centrale",
    isDefault: true,
  },
  {
    id: "2",
    label: "Bureau",
    type: "work",
    name: "Mamadou Diallo",
    phone: "+224 622 123 456",
    street: "Immeuble Kaloum Center, 3ème étage",
    commune: "Kaloum",
    city: "Conakry",
    isDefault: false,
  },
];

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo>(mockUser);
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Mon profil
          </h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et vos adresses
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard user={user} onSave={setUser} />
            <SavedAddressesCard
              addresses={addresses}
              onAddressesChange={setAddresses}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/notifications">
                      <Bell className="w-4 h-4 mr-3" />
                      Notifications
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/security">
                      <Shield className="w-4 h-4 mr-3" />
                      Sécurité
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/preferences">
                      <Settings className="w-4 h-4 mr-3" />
                      Préférences
                    </Link>
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Déconnexion
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Commandes</span>
                    <span className="font-semibold text-foreground">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">En cours</span>
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Livrées</span>
                    <span className="font-semibold text-foreground">10</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Membre depuis</span>
                    <span className="font-semibold text-foreground">Jan 2024</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Besoin d'aide avec votre compte ?
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/help">Contacter le support</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
