import { useState, useEffect } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Store, Bell, CreditCard, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { setDocument } from "@/lib/firebase/mutations";
import { safeOnSnapshot } from "@/lib/firebase/safeSnapshot";
import { doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
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

/** Keep last 9 digits, validate Guinea format (9 chars starting with 6 or 3). */
const normalizePhone = (raw: string) => raw.replace(/\D/g, "").slice(-9);
const isValidGNPhone = (raw: string) => /^[63]\d{8}$/.test(normalizePhone(raw));

const SellerSettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState(defaultSettings.storeInfo);
  const [payment, setPayment] = useState(defaultSettings.payment);
  const [notifications, setNotifications] = useState(defaultSettings.notifications);
  const [preferences, setPreferences] = useState(defaultSettings.preferences);
  const [saving, setSaving] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Real-time sync with Firestore (seller_settings/{uid})
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "seller_settings", user.uid);
    const unsub = safeOnSnapshot(
      ref,
      (snap: any) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<SellerSettings>;
          if (data.storeInfo) setStoreInfo((s) => ({ ...s, ...data.storeInfo }));
          if (data.payment) setPayment((s) => ({ ...s, ...data.payment }));
          if (data.notifications) setNotifications((s) => ({ ...s, ...data.notifications }));
          if (data.preferences) setPreferences((s) => ({ ...s, ...data.preferences }));
          setLastSync(new Date());
        }
        setLoading(false);
      },
      (err) => {
        console.error("[SellerSettings] snapshot error", err);
        setLoading(false);
      },
      "seller_settings"
    );
    return () => unsub();
  }, [user]);

  const saveSection = async (section: string, data: Record<string, any>) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }
    setSaving(section);
    try {
      await setDocument(
        "seller_settings",
        user.uid,
        { ...data, updatedAt: serverTimestamp() },
        true
      );

      // Mirror public-facing fields to sellers/{uid} so storefront,
      // QR payment page and marketplace pick up the changes in real time.
      if (section === "store") {
        await setDocument(
          "sellers",
          user.uid,
          {
            shopName: storeInfo.name,
            phone: normalizePhone(storeInfo.phone),
            description: storeInfo.description,
            address: storeInfo.address,
            updatedAt: serverTimestamp(),
          },
          true
        );
      }

      toast.success(
        section === "store"
          ? "Boutique synchronisée avec Firebase"
          : section === "notifications"
          ? "Notifications synchronisées"
          : section === "payment"
          ? "Méthode de paiement synchronisée"
          : "Préférences synchronisées"
      );
    } catch (e: any) {
      console.error("Save error:", e);
      toast.error(e?.message || "Erreur lors de la synchronisation");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveStoreInfo = () => {
    if (!storeInfo.name.trim()) {
      toast.error("Le nom de la boutique est requis");
      return;
    }
    if (storeInfo.phone && !isValidGNPhone(storeInfo.phone)) {
      toast.error("Téléphone invalide (9 chiffres commençant par 6 ou 3)");
      return;
    }
    saveSection("store", {
      storeInfo: { ...storeInfo, phone: normalizePhone(storeInfo.phone) },
    });
  };
  const handleSaveNotifications = () => saveSection("notifications", { notifications });
  const handleUpdatePayment = () => {
    if (!isValidGNPhone(payment.phone)) {
      toast.error("Numéro de retrait invalide (9 chiffres, commence par 6 ou 3)");
      return;
    }
    saveSection("payment", {
      payment: { ...payment, phone: normalizePhone(payment.phone) },
    });
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
