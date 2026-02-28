import { useState, useEffect } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Bell, CreditCard, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { setDocument } from "@/lib/firebase/mutations";
import { fetchDocument } from "@/lib/firebase/queries";
import { Skeleton } from "@/components/ui/skeleton";

interface SellerSettings {
  id: string;
  storeInfo: {
    name: string;
    phone: string;
    description: string;
    address: string;
  };
  payment: {
    method: string;
    phone: string;
  };
  notifications: {
    newOrders: boolean;
    lowStock: boolean;
    clientMessages: boolean;
    weeklyReports: boolean;
  };
  preferences: {
    language: string;
    currency: string;
  };
}

const defaultSettings: Omit<SellerSettings, "id"> = {
  storeInfo: { name: "", phone: "", description: "", address: "" },
  payment: { method: "orange", phone: "" },
  notifications: { newOrders: true, lowStock: true, clientMessages: true, weeklyReports: true },
  preferences: { language: "fr", currency: "GNF" },
};

const SellerSettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState(defaultSettings.storeInfo);
  const [payment, setPayment] = useState(defaultSettings.payment);
  const [notifications, setNotifications] = useState(defaultSettings.notifications);
  const [preferences, setPreferences] = useState(defaultSettings.preferences);
  const [saving, setSaving] = useState<string | null>(null);

  // Load settings from Firestore
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await fetchDocument<SellerSettings>("seller_settings", user.uid);
        if (data) {
          if (data.storeInfo) setStoreInfo(data.storeInfo);
          if (data.payment) setPayment(data.payment);
          if (data.notifications) setNotifications(data.notifications);
          if (data.preferences) setPreferences(data.preferences);
        }
      } catch (e) {
        console.error("Error loading seller settings:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const saveSection = async (section: string, data: Record<string, any>) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    setSaving(section);
    try {
      await setDocument("seller_settings", user.uid, data, true);
      toast.success(
        section === "store"
          ? "Informations de la boutique enregistrées !"
          : section === "notifications"
          ? "Préférences de notification mises à jour !"
          : section === "payment"
          ? "Méthode de paiement mise à jour !"
          : "Préférences enregistrées !"
      );
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveStoreInfo = () => saveSection("store", { storeInfo });
  const handleSaveNotifications = () => saveSection("notifications", { notifications });
  const handleUpdatePayment = () => {
    if (!payment.phone.trim()) {
      toast.error("Veuillez saisir un numéro de retrait");
      return;
    }
    saveSection("payment", { payment });
  };
  const handleSavePreferences = () => saveSection("preferences", { preferences });

  if (loading) {
    return (
      <SellerLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Paramètres Boutique</h1>

        <div className="grid gap-6">
          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                Informations de la boutique
              </CardTitle>
              <CardDescription>Personnalisez les informations visibles par vos clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nom de la boutique</Label>
                  <Input
                    id="storeName"
                    placeholder="Ma Boutique"
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Téléphone</Label>
                  <Input
                    id="storePhone"
                    placeholder="+224 6XX XX XX XX"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeDesc">Description</Label>
                <Textarea
                  id="storeDesc"
                  placeholder="Décrivez votre boutique..."
                  rows={3}
                  value={storeInfo.description}
                  onChange={(e) => setStoreInfo((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Adresse</Label>
                <Input
                  id="storeAddress"
                  placeholder="Commune, Quartier"
                  value={storeInfo.address}
                  onChange={(e) => setStoreInfo((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <Button onClick={handleSaveStoreInfo} disabled={saving === "store"}>
                {saving === "store" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving === "store" ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Gérez vos préférences de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "newOrders" as const, label: "Nouvelles commandes", desc: "Recevoir une alerte pour chaque commande" },
                { key: "lowStock" as const, label: "Stock faible", desc: "Alerte quand un produit est en rupture" },
                { key: "clientMessages" as const, label: "Messages clients", desc: "Notification des messages reçus" },
                { key: "weeklyReports" as const, label: "Rapports hebdomadaires", desc: "Résumé des ventes par email" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications((s) => ({ ...s, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
              <Button onClick={handleSaveNotifications} disabled={saving === "notifications"}>
                {saving === "notifications" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving === "notifications" ? "Mise à jour..." : "Enregistrer les préférences"}
              </Button>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Paiement & Retrait
              </CardTitle>
              <CardDescription>Configurez vos moyens de paiement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawMethod">Méthode de retrait</Label>
                <select
                  id="withdrawMethod"
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={payment.method}
                  onChange={(e) => setPayment((s) => ({ ...s, method: e.target.value }))}
                >
                  <option value="orange">Orange Money</option>
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="bank">Virement bancaire</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawPhone">Numéro de retrait</Label>
                <Input
                  id="withdrawPhone"
                  type="tel"
                  placeholder="+224 6XX XX XX XX"
                  value={payment.phone}
                  onChange={(e) => setPayment((s) => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <Button onClick={handleUpdatePayment} disabled={saving === "payment"}>
                {saving === "payment" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving === "payment" ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </CardContent>
          </Card>

          {/* Language & Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Langue & Devise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settingsLanguage">Langue</Label>
                  <select
                    id="settingsLanguage"
                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={preferences.language}
                    onChange={(e) => setPreferences((s) => ({ ...s, language: e.target.value }))}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settingsCurrency">Devise</Label>
                  <select
                    id="settingsCurrency"
                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={preferences.currency}
                    onChange={(e) => setPreferences((s) => ({ ...s, currency: e.target.value }))}
                  >
                    <option value="GNF">GNF - Franc guinéen</option>
                    <option value="USD">USD - Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleSavePreferences} disabled={saving === "preferences"}>
                {saving === "preferences" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving === "preferences" ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerSettingsPage;
