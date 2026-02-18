/**
 * Admin Security Page - RBAC, accès, sessions et journaux d'audit
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield, ShieldAlert, ShieldCheck, Users, Key, LogIn, LogOut, AlertTriangle,
  Eye, Ban, RefreshCw, CheckCircle2, Clock, Monitor, Smartphone, Globe,
  Lock, Unlock, UserX, Activity,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['sasouare@gmail.com'];

const activeSessions = [
  { id: 'S001', user: 'sasouare@gmail.com', role: 'admin', device: 'Chrome / Windows', ip: '41.83.12.4', location: 'Conakry, GN', lastActive: 'Il y a 2 min', current: true },
  { id: 'S002', user: 'ibrahima.diallo@guineego.com', role: 'seller', device: 'Safari / iPhone', ip: '197.149.89.22', location: 'Conakry, GN', lastActive: 'Il y a 15 min', current: false },
  { id: 'S003', user: 'aminata.bah@courier.com', role: 'courier', device: 'Chrome / Android', ip: '196.28.44.7', location: 'Kindia, GN', lastActive: 'Il y a 1h', current: false },
  { id: 'S004', user: 'alpha.barry@transit.com', role: 'transitaire', device: 'Firefox / Linux', ip: '154.72.168.9', location: 'Dakar, SN', lastActive: 'Il y a 3h', current: false },
];

const auditLogs = [
  { id: 'L001', action: 'login_success', user: 'sasouare@gmail.com', role: 'admin', ip: '41.83.12.4', details: 'Connexion réussie via email', time: '2024-03-20 14:30', severity: 'info' },
  { id: 'L002', action: 'role_changed', user: 'ibrahima.diallo@guineego.com', role: 'seller', ip: '197.149.89.22', details: 'Rôle changé de customer → seller', time: '2024-03-20 13:15', severity: 'warn' },
  { id: 'L003', action: 'login_failed', user: 'unknown@domain.com', role: '—', ip: '185.220.101.5', details: '5 tentatives échouées — compte bloqué', time: '2024-03-20 11:42', severity: 'error' },
  { id: 'L004', action: 'password_reset', user: 'aminata.bah@courier.com', role: 'courier', ip: '196.28.44.7', details: 'Réinitialisation du mot de passe', time: '2024-03-20 10:00', severity: 'info' },
  { id: 'L005', action: 'suspicious_ip', user: 'alpha.barry@transit.com', role: 'transitaire', ip: '45.89.106.12', details: 'Connexion depuis une nouvelle localisation (CN)', time: '2024-03-19 22:18', severity: 'warn' },
  { id: 'L006', action: 'admin_action', user: 'sasouare@gmail.com', role: 'admin', ip: '41.83.12.4', details: 'Suspension du compte vendeur "Mode Conakry"', time: '2024-03-19 16:05', severity: 'warn' },
  { id: 'L007', action: 'login_success', user: 'ibrahima.diallo@guineego.com', role: 'seller', ip: '197.149.89.22', details: 'Connexion réussie via Google OAuth', time: '2024-03-19 09:30', severity: 'info' },
];

const roleMatrix = [
  { role: 'admin',       label: 'Administrateur', users: 1,   permissions: ['Toutes'], color: 'text-red-600',    bg: 'bg-red-500/10' },
  { role: 'seller',      label: 'Vendeur',         users: 23,  permissions: ['Produits', 'Commandes', 'Finances'], color: 'text-primary',    bg: 'bg-primary/10' },
  { role: 'courier',     label: 'Livreur',         users: 47,  permissions: ['Missions', 'Carte', 'Gains'], color: 'text-orange-600', bg: 'bg-orange-500/10' },
  { role: 'transitaire', label: 'Transitaire',     users: 5,   permissions: ['Expéditions', 'Devis', 'Factures'], color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  { role: 'investor',    label: 'Investisseur',    users: 8,   permissions: ['Portefeuille', 'Opportunités'], color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { role: 'closer',      label: 'Closer',          users: 4,   permissions: ['Tâches', 'Performances'], color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  { role: 'customer',    label: 'Client',          users: 1196, permissions: ['Marketplace', 'Commandes', 'Profil'], color: 'text-muted-foreground', bg: 'bg-muted' },
];

const severityConfig = {
  info:  { icon: CheckCircle2, color: 'text-green-600',  label: 'Info' },
  warn:  { icon: AlertTriangle, color: 'text-yellow-600', label: 'Avertissement' },
  error: { icon: ShieldAlert,   color: 'text-destructive', label: 'Erreur' },
};

const actionLabels: Record<string, string> = {
  login_success:  'Connexion réussie',
  login_failed:   'Connexion échouée',
  role_changed:   'Rôle modifié',
  password_reset: 'Mot de passe réinitialisé',
  suspicious_ip:  'IP suspecte',
  admin_action:   'Action admin',
};

const roleColor: Record<string, string> = {
  admin: 'bg-red-500/10 text-red-600',
  seller: 'bg-primary/10 text-primary',
  courier: 'bg-orange-500/10 text-orange-600',
  transitaire: 'bg-blue-500/10 text-blue-600',
  investor: 'bg-purple-500/10 text-purple-600',
  closer: 'bg-yellow-500/10 text-yellow-600',
  customer: 'bg-muted text-muted-foreground',
};

const deviceIcon = (device: string) => device.includes('iPhone') || device.includes('Android')
  ? <Smartphone className="w-4 h-4" />
  : <Monitor className="w-4 h-4" />;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor:      true,
    accountLockout: true,
    ipWhitelist:    false,
    auditLog:       true,
    sessionTimeout: true,
    suspiciousAlert: true,
  });

  const toggle = (key: keyof typeof securitySettings) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalUsers = roleMatrix.reduce((s, r) => s + r.users, 0);
  const alertCount = auditLogs.filter(l => l.severity === 'error' || l.severity === 'warn').length;

  return (
    <AdminLayout title="Sécurité" description="RBAC, sessions actives et journaux d'audit">
      <div className="space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{activeSessions.length}</p>
                <p className="text-xs text-muted-foreground">Sessions actives</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{alertCount}</p>
                <p className="text-xs text-muted-foreground">Alertes récentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Utilisateurs total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Key className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{ADMIN_EMAILS.length}</p>
                <p className="text-xs text-muted-foreground">Emails admin</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="sessions">Sessions actives</TabsTrigger>
            <TabsTrigger value="roles">Rôles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* ── Sessions ── */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> Sessions actives
                    </CardTitle>
                    <CardDescription>Utilisateurs connectés en ce moment</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Actualiser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Appareil</TableHead>
                      <TableHead>IP / Localisation</TableHead>
                      <TableHead>Dernière activité</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map(s => (
                      <TableRow key={s.id} className={s.current ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm flex items-center gap-2">
                              {s.user}
                              {s.current && <Badge variant="secondary" className="text-[10px] py-0">Vous</Badge>}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor[s.role] ?? 'bg-muted'}`}>
                              {s.role}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {deviceIcon(s.device)}
                            {s.device}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <div>
                              <p className="font-mono text-xs">{s.ip}</p>
                              <p className="text-xs text-muted-foreground">{s.location}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.lastActive}</TableCell>
                        <TableCell className="text-right">
                          {s.current ? (
                            <Button variant="ghost" size="sm" disabled className="gap-1.5 text-xs">
                              <Lock className="w-3 h-3" /> Session actuelle
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive">
                                  <LogOut className="w-3 h-3" /> Déconnecter
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Terminer la session ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action déconnectera <strong>{s.user}</strong> immédiatement.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                                    Déconnecter
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Rôles ── */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Matrice des rôles (RBAC)
                </CardTitle>
                <CardDescription>Gestion des droits basée sur les Firebase Auth Custom Claims</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleMatrix.map(r => (
                  <div key={r.role} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${r.bg} flex items-center justify-center shrink-0`}>
                      <Shield className={`w-5 h-5 ${r.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{r.label}</p>
                        <Badge variant="outline" className="text-[10px] py-0">{r.role}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.map(p => (
                          <span key={p} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">{r.users}</p>
                      <p className="text-xs text-muted-foreground">utilisateurs</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <Progress value={(r.users / totalUsers) * 100} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        {((r.users / totalUsers) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-primary" />
                    Emails admin prioritaires (bypass Custom Claims) :&nbsp;
                    {ADMIN_EMAILS.map(e => <code key={e} className="font-mono bg-background px-1 rounded">{e}</code>)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Audit ── */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" /> Journal d'audit
                    </CardTitle>
                    <CardDescription>Événements de sécurité et actions administratives</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Rechercher..." className="w-48 h-8 text-xs" />
                    <Button variant="outline" size="sm" className="gap-2 text-xs">
                      <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>Horodatage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map(log => {
                      const sev = severityConfig[log.severity as keyof typeof severityConfig];
                      const SevIcon = sev.icon;
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <SevIcon className={`w-4 h-4 ${sev.color}`} />
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{actionLabels[log.action] ?? log.action}</p>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[180px]">{log.user}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColor[log.role] ?? 'bg-muted text-muted-foreground'}`}>
                                {log.role}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{log.details}</TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Config ── */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" /> Configuration sécurité
                </CardTitle>
                <CardDescription>Paramètres de protection de la plateforme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {[
                    { key: 'twoFactor',       icon: Key,           label: 'Authentification 2FA',        desc: 'Exiger le double facteur pour les comptes admin et vendeurs' },
                    { key: 'accountLockout',  icon: UserX,         label: 'Verrouillage de compte',      desc: 'Bloquer après 5 tentatives de connexion échouées' },
                    { key: 'auditLog',        icon: Activity,      label: 'Journal d\'audit',            desc: 'Enregistrer toutes les actions sensibles (rôles, paiements, accès)' },
                    { key: 'sessionTimeout',  icon: Clock,         label: 'Expiration de session',       desc: 'Déconnecter automatiquement après 24h d\'inactivité' },
                    { key: 'suspiciousAlert', icon: AlertTriangle, label: 'Alertes connexion suspecte',  desc: 'Notifier l\'admin lors de connexions depuis une nouvelle IP/pays' },
                    { key: 'ipWhitelist',     icon: Globe,         label: 'Liste blanche d\'IPs (admin)', desc: 'Restreindre l\'accès admin à des adresses IP pré-approuvées' },
                  ].map(item => {
                    const Icon = item.icon;
                    const value = securitySettings[item.key as keyof typeof securitySettings];
                    return (
                      <div key={item.key} className="py-4 flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${value ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`w-4 h-4 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <Label className="font-medium text-sm cursor-pointer" onClick={() => toggle(item.key as keyof typeof securitySettings)}>
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={() => toggle(item.key as keyof typeof securitySettings)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-4">
                  <Button className="gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Enregistrer la configuration
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
