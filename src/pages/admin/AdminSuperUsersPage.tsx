/**
 * Admin Super Users Page - Manage super_user accounts and view their actions
 */

import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShieldCheck, Search, Loader2, Eye, UserX, Clock, Activity,
  ShieldAlert, CheckCircle2, AlertTriangle, UserPlus, CalendarIcon, X
} from 'lucide-react';
import {
  collection, query, where, orderBy, limit, onSnapshot,
  doc, updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { UserRole } from '@/types/auth';

interface SuperUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  roles?: UserRole[];
  status?: string;
  metadata?: {
    createdAt: any;
    lastLoginAt: any;
    updatedAt: any;
  };
}

interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performerEmail?: string;
  targetUserId?: string;
  targetUser?: string;
  details?: string;
  previousRole?: string;
  newRole?: string;
  severity?: string;
  createdAt: Timestamp | null;
}

const actionLabels: Record<string, string> = {
  role_changed: 'Rôle modifié',
  login_success: 'Connexion',
  admin_page_visit: 'Visite admin',
  session_revoked: 'Session révoquée',
  admin_action: 'Action admin',
  order_cancelled: 'Commande annulée',
  product_updated: 'Produit modifié',
  user_suspended: 'Utilisateur suspendu',
};

const severityConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  info: { icon: CheckCircle2, color: 'text-green-600' },
  warn: { icon: AlertTriangle, color: 'text-yellow-600' },
  error: { icon: ShieldAlert, color: 'text-destructive' },
};

export default function AdminSuperUsersPage() {
  const { claims } = useAuth();
  const isAdmin = claims?.role === 'admin';

  const [superUsers, setSuperUsers] = useState<SuperUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<SuperUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // Real-time listener for super_user accounts
  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'super_user'),
      orderBy('metadata.createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SuperUser[];
      setSuperUsers(data);
      setLoading(false);
    }, (error) => {
      console.error('Error loading super users:', error);
      toast.error('Erreur de chargement des super utilisateurs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Audit logs for super_user actions
  useEffect(() => {
    setLoadingAudit(true);

    // Listen to audit_logs performed by super_users
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AuditEntry[];
      // Filter logs performed by super_users (by matching performedBy with super user IDs)
      setAuditLogs(allLogs);
      setLoadingAudit(false);
    }, (error) => {
      console.error('Error loading audit logs:', error);
      setLoadingAudit(false);
    });

    return () => unsubscribe();
  }, []);

  // Computed: super user IDs for filtering audit logs
  const superUserIds = new Set(superUsers.map(u => u.id));
  const superUserEmails = new Map(superUsers.map(u => [u.id, u.email]));

  const superUserAuditLogs = auditLogs.filter(log =>
    superUserIds.has(log.performedBy)
  );

  const filteredSuperUsers = superUsers.filter(u =>
    (u.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredAuditLogs = superUserAuditLogs.filter(log =>
    !auditSearch ||
    (superUserEmails.get(log.performedBy) || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
    (actionLabels[log.action] ?? log.action).toLowerCase().includes(auditSearch.toLowerCase()) ||
    (log.details || '').toLowerCase().includes(auditSearch.toLowerCase())
  );

  // Revoke super_user role (admin only)
  const handleRevokeSuperUser = async (user: SuperUser) => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut révoquer un super_user');
      return;
    }
    setRevoking(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        role: 'customer',
        roles: ['customer'],
        'metadata.updatedAt': serverTimestamp()
      });
      toast.success(`Rôle super_user révoqué pour ${user.displayName || user.email}`);
    } catch (error) {
      console.error('Error revoking super_user:', error);
      toast.error('Erreur lors de la révocation');
    } finally {
      setRevoking(false);
    }
  };

  const formatTs = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const timeSince = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  return (
    <AdminLayout title="Super Users" description="Gestion des comptes super_user et suivi de leurs actions">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-cyan-600 shrink-0" />
              <div>
                {loading
                  ? <Skeleton className="h-8 w-12 mb-1" />
                  : <p className="text-2xl font-bold text-cyan-600">{superUsers.length}</p>
                }
                <p className="text-xs text-muted-foreground">Super Users actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Activity className="w-8 h-8 text-primary shrink-0" />
              <div>
                {loadingAudit
                  ? <Skeleton className="h-8 w-12 mb-1" />
                  : <p className="text-2xl font-bold">{superUserAuditLogs.length}</p>
                }
                <p className="text-xs text-muted-foreground">Actions tracées</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <Clock className="w-8 h-8 text-muted-foreground shrink-0" />
              <div>
                <p className="text-2xl font-bold">
                  {superUsers.filter(u =>
                    u.metadata?.lastLoginAt &&
                    (Date.now() - (u.metadata.lastLoginAt.toDate?.()?.getTime?.() || 0)) < 86400000
                  ).length}
                </p>
                <p className="text-xs text-muted-foreground">Connectés (24h)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-5 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {superUserAuditLogs.filter(l => l.severity === 'warn' || l.severity === 'error').length}
                </p>
                <p className="text-xs text-muted-foreground">Alertes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Super Users</TabsTrigger>
            <TabsTrigger value="actions">
              Journal d'actions
              {superUserAuditLogs.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {superUserAuditLogs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
          </TabsList>

          {/* ── Super Users List ── */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-cyan-600" />
                      Liste des Super Users
                    </CardTitle>
                    <CardDescription>
                      Comptes avec accès complet en lecture/écriture (sauf modification des rôles admin)
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSuperUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Aucun super_user trouvé</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Assignez le rôle super_user depuis la page Utilisateurs
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead>Depuis</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuperUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                {user.photoURL && <AvatarImage src={user.photoURL} />}
                                <AvatarFallback className="bg-cyan-500/10 text-cyan-600 text-sm">
                                  {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.displayName || 'Sans nom'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-cyan-500/10 text-cyan-700 border-cyan-500/20">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Super User
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {timeSince(user.metadata?.lastLoginAt)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTs(user.metadata?.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedUser(user); setDetailOpen(true); }}
                                className="gap-1 text-xs"
                              >
                                <Eye className="w-3 h-3" /> Détails
                              </Button>
                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="gap-1 text-xs text-destructive hover:text-destructive"
                                    >
                                      <UserX className="w-3 h-3" /> Révoquer
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Révoquer le rôle super_user ?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <strong>{user.displayName || user.email}</strong> sera rétrogradé au rôle <em>customer</em>.
                                        Il perdra l'accès à toutes les interfaces d'administration.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={() => handleRevokeSuperUser(user)}
                                        disabled={revoking}
                                      >
                                        {revoking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Confirmer la révocation
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Audit Logs for Super Users ── */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Actions des Super Users
                    </CardTitle>
                    <CardDescription>
                      Toutes les actions effectuées par les comptes super_user
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrer les actions..."
                      className="pl-9 w-64"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingAudit ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p>Aucune action enregistrée</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Super User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Sévérité</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuditLogs.map((log) => {
                        const sev = severityConfig[log.severity || 'info'] || severityConfig.info;
                        const SevIcon = sev.icon;
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium text-sm">
                              {superUserEmails.get(log.performedBy) || log.performerEmail || log.performedBy?.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {actionLabels[log.action] || log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                              {log.details || log.targetUser || '—'}
                            </TableCell>
                            <TableCell>
                              <SevIcon className={`w-4 h-4 ${sev.color}`} />
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatTs(log.createdAt)}
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

          {/* ── Restrictions Tab ── */}
          <TabsContent value="restrictions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                  Restrictions du rôle Super User
                </CardTitle>
                <CardDescription>
                  Ce que les super_users peuvent et ne peuvent pas faire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {/* Allowed */}
                  <div className="p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Autorisé
                    </h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>✅ Accéder à tous les dashboards (admin, vendeur, coursier, investisseur)</li>
                      <li>✅ Voir et modifier les données utilisateurs, commandes, produits</li>
                      <li>✅ Gérer les livraisons, le transit et l'Academy</li>
                      <li>✅ Consulter les finances et les rapports</li>
                      <li>✅ Changer le rôle des utilisateurs (sauf admin)</li>
                      <li>✅ Accéder aux paramètres et aux logs</li>
                    </ul>
                  </div>

                  {/* Forbidden */}
                  <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Interdit
                    </h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>🚫 Attribuer le rôle <strong>admin</strong> à un utilisateur</li>
                      <li>🚫 Modifier ou révoquer le rôle d'un <strong>administrateur</strong></li>
                      <li>🚫 Supprimer des comptes administrateurs</li>
                      <li>🚫 Modifier les emails admin prioritaires (bypass)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Note :</strong> Toutes les actions des super_users sont tracées dans le journal d'audit.
                    Seul un <strong>admin</strong> peut révoquer un super_user.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails du Super User</DialogTitle>
              <DialogDescription>
                Informations et historique d'activité
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    {selectedUser.photoURL && <AvatarImage src={selectedUser.photoURL} />}
                    <AvatarFallback className="bg-cyan-500/10 text-cyan-600 text-lg">
                      {(selectedUser.displayName || selectedUser.email || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{selectedUser.displayName || 'Sans nom'}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <Badge className="mt-1 bg-cyan-500/10 text-cyan-700 border-cyan-500/20">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Super User
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Inscrit le</p>
                    <p className="text-sm font-medium">{formatTs(selectedUser.metadata?.createdAt)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Dernière connexion</p>
                    <p className="text-sm font-medium">{formatTs(selectedUser.metadata?.lastLoginAt)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Actions récentes</p>
                  {superUserAuditLogs
                    .filter(log => log.performedBy === selectedUser.id)
                    .slice(0, 5)
                    .map(log => (
                      <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-sm">{actionLabels[log.action] || log.action}</span>
                        <span className="text-xs text-muted-foreground">{formatTs(log.createdAt)}</span>
                      </div>
                    ))
                  }
                  {superUserAuditLogs.filter(log => log.performedBy === selectedUser.id).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune action enregistrée</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
