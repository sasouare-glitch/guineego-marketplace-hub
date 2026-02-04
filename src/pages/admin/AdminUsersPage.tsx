/**
 * Admin Users Page - User Management
 */

import { useState } from 'react';
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
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, UserPlus, Filter } from 'lucide-react';

// Mock data
const mockUsers = [
  { id: '1', name: 'Mamadou Diallo', email: 'mamadou@email.com', role: 'customer', status: 'active', createdAt: '2024-01-15' },
  { id: '2', name: 'Fatoumata Barry', email: 'fatoumata@email.com', role: 'ecommerce', status: 'active', createdAt: '2024-01-10' },
  { id: '3', name: 'Ibrahima Sow', email: 'ibrahima@email.com', role: 'courier', status: 'active', createdAt: '2024-01-08' },
  { id: '4', name: 'Aissatou Camara', email: 'aissatou@email.com', role: 'closer', status: 'pending', createdAt: '2024-01-20' },
  { id: '5', name: 'Oumar Bah', email: 'oumar@email.com', role: 'investor', status: 'active', createdAt: '2024-01-05' },
];

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  customer: { label: 'Client', variant: 'secondary' },
  ecommerce: { label: 'Vendeur', variant: 'default' },
  courier: { label: 'Coursier', variant: 'outline' },
  closer: { label: 'Closer', variant: 'outline' },
  investor: { label: 'Investisseur', variant: 'default' },
  admin: { label: 'Admin', variant: 'default' },
};

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Utilisateurs" description="Gestion des comptes utilisateurs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-primary">89</p>
              <p className="text-sm text-muted-foreground">Vendeurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">45</p>
              <p className="text-sm text-muted-foreground">Coursiers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold text-accent">12</p>
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
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleLabels[user.role]?.variant || 'secondary'}>
                        {roleLabels[user.role]?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'Actif' : 'En attente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                          <DropdownMenuItem>Modifier le rôle</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Suspendre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
