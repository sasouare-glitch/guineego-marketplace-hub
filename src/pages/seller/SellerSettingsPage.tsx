import { useState } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Bell, CreditCard, Globe } from "lucide-react";
import { toast } from "sonner";

const SellerSettingsPage = () => {
  const [storeInfo, setStoreInfo] = useState({
    name: "",
    phone: "",
    description: "",
    address: "",
  });

  const [payment, setPayment] = useState({
    method: "orange",
    phone: "",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    lowStock: true,
    clientMessages: true,
    weeklyReports: true,
  });

  const [saving, setSaving] = useState<string | null>(null);

  const handleSaveStoreInfo = async () => {
    setSaving("store");
    try {
      // Simulate save — replace with Firestore write when backend is connected
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Informations de la boutique enregistrées !");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving("notifications");
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Préférences de notification mises à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  const handleUpdatePayment = async () => {
    if (!payment.phone.trim()) {
      toast.error("Veuillez saisir un numéro de retrait");
      return;
    }
    setSaving("payment");
    try {
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Méthode de paiement mise à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

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
                <Label>Méthode de retrait</Label>
                <Select value={payment.method} onValueChange={(v) => setPayment((s) => ({ ...s, method: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange Money</SelectItem>
                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                    <SelectItem value="bank">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawPhone">Numéro de retrait</Label>
                <Input
                  id="withdrawPhone"
                  placeholder="+224 6XX XX XX XX"
                  value={payment.phone}
                  onChange={(e) => setPayment((s) => ({ ...s, phone: e.target.value }))}
                />
              </div>
              <Button onClick={handleUpdatePayment} disabled={saving === "payment"}>
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
                  <Label>Langue</Label>
                  <Select defaultValue="fr">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select defaultValue="GNF">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GNF">GNF - Franc guinéen</SelectItem>
                      <SelectItem value="USD">USD - Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerSettingsPage;
