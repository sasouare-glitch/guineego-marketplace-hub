/**
 * Admin Security Page - RBAC, sessions actives réelles et journaux d'audit Firestore
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  Shield, ShieldAlert, ShieldCheck, Users, Key, LogOut, AlertTriangle,
  RefreshCw, CheckCircle2, Clock, Monitor, Smartphone, Globe,
  Lock, UserX, Activity,
} from 'lucide-react';
import { useSecurity, formatRelativeTime, parseDevice } from '@/hooks/useSecurity';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';

// ─── Constantes ───────────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['sasouare@gmail.com'];

const severityConfig = {
  info:  { icon: CheckCircle2, color: 'text-green-600',   label: 'Info' },
  warn:  { icon: AlertTriangle, color: 'text-yellow-600', label: 'Avertissement' },
  error: { icon: ShieldAlert,   color: 'text-destructive', label: 'Erreur' },
};

const actionLabels: Record<string, string> = {
  login_success:     'Connexion réussie',
  login_failed:      'Connexion échouée',
  role_changed:      'Rôle modifié',
  password_reset:    'Mot de passe réinitialisé',
  suspicious_ip:     'IP suspecte',
  admin_action:      'Action admin',
  admin_page_visit:  'Visite tableau sécurité',
  session_revoked:   'Session révoquée',
};

const roleColor: Record<string, string> = {
  admin:       'bg-red-500/10 text-red-600',
  seller:      'bg-primary/10 text-primary',
  courier:     'bg-orange-500/10 text-orange-600',
  transitaire: 'bg-blue-500/10 text-blue-600',
  investor:    'bg-purple-500/10 text-purple-600',
  closer:      'bg-yellow-500/10 text-yellow-600',
  customer:    'bg-muted text-muted-foreground',
};

const deviceIcon = (device?: string) =>
  device && (device.includes('iPhone') || device.includes('Android'))
    ? <Smartphone className="w-4 h-4" />
    : <Monitor className="w-4 h-4" />;

// ─── Skeleton Rows ────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSecurityPage() {
  const { user } = useAuth();
  const {
    sessions,
    auditLogs,
    roleStats,
    totalUsers,
    loadingSessions,
    loadingAudit,
    logAuditEvent,
  } = useSecurity();

  const [auditSearch, setAuditSearch] = useState('');
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor:       true,
    accountLockout:  true,
    ipWhitelist:     false,
    auditLog:        true,
    sessionTimeout:  true,
    suspiciousAlert: true,
  });

  const toggle = (key: keyof typeof securitySettings) =>
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }));

  const alertCount = auditLogs.filter(l => l.severity === 'error' || l.severity === 'warn').length;

  const filteredLogs = auditLogs.filter(l =>
    !auditSearch ||
    l.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
    (actionLabels[l.action] ?? l.action).toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const handleRevokeSession = async (sessionId: string, sessionEmail: string, sessionRole: string) => {
    await logAuditEvent({
      action: 'session_revoked',
      details: `Session révoquée pour ${sessionEmail}`,
      severity: 'warn',
      targetUid: sessionId,
      targetUser: sessionEmail,
      targetRole: sessionRole,
    });
  };

  const formatTs = (ts: Timestamp | null | undefined) =>
    ts ? ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  return (
    <AdminLayout title="Sécurité" description="RBAC, sessions actives et journaux d'audit">
      <div className="space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                {loadingSessions
                  ? <Skeleton className="h-8 w-12 mb-1" />
                  : <p className="text-2xl font-bold text-green-600">{sessions.length}</p>
                }
                <p className="text-xs text-muted-foreground">Sessions actives (24h)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-destructive shrink-0" />
              <div>
                {loadingAudit
                  ? <Skeleton className="h-8 w-12 mb-1" />
                  : <p className="text-2xl font-bold text-destructive">{alertCount}</p>
                }
                <p className="text-xs text-muted-foreground">Alertes récentes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary shrink-0" />
              <div>
                {loadingSessions
                  ? <Skeleton className="h-8 w-16 mb-1" />
                  : <p className="text-2xl font-bold">{totalUsers}</p>
                }
                <p className="text-xs text-muted-foreground">Utilisateurs total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Key className="w-8 h-8 text-yellow-600 shrink-0" />
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
            <TabsTrigger value="audit">
              Journal d'audit
              {alertCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {alertCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          {/* ── Sessions actives (Firestore) ── */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" /> Sessions actives
                    </CardTitle>
                    <CardDescription>
                      Utilisateurs connectés dans les 24 dernières heures — données Firestore en temps réel
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingSessions && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Badge variant="outline" className="text-xs gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Temps réel
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 && !loadingSessions ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune session active trouvée dans les dernières 24h.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Appareil</TableHead>
                        <TableHead>Dernière activité</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingSessions
                        ? <SkeletonRows cols={4} />
                        : sessions.map(s => (
                          <TableRow key={s.id} className={s.current ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2 flex-wrap">
                                  <span className="truncate max-w-[200px]">{s.email}</span>
                                  {s.current && (
                                    <Badge variant="secondary" className="text-[10px] py-0">Vous</Badge>
                                  )}
                                </p>
                                {s.displayName && (
                                  <p className="text-xs text-muted-foreground">{s.displayName}</p>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor[s.role] ?? 'bg-muted text-muted-foreground'}`}>
                                  {s.role}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {deviceIcon(s.lastDevice)}
                                <span>{parseDevice(s.lastDevice)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatRelativeTime(s.lastActive)}
                            </TableCell>
                            <TableCell className="text-right">
                              {s.current ? (
                                <Button variant="ghost" size="sm" disabled className="gap-1.5 text-xs">
                                  <Lock className="w-3 h-3" /> Session actuelle
                                </Button>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="gap-1.5 text-xs text-destructive hover:text-destructive"
                                    >
                                      <LogOut className="w-3 h-3" /> Signaler
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Signaler cette session ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Un événement d'audit sera enregistré pour <strong>{s.email}</strong>.
                                        La révocation réelle du token nécessite Firebase Admin SDK (Cloud Function).
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleRevokeSession(s.id, s.email, s.role)}
                                      >
                                        Journaliser l'incident
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Rôles (données Firestore) ── */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Matrice des rôles (RBAC)
                </CardTitle>
                <CardDescription>
                  Comptage en temps réel depuis Firestore — Firebase Auth Custom Claims
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingSessions
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                  : roleStats.map(r => (
                    <div
                      key={r.role}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
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
                        <p className="font-bold text-lg">{r.count}</p>
                        <p className="text-xs text-muted-foreground">utilisateurs</p>
                      </div>
                      <div className="w-24 shrink-0">
                        <Progress
                          value={totalUsers > 0 ? (r.count / totalUsers) * 100 : 0}
                          className="h-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                          {totalUsers > 0 ? ((r.count / totalUsers) * 100).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                    </div>
                  ))
                }
                <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <Key className="w-3.5 h-3.5 text-primary shrink-0" />
                    Emails admin prioritaires (bypass Custom Claims) :&nbsp;
                    {ADMIN_EMAILS.map(e => (
                      <code key={e} className="font-mono bg-background px-1 rounded border border-border">{e}</code>
                    ))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Journal d'audit (Firestore en temps réel) ── */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" /> Journal d'audit
                    </CardTitle>
                    <CardDescription>
                      Collection Firestore <code className="font-mono text-xs bg-muted px-1 rounded">audit_logs</code> — mise à jour en temps réel
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Filtrer..."
                      className="w-44 h-8 text-xs"
                      value={auditSearch}
                      onChange={e => setAuditSearch(e.target.value)}
                    />
                    {loadingAudit && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
                    <Badge variant="outline" className="text-xs gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Temps réel
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 && !loadingAudit ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun événement d'audit trouvé.
                    <br />
                    Les événements sont créés automatiquement lors des actions sensibles.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sévérité</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Horodatage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAudit
                        ? <SkeletonRows cols={5} />
                        : filteredLogs.map(log => {
                          const sevKey = (log.severity ?? 'info') as keyof typeof severityConfig;
                          const sev = severityConfig[sevKey] ?? severityConfig.info;
                          const SevIcon = sev.icon;
                          return (
                            <TableRow key={log.id}>
                              <TableCell>
                                <div className={`flex items-center gap-1.5 ${sev.color}`}>
                                  <SevIcon className="w-4 h-4 shrink-0" />
                                  <span className="text-xs font-medium hidden sm:inline">{sev.label}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium whitespace-nowrap">
                                  {actionLabels[log.action] ?? log.action}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm truncate max-w-[160px]">{log.user}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColor[log.role] ?? 'bg-muted text-muted-foreground'}`}>
                                  {log.role}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-xs">
                                <p className="truncate">{log.details}</p>
                                {log.ip && (
                                  <p className="font-mono text-[10px] mt-0.5 opacity-70">{log.ip}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTs(log.createdAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      }
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Configuration ── */}
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
                  {([
                    { key: 'twoFactor',       icon: Key,           label: 'Authentification 2FA',         desc: 'Exiger le double facteur pour les comptes admin et vendeurs' },
                    { key: 'accountLockout',  icon: UserX,         label: 'Verrouillage de compte',       desc: 'Bloquer après 5 tentatives de connexion échouées' },
                    { key: 'auditLog',        icon: Activity,      label: "Journal d'audit",              desc: 'Enregistrer toutes les actions sensibles dans audit_logs' },
                    { key: 'sessionTimeout',  icon: Clock,         label: "Expiration de session",        desc: "Déconnecter automatiquement après 24h d'inactivité" },
                    { key: 'suspiciousAlert', icon: AlertTriangle, label: 'Alertes connexion suspecte',   desc: "Notifier l'admin lors de connexions depuis une nouvelle IP" },
                    { key: 'ipWhitelist',     icon: Globe,         label: "Liste blanche d'IPs (admin)",  desc: "Restreindre l'accès admin à des IPs pré-approuvées" },
                  ] as const).map(item => {
                    const Icon = item.icon;
                    const value = securitySettings[item.key];
                    return (
                      <div key={item.key} className="py-4 flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${value ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`w-4 h-4 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <Label
                            className="font-medium text-sm cursor-pointer"
                            onClick={() => toggle(item.key)}
                          >
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={() => toggle(item.key)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    className="gap-2"
                    onClick={() => logAuditEvent({
                      action: 'admin_action',
                      details: 'Mise à jour de la configuration sécurité',
                      severity: 'warn',
                    })}
                  >
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

