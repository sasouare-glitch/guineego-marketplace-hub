/**
 * Admin Notifications Page - Centre de notifications global (Firestore)
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
  Bell, Send, Users, ShoppingCart, Truck, AlertTriangle,
  CheckCircle2, Clock, Info, Package, Megaphone, Settings2, RefreshCw, Trash2, Loader2,
} from 'lucide-react';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Config ───────────────────────────────────────────────────────────────────

// Channel defaults moved to useAdminNotifications hook

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  order:           { icon: ShoppingCart,  color: 'text-primary',          bg: 'bg-primary/10',    label: 'Commande' },
  order_confirmed: { icon: CheckCircle2,  color: 'text-green-600',       bg: 'bg-green-500/10',  label: 'Confirmée' },
  order_preparing: { icon: Package,       color: 'text-blue-600',        bg: 'bg-blue-500/10',   label: 'Préparation' },
  order_shipped:   { icon: Truck,         color: 'text-primary',         bg: 'bg-primary/10',    label: 'Expédiée' },
  order_delivered:  { icon: CheckCircle2, color: 'text-green-600',       bg: 'bg-green-500/10',  label: 'Livrée' },
  stock:           { icon: Package,       color: 'text-orange-600',      bg: 'bg-orange-500/10', label: 'Stock' },
  delivery:        { icon: Truck,         color: 'text-blue-600',        bg: 'bg-blue-500/10',   label: 'Livraison' },
  promo:           { icon: Megaphone,     color: 'text-purple-600',      bg: 'bg-purple-500/10', label: 'Promo' },
  payment:         { icon: CheckCircle2,  color: 'text-green-600',       bg: 'bg-green-500/10',  label: 'Paiement' },
  user:            { icon: Users,         color: 'text-yellow-600',      bg: 'bg-yellow-500/10', label: 'Utilisateur' },
  report:          { icon: Info,          color: 'text-muted-foreground', bg: 'bg-muted',         label: 'Rapport' },
  system:          { icon: Bell,          color: 'text-muted-foreground', bg: 'bg-muted',         label: 'Système' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  sent:      { label: 'Envoyée',    variant: 'default' },
  pending:   { label: 'En attente', variant: 'secondary' },
  scheduled: { label: 'Planifiée',  variant: 'outline' },
};

const audienceConfig: Record<string, string> = {
  admin: 'Admins', seller: 'Vendeurs', customers: 'Clients', all: 'Tous', user: 'Utilisateur',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', type: 'promo' });
  const [sending, setSending] = useState(false);

  const {
    notifications, loading, unreadCount, sentCount, scheduledCount,
    sendNotification, deleteNotification,
    channels, channelsLoading, savingChannels, toggleChannel, saveChannels,
  } = useAdminNotifications();

  const handleSend = async () => {
    if (!form.title.trim()) return;
    setSending(true);
    await sendNotification(form);
    setSending(false);
    setForm({ title: '', body: '', audience: 'all', type: 'promo' });
    setOpen(false);
  };

  const getTypeConfig = (type: string) => {
    return typeConfig[type] || typeConfig.system;
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
                <p className="text-2xl font-bold text-primary">{loading ? '—' : unreadCount}</p>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Send className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{loading ? '—' : sentCount}</p>
                <p className="text-xs text-muted-foreground">Envoyées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{loading ? '—' : scheduledCount}</p>
                <p className="text-xs text-muted-foreground">Planifiées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{loading ? '—' : notifications.length}</p>
                <p className="text-xs text-muted-foreground">Total notifications</p>
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
                        <SelectItem value="system">Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={handleSend} disabled={sending || !form.title.trim()} className="gap-2">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
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
                    <CardDescription>
                      {loading ? 'Chargement...' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''} depuis Firestore`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Aucune notification dans Firestore</p>
                    <p className="text-xs text-muted-foreground mt-1">Envoyez-en une pour commencer</p>
                  </div>
                ) : (
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
                      {notifications.map(n => {
                        const type = getTypeConfig(n.type);
                        const Icon = type.icon;
                        const status = statusConfig[n.status] || statusConfig.sent;
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
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteNotification(n.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
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
                          <Switch checked={ch.push} onCheckedChange={() => toggleChannel(ch.key, 'push')} />
                          <span className="text-[10px] text-muted-foreground">Push</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch checked={ch.email} onCheckedChange={() => toggleChannel(ch.key, 'email')} />
                          <span className="text-[10px] text-muted-foreground">Email</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <Switch checked={ch.sms} onCheckedChange={() => toggleChannel(ch.key, 'sms')} />
                          <span className="text-[10px] text-muted-foreground">SMS</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button className="gap-2" onClick={saveChannels} disabled={savingChannels}>
                    {savingChannels ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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
