import { useState } from "react";
import { TransitLayout } from "@/components/transit/TransitLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Globe,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Building2,
  Truck,
  Package,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Ship,
} from "lucide-react";

export default function TransitSettings() {
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState({
    fullName: "Mamadou Diallo",
    email: "mamadou@example.com",
    phone: "+224 620 123 456",
    company: "Diallo Import Guinée",
    address: "Kaloum, Conakry",
    commune: "Kaloum",
  });

  // Notification prefs
  const [notifs, setNotifs] = useState({
    shipmentCreated: true,
    statusChanged: true,
    arrivedGuinea: true,
    readyPickup: true,
    paymentDue: true,
    promotions: false,
    sms: true,
    email: true,
    push: false,
  });

  // Preferences
  const [prefs, setPrefs] = useState({
    defaultMethod: "air",
    defaultInsurance: true,
    defaultExpress: false,
    currency: "GNF",
    language: "fr",
    defaultOriginWarehouse: "guangzhou",
  });

  // Delivery address
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "Mamadou Diallo",
    phone: "+224 620 123 456",
    address: "Rue KA-018, Kaloum",
    commune: "Kaloum",
    quartier: "Centre-ville",
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
    });
  };

  const handleSaveNotifs = () => {
    toast({
      title: "Notifications mises à jour",
      description: "Vos préférences de notification ont été enregistrées.",
    });
  };

  const handleSavePrefs = () => {
    toast({
      title: "Préférences sauvegardées",
      description: "Vos préférences d'expédition ont été enregistrées.",
    });
  };

  const handleSaveAddress = () => {
    toast({
      title: "Adresse de livraison sauvegardée",
      description: "Votre adresse par défaut a été mise à jour.",
    });
  };

  return (
    <TransitLayout title="Paramètres" subtitle="Gérez votre compte et vos préférences">
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Expédition</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
          </TabsList>

          {/* ── PROFIL ── */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Ces informations apparaissent sur vos factures et documents d'expédition.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Entreprise (optionnel)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="company"
                        className="pl-9"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-9"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        className="pl-9"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commune">Commune</Label>
                    <Select value={profile.commune} onValueChange={(v) => setProfile({ ...profile, commune: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Kaloum", "Dixinn", "Matam", "Matoto", "Ratoma"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer le profil
                </Button>
              </CardContent>
            </Card>

            {/* Adresse de livraison par défaut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Adresse de livraison par défaut
                </CardTitle>
                <CardDescription>
                  Pré-remplie automatiquement lors de la création d'une nouvelle expédition.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du destinataire</Label>
                    <Input
                      value={deliveryAddress.fullName}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Adresse complète</Label>
                    <Input
                      value={deliveryAddress.address}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commune</Label>
                    <Select value={deliveryAddress.commune} onValueChange={(v) => setDeliveryAddress({ ...deliveryAddress, commune: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Kaloum", "Dixinn", "Matam", "Matoto", "Ratoma"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quartier</Label>
                    <Input
                      value={deliveryAddress.quartier}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, quartier: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveAddress} className="gap-2">
                  <Save className="w-4 h-4" />
                  Sauvegarder l'adresse
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRÉFÉRENCES EXPÉDITION ── */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Préférences d'expédition
                </CardTitle>
                <CardDescription>
                  Valeurs par défaut appliquées automatiquement lors d'un nouveau devis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode par défaut */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">Mode de transport par défaut</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "air", icon: Plane, label: "Fret Aérien", desc: "7–10 jours • 12 000 GNF/kg", color: "text-blue-500" },
                      { value: "sea", icon: Ship, label: "Fret Maritime", desc: "35–45 jours • 3 500 GNF/kg", color: "text-cyan-500" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPrefs({ ...prefs, defaultMethod: opt.value })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          prefs.defaultMethod === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <opt.icon className={`w-6 h-6 mb-2 ${opt.color}`} />
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Options par défaut</Label>
                  {[
                    { key: "defaultInsurance", label: "Assurance marchandise", desc: "2% de la valeur cargo — recommandé" },
                    { key: "defaultExpress", label: "Traitement express", desc: "+15% — priorité de traitement en entrepôt" },
                  ].map((opt) => (
                    <div key={opt.key} className="flex items-center justify-between p-4 rounded-xl border border-border">
                      <div>
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <Switch
                        checked={prefs[opt.key as keyof typeof prefs] as boolean}
                        onCheckedChange={(v) => setPrefs({ ...prefs, [opt.key]: v })}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Entrepôt d'origine */}
                <div className="space-y-2">
                  <Label>Entrepôt Chine par défaut</Label>
                  <Select
                    value={prefs.defaultOriginWarehouse}
                    onValueChange={(v) => setPrefs({ ...prefs, defaultOriginWarehouse: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guangzhou">🏭 Guangzhou (Canton)</SelectItem>
                      <SelectItem value="yiwu">🏭 Yiwu (Zhejiang)</SelectItem>
                      <SelectItem value="shenzhen">🏭 Shenzhen</SelectItem>
                      <SelectItem value="shanghai">🏭 Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Devise affichée</Label>
                    <Select value={prefs.currency} onValueChange={(v) => setPrefs({ ...prefs, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GNF">🇬🇳 GNF – Franc guinéen</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD – Dollar</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR – Euro</SelectItem>
                        <SelectItem value="CNY">🇨🇳 CNY – Yuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Langue de l'interface</Label>
                    <Select value={prefs.language} onValueChange={(v) => setPrefs({ ...prefs, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">🇫🇷 Français</SelectItem>
                        <SelectItem value="en">🇬🇧 English</SelectItem>
                        <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                        <SelectItem value="zh">🇨🇳 中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSavePrefs} className="gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer les préférences
                </Button>
              </CardContent>
            </Card>

            {/* Tarifs en vigueur */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Tarifs en vigueur
                </CardTitle>
                <CardDescription>Grille tarifaire Chine → Guinée (mise à jour : Fév. 2026)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Plane className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold">Fret Aérien</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarif au kg</span>
                        <span className="font-bold">12 000 GNF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Délai standard</span>
                        <span className="font-medium">7–10 jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Délai express</span>
                        <span className="font-medium">5–7 jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Poids minimum</span>
                        <span className="font-medium">0,5 kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Ship className="w-5 h-5 text-cyan-500" />
                      <span className="font-semibold">Fret Maritime</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarif au kg</span>
                        <span className="font-bold">3 500 GNF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarif au m³</span>
                        <span className="font-bold">2 500 000 GNF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Délai</span>
                        <span className="font-medium">35–45 jours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Poids minimum</span>
                        <span className="font-medium">1 kg</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Assurance : +2% de la valeur cargo. Traitement express : +15%. Les tarifs sont susceptibles d'évoluer selon les conditions du marché.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── NOTIFICATIONS ── */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Alertes expédition
                </CardTitle>
                <CardDescription>Choisissez quand vous souhaitez être notifié.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "shipmentCreated", label: "Expédition créée", desc: "Confirmation à la création d'un envoi" },
                  { key: "statusChanged", label: "Changement de statut", desc: "Chaque étape franchie (entrepôt, transit, douane...)" },
                  { key: "arrivedGuinea", label: "Arrivée en Guinée", desc: "Dès que le colis passe la douane" },
                  { key: "readyPickup", label: "Prêt à la livraison", desc: "Colis disponible pour retrait ou livraison" },
                  { key: "paymentDue", label: "Paiement requis", desc: "Rappel de facture en attente" },
                  { key: "promotions", label: "Offres & promotions", desc: "Réductions tarifaires et offres spéciales" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[item.key as keyof typeof notifs] as boolean}
                      onCheckedChange={(v) => setNotifs({ ...notifs, [item.key]: v })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Canaux de notification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "sms", label: "SMS", desc: "Notifications par message texte (réseau local)" },
                  { key: "email", label: "Email", desc: "Résumé et confirmations par email" },
                  { key: "push", label: "Notifications push", desc: "Via l'application mobile" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[item.key as keyof typeof notifs] as boolean}
                      onCheckedChange={(v) => setNotifs({ ...notifs, [item.key]: v })}
                    />
                  </div>
                ))}
                <Button onClick={handleSaveNotifs} className="gap-2 mt-2">
                  <Save className="w-4 h-4" />
                  Sauvegarder les notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SÉCURITÉ ── */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Sécurité du compte
                </CardTitle>
                <CardDescription>Protégez votre compte et vos informations d'expédition.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Compte vérifié</p>
                    <p className="text-xs text-muted-foreground">Votre identité a été vérifiée avec succès.</p>
                  </div>
                  <Badge variant="outline" className="ml-auto text-green-600 border-green-400">Vérifié</Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Mot de passe actuel</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nouveau mot de passe</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmer</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Button className="gap-2">
                  <Shield className="w-4 h-4" />
                  Changer le mot de passe
                </Button>

                <Separator />

                <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                  <div>
                    <p className="font-medium text-sm">Authentification à deux facteurs (2FA)</p>
                    <p className="text-xs text-muted-foreground">Sécurité renforcée via SMS ou application TOTP</p>
                  </div>
                  <Button variant="outline" size="sm">Activer</Button>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-semibold mb-3">Sessions actives</p>
                  <div className="space-y-2">
                    {[
                      { device: "Chrome · Windows", location: "Conakry, GN", time: "Maintenant", current: true },
                      { device: "Safari · iPhone", location: "Conakry, GN", time: "Il y a 2h", current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                        <div>
                          <p className="font-medium">{session.device}</p>
                          <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                        </div>
                        {session.current
                          ? <Badge variant="outline" className="text-green-600 border-green-400">Session active</Badge>
                          : <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs">Révoquer</Button>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Zone critique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <div>
                    <p className="font-medium text-sm">Supprimer le compte</p>
                    <p className="text-xs text-muted-foreground">Suppression définitive de votre compte et de toutes vos données.</p>
                  </div>
                  <Button variant="destructive" size="sm">Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TransitLayout>
  );
}
