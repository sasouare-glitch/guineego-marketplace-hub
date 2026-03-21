/**
 * Admin Settings Page - System Configuration
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Globe, Bell, Shield, Palette, CreditCard, Loader2, ArrowUpFromLine, Info } from 'lucide-react';
import { useWithdrawalLimits, WithdrawalLimits } from '@/hooks/useWithdrawalLimits';
import { Badge } from '@/components/ui/badge';

function WithdrawalLimitsSection() {
  const { limits, loading, saveLimits } = useWithdrawalLimits();
  const [form, setForm] = useState<Partial<WithdrawalLimits>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({ ...limits });
    }
  }, [limits, loading]);

  const handleSave = async () => {
    setSaving(true);
    await saveLimits(form);
    setSaving(false);
  };

  const updateField = (field: keyof WithdrawalLimits, value: string) => {
    const num = parseInt(value) || 0;
    setForm(prev => ({ ...prev, [field]: num }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          Ces plafonds s'appliquent à toutes les demandes de retrait. Vous pouvez définir des limites spécifiques par rôle (vendeur/coursier).
        </p>
      </div>

      {/* Global Limits */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <ArrowUpFromLine className="w-4 h-4 text-primary" />
          Limites globales
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="minAmount">Montant minimum (GNF)</Label>
            <Input
              id="minAmount"
              type="number"
              value={form.minAmount || ''}
              onChange={(e) => updateField('minAmount', e.target.value)}
              placeholder="10000"
            />
            <p className="text-xs text-muted-foreground">Min: 10,000 GNF recommandé</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAmount">Montant maximum par transaction (GNF)</Label>
            <Input
              id="maxAmount"
              type="number"
              value={form.maxAmount || ''}
              onChange={(e) => updateField('maxAmount', e.target.value)}
              placeholder="5000000"
            />
            <p className="text-xs text-muted-foreground">Par retrait individuel</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyLimit">Limite quotidienne (GNF)</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={form.dailyLimit || ''}
              onChange={(e) => updateField('dailyLimit', e.target.value)}
              placeholder="10000000"
            />
            <p className="text-xs text-muted-foreground">Total journalier maximum</p>
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="space-y-4">
        <h4 className="font-medium">Frais de retrait</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="feePercent">Commission de retrait (%)</Label>
            <Input
              id="feePercent"
              type="number"
              step="0.1"
              value={form.feePercent || ''}
              onChange={(e) => setForm(prev => ({ ...prev, feePercent: parseFloat(e.target.value) || 0 }))}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minFee">Frais minimum (GNF)</Label>
            <Input
              id="minFee"
              type="number"
              value={form.minFee || ''}
              onChange={(e) => updateField('minFee', e.target.value)}
              placeholder="500"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Seller-specific */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          Limites vendeurs
          <Badge variant="outline" className="text-xs">Optionnel</Badge>
        </h4>
        <p className="text-sm text-muted-foreground">Laissez vide pour utiliser les limites globales.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sellerMinAmount">Minimum vendeur (GNF)</Label>
            <Input
              id="sellerMinAmount"
              type="number"
              value={form.sellerMinAmount || ''}
              onChange={(e) => updateField('sellerMinAmount', e.target.value)}
              placeholder={`Global: ${(form.minAmount || 10000).toLocaleString()}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellerMaxAmount">Maximum vendeur (GNF)</Label>
            <Input
              id="sellerMaxAmount"
              type="number"
              value={form.sellerMaxAmount || ''}
              onChange={(e) => updateField('sellerMaxAmount', e.target.value)}
              placeholder={`Global: ${(form.maxAmount || 5000000).toLocaleString()}`}
            />
          </div>
        </div>
      </div>

      {/* Courier-specific */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          Limites coursiers
          <Badge variant="outline" className="text-xs">Optionnel</Badge>
        </h4>
        <p className="text-sm text-muted-foreground">Laissez vide pour utiliser les limites globales.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="courierMinAmount">Minimum coursier (GNF)</Label>
            <Input
              id="courierMinAmount"
              type="number"
              value={form.courierMinAmount || ''}
              onChange={(e) => updateField('courierMinAmount', e.target.value)}
              placeholder={`Global: ${(form.minAmount || 10000).toLocaleString()}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courierMaxAmount">Maximum coursier (GNF)</Label>
            <Input
              id="courierMaxAmount"
              type="number"
              value={form.courierMaxAmount || ''}
              onChange={(e) => updateField('courierMaxAmount', e.target.value)}
              placeholder={`Global: ${(form.maxAmount || 5000000).toLocaleString()}`}
            />
          </div>
        </div>
      </div>

      {limits.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Dernière modification: {new Date(limits.updatedAt).toLocaleString('fr-FR')}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer les plafonds
        </Button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminLayout title="Paramètres" description="Configuration du système">
      <div className="max-w-4xl space-y-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Général</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Apparence</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Paiements</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>Configuration de base de la plateforme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Nom du site</Label>
                    <Input id="siteName" defaultValue="GuineeGo LAT" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteEmail">Email de contact</Label>
                    <Input id="siteEmail" type="email" defaultValue="contact@guineego.com" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise par défaut</Label>
                    <Select defaultValue="GNF">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GNF">GNF - Franc Guinéen</SelectItem>
                        <SelectItem value="USD">USD - Dollar US</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue par défaut</Label>
                    <Select defaultValue="fr">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mode maintenance</p>
                    <p className="text-sm text-muted-foreground">
                      Désactiver l'accès public au site
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inscriptions ouvertes</p>
                    <p className="text-sm text-muted-foreground">
                      Autoriser les nouvelles inscriptions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Gérez les notifications système</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouvelles commandes</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une alerte pour chaque nouvelle commande
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Stock faible</p>
                    <p className="text-sm text-muted-foreground">
                      Alerter quand un produit est en rupture
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveaux utilisateurs</p>
                    <p className="text-sm text-muted-foreground">
                      Notification pour chaque inscription
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapports quotidiens</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un résumé quotidien par email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Paramètres de sécurité et accès</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentification 2FA</p>
                    <p className="text-sm text-muted-foreground">
                      Exiger la double authentification pour les admins
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Verrouillage de compte</p>
                    <p className="text-sm text-muted-foreground">
                      Bloquer après 5 tentatives échouées
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Durée de session (heures)</Label>
                  <Select defaultValue="24">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 heure</SelectItem>
                      <SelectItem value="8">8 heures</SelectItem>
                      <SelectItem value="24">24 heures</SelectItem>
                      <SelectItem value="168">7 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>Personnalisation visuelle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Thème par défaut</Label>
                  <Select defaultValue="system">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-muted-foreground">
                      Activer les animations de l'interface
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Settings */}
          <TabsContent value="payments">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Paiements</CardTitle>
                  <CardDescription>Configuration des moyens de paiement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Orange Money</p>
                      <p className="text-sm text-muted-foreground">
                        Activer les paiements Orange Money
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">MTN Mobile Money</p>
                      <p className="text-sm text-muted-foreground">
                        Activer les paiements MTN
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Paiement à la livraison</p>
                      <p className="text-sm text-muted-foreground">
                        Autoriser le paiement cash
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Commission plateforme (%)</Label>
                    <Input type="number" defaultValue="5" className="w-24" />
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Withdrawal Limits Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5 text-primary" />
                    Plafonds de retrait
                  </CardTitle>
                  <CardDescription>
                    Configurez les montants minimum et maximum de retrait pour les vendeurs et coursiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WithdrawalLimitsSection />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
