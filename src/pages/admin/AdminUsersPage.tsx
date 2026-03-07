/**
 * Admin Users Page - User Management with Firebase Integration
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, MoreHorizontal, UserPlus, Filter, Loader2, RefreshCw, ShieldCheck, Truck, Store, TrendingUp, Users } from 'lucide-react';
import { collection, query, orderBy, limit, doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserRole } from '@/types/auth';

interface FirestoreUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  roles?: UserRole[];
  status?: string;
  metadata?: {
    createdAt: any;
    lastLoginAt: any;
  };
}

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ReactNode }> = {
  customer: { label: 'Client', variant: 'secondary', icon: <Users className="w-3 h-3" /> },
  ecommerce: { label: 'Vendeur', variant: 'default', icon: <Store className="w-3 h-3" /> },
  courier: { label: 'Coursier', variant: 'outline', icon: <Truck className="w-3 h-3" /> },
  closer: { label: 'Closer', variant: 'outline', icon: <ShieldCheck className="w-3 h-3" /> },
  investor: { label: 'Investisseur', variant: 'default', icon: <TrendingUp className="w-3 h-3" /> },
  admin: { label: 'Admin', variant: 'destructive', icon: <ShieldCheck className="w-3 h-3" /> },
};

const allRoles: UserRole[] = ['customer', 'ecommerce', 'courier', 'closer', 'investor', 'admin'];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('customer');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  // Real-time listener for users
  useEffect(() => {
    setLoading(true);
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('metadata.createdAt', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as FirestoreUser[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: users.length,
    sellers: users.filter(u => u.role === 'ecommerce').length,
    couriers: users.filter(u => u.role === 'courier').length,
    investors: users.filter(u => u.role === 'investor').length,
  };

  // Open role change dialog
  const openRoleDialog = (user: FirestoreUser) => {
    setSelectedUser(user);
    setNewRole(user.role || 'customer');
    setReason('');
    setRoleDialogOpen(true);
  };

  // Update role via Cloud Function
  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      // Try Cloud Function first
      try {
        const updateUserRole = callFunction<{ userId: string; newRole: string; reason: string }, { success: boolean }>('updateUserRole');
        await updateUserRole({
          userId: selectedUser.id,
          newRole,
          reason
        });
      } catch (cfError) {
        console.warn('Cloud Function failed, updating Firestore directly:', cfError);
        // Fallback: Update Firestore directly (claims won't update until next login)
        await updateDoc(doc(db, 'users', selectedUser.id), {
          role: newRole,
          roles: [newRole],
          'metadata.updatedAt': serverTimestamp()
        });
        toast.warning('Rôle mis à jour dans Firestore. L\'utilisateur doit se reconnecter pour activer les permissions.');
      }
      
      toast.success(`Rôle de ${selectedUser.displayName || selectedUser.email} changé en ${roleLabels[newRole]?.label}`);
      setRoleDialogOpen(false);
      loadUsers(); // Refresh list
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du rôle');
    } finally {
      setUpdating(false);
    }
  };

  // Quick role update (direct Firestore for testing)
  const quickSetRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role,
        roles: [role],
        claims: { role, roles: [role] },
        'metadata.updatedAt': serverTimestamp()
      });
      toast.success(`Rôle mis à jour en ${roleLabels[role]?.label}. Reconnectez-vous pour appliquer.`);
      loadUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <AdminLayout title="Utilisateurs" description="Gestion des comptes utilisateurs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold text-primary">{stats.sellers}</p>
              </div>
              <p className="text-sm text-muted-foreground">Vendeurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-destructive" />
                <p className="text-2xl font-bold">{stats.couriers}</p>
              </div>
              <p className="text-sm text-muted-foreground">Coursiers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                <p className="text-2xl font-bold text-accent">{stats.investors}</p>
              </div>
              <p className="text-sm text-muted-foreground">Investisseurs</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <CardDescription>Gérez les comptes et les rôles</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher..." 
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={loadUsers} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            {user.photoURL && <AvatarImage src={user.photoURL} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
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
                        <Badge 
                          variant={roleLabels[user.role]?.variant || 'secondary'}
                          className="flex items-center gap-1 w-fit"
                        >
                          {roleLabels[user.role]?.icon}
                          {roleLabels[user.role]?.label || user.role || 'customer'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'suspended' ? 'destructive' : 'default'}>
                          {user.status === 'suspended' ? 'Suspendu' : 'Actif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.metadata?.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {allRoles.map((role) => (
                              <DropdownMenuItem 
                                key={role}
                                onClick={() => quickSetRole(user.id, role)}
                                className="flex items-center gap-2"
                              >
                                {roleLabels[role]?.icon}
                                <span>{roleLabels[role]?.label}</span>
                                {user.role === role && <span className="ml-auto text-primary">✓</span>}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-muted bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-2">💡 Comment assigner des rôles</h3>
            <p className="text-sm text-muted-foreground">
              Cliquez sur les trois points (⋮) à droite d'un utilisateur, puis sélectionnez le nouveau rôle. 
              L'utilisateur devra se <strong>reconnecter</strong> pour que les permissions Firebase prennent effet.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changer le rôle de {selectedUser?.displayName || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        {roleLabels[role]?.icon}
                        <span>{roleLabels[role]?.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Raison (optionnel)</Label>
              <Textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif du changement de rôle..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateRole} disabled={updating}>
                {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
