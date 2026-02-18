/**
 * Admin Notifications Page - Centre de notifications global
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bell, BellOff, Send, Users, ShoppingCart, Truck, AlertTriangle,
  CheckCircle2, Clock, Info, Package, Megaphone, Settings2, RefreshCw, Trash2,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const recentNotifications = [
  { id: 'N001', title: 'Nouvelle commande #CMD-1284', body: 'TechStore GN vient de passer une commande de 450 000 GNF', type: 'order', audience: 'admin', status: 'sent', sentAt: '2024-03-20 14:32', read: false },
  { id: 'N002', title: 'Stock faible : iPhone 15 Pro', body: 'Il reste seulement 2 unités en stock chez TechStore GN', type: 'stock', audience: 'seller', status: 'sent', sentAt: '2024-03-20 12:15', read: true },
  { id: 'N003', title: 'Livreur en retard — Mission M-089', body: 'Le coursier Mamadou D. est en retard sur la livraison', type: 'delivery', audience: 'admin', status: 'sent', sentAt: '2024-03-20 11:48', read: true },
  { id: 'N004', title: 'Promotion Flash : -20% toute catégorie', body: 'Promotion envoyée à tous les clients actifs', type: 'promo', audience: 'customers', status: 'sent', sentAt: '2024-03-19 09:00', read: true },
  { id: 'N005', title: 'Paiement transit validé — TRN-004', body: 'Le virement de 2 400 000 GNF a été reçu', type: 'payment', audience: 'admin', status: 'sent', sentAt: '2024-03-19 08:30', read: true },
  { id: 'N006', title: 'Nouvelle inscription vendeur', body: 'Boutique "Mode Conakry" demande une validation', type: 'user', audience: 'admin', status: 'pending', sentAt: '2024-03-18 17:00', read: false },
  { id: 'N007', title: 'Rapport quotidien disponible', body: 'Le rapport du 18 Mars 2024 est prêt à télécharger', type: 'report', audience: 'admin', status: 'scheduled', sentAt: '2024-03-18 08:00', read: true },
];

const notifChannels = [
  { key: 'new_order', label: 'Nouvelles commandes', desc: 'Alerte à chaque nouvelle commande reçue', push: true, email: true, sms: false },
  { key: 'low_stock', label: 'Stock faible', desc: 'Alerte quand un produit passe sous le seuil critique', push: true, email: false, sms: false },
  { key: 'delivery_alert', label: 'Alertes livraison', desc: 'Retards, annulations, livreurs en zone', push: true, email: false, sms: true },
  { key: 'payment', label: 'Paiements & virements', desc: 'Confirmation de paiements et retraits', push: true, email: true, sms: true },
  { key: 'new_seller', label: 'Nouveau vendeur', desc: 'Inscription et validation des e-commerçants', push: true, email: true, sms: false },
  { key: 'report', label: 'Rapports automatiques', desc: 'Rapports quotidiens et hebdomadaires', push: false, email: true, sms: false },
  { key: 'security', label: 'Alertes sécurité', desc: "Connexion suspecte, tentatives d'accès échouées", push: true, email: true, sms: true },
  { key: 'promo', label: 'Campagnes promotionnelles', desc: 'Envoi de promotions aux clients', push: true, email: false, sms: false },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order:    { icon: ShoppingCart, color: 'text-primary',   bg: 'bg-primary/10',   label: 'Commande' },
  stock:    { icon: Package,      color: 'text-orange-600', bg: 'bg-orange-500/10', label: 'Stock' },
  delivery: { icon: Truck,        color: 'text-blue-600',   bg: 'bg-blue-500/10',   label: 'Livraison' },
  promo:    { icon: Megaphone,    color: 'text-purple-600', bg: 'bg-purple-500/10', label: 'Promo' },
  payment:  { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-500/10',  label: 'Paiement' },
  user:     { icon: Users,        color: 'text-yellow-600', bg: 'bg-yellow-500/10', label: 'Utilisateur' },
  report:   { icon: Info,         color: 'text-muted-foreground', bg: 'bg-muted',   label: 'Rapport' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  sent:      { label: 'Envoyée',     variant: 'default' },
  pending:   { label: 'En attente',  variant: 'secondary' },
  scheduled: { label: 'Planifiée',   variant: 'outline' },
};

const audienceConfig: Record<string, string> = {
  admin:     'Admins',
  seller:    'Vendeurs',
  customers: 'Clients',
  all:       'Tous',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [channels, setChannels] = useState(notifChannels);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', type: 'promo' });

  const unreadCount = recentNotifications.filter(n => !n.read).length;

  const toggleChannel = (key: string, channel: 'push' | 'email' | 'sms') => {
    setChannels(prev => prev.map(c =>
      c.key === key ? { ...c, [channel]: !c[channel] } : c
    ));
  };

  return (
    <AdminLayout title="Notifications" description="Centre de notifications et alertes système">
      <div className="space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Send className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{recentNotifications.filter(n => n.status === 'sent').length}</p>
                <p className="text-xs text-muted-foreground">Envoyées aujourd'hui</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{recentNotifications.filter(n => n.status === 'scheduled').length}</p>
                <p className="text-xs text-muted-foreground">Planifiées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1 284</p>
                <p className="text-xs text-muted-foreground">Abonnés push</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Centre de notifications</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                Envoyer une notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouvelle notification</DialogTitle>
                <DialogDescription>Envoyez une notification push à un groupe d'utilisateurs.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Titre</Label>
                  <Input placeholder="Ex: Promotion Flash !" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea placeholder="Corps du message..." rows={3} value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Audience</Label>
                    <Select value={form.audience} onValueChange={v => setForm(p => ({ ...p, audience: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="customers">Clients</SelectItem>
                        <SelectItem value="seller">Vendeurs</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promo">Promotion</SelectItem>
                        <SelectItem value="order">Commande</SelectItem>
                        <SelectItem value="delivery">Livraison</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={() => setOpen(false)} className="gap-2">
                  <Send className="w-4 h-4" /> Envoyer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="settings">Canaux & Préférences</TabsTrigger>
          </TabsList>

          {/* ── Historique ── */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Notifications récentes</CardTitle>
                    <CardDescription>Toutes les notifications envoyées, planifiées ou en attente</CardDescription>
                  </div>
                  <Button variant="outline" size="icon"><RefreshCw className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Notification</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentNotifications.map(n => {
                      const type = typeConfig[n.type];
                      const Icon = type.icon;
                      const status = statusConfig[n.status];
                      return (
                        <TableRow key={n.id} className={n.read ? '' : 'bg-primary/5'}>
                          <TableCell>
                            <div className={`w-8 h-8 rounded-lg ${type.bg} flex items-center justify-center`}>
                              <Icon className={`w-4 h-4 ${type.color}`} />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-1.5">
                              {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                              <div>
                                <p className="font-medium text-sm">{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-xs">{n.body}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {audienceConfig[n.audience] ?? n.audience}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {n.sentAt}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Canaux ── */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  Canaux de notification
                </CardTitle>
                <CardDescription>Configurez les canaux (push, email, SMS) pour chaque type d'événement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {channels.map(ch => (
                    <div key={ch.key} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{ch.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={ch.push}
                            onCheckedChange={() => toggleChannel(ch.key, 'push')}
                          />
                          <span className="text-[10px] text-muted-foreground">Push</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={ch.email}
                            onCheckedChange={() => toggleChannel(ch.key, 'email')}
                          />
                          <span className="text-[10px] text-muted-foreground">Email</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={ch.sms}
                            onCheckedChange={() => toggleChannel(ch.key, 'sms')}
                          />
                          <span className="text-[10px] text-muted-foreground">SMS</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Enregistrer les préférences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
