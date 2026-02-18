/**
 * Admin Academy Page - LMS Course Management
 */

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, MoreHorizontal, GraduationCap, BookOpen, Users, 
  Star, Eye, EyeOff, Plus, RefreshCw, TrendingUp, Award
} from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const mockCourses = [
  {
    id: 'CRSE-001', title: 'Lancer son e-commerce en Guinée', category: 'Commerce',
    instructor: 'Mamadou Diallo', price: 150000, enrolled: 342, 
    completionRate: 68, rating: 4.7, lessons: 24, status: 'published',
    revenue: 51300000,
  },
  {
    id: 'CRSE-002', title: 'Investissement et finances personnelles', category: 'Finance',
    instructor: 'Fatoumata Barry', price: 200000, enrolled: 198,
    completionRate: 54, rating: 4.5, lessons: 18, status: 'published',
    revenue: 39600000,
  },
  {
    id: 'CRSE-003', title: 'Marketing digital pour entrepreneurs', category: 'Marketing',
    instructor: 'Ibrahima Sow', price: 120000, enrolled: 521,
    completionRate: 72, rating: 4.8, lessons: 30, status: 'published',
    revenue: 62520000,
  },
  {
    id: 'CRSE-004', title: 'Logistique et gestion de stock', category: 'Logistique',
    instructor: 'Alpha Condé', price: 100000, enrolled: 87,
    completionRate: 41, rating: 4.2, lessons: 15, status: 'draft',
    revenue: 8700000,
  },
  {
    id: 'CRSE-005', title: 'Leadership et management d\'équipe', category: 'Management',
    instructor: 'Aissatou Camara', price: 180000, enrolled: 0,
    completionRate: 0, rating: 0, lessons: 20, status: 'draft',
    revenue: 0,
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  published: { label: 'Publié',   variant: 'default' },
  draft:     { label: 'Brouillon', variant: 'secondary' },
  archived:  { label: 'Archivé',  variant: 'outline' },
};

const categoryColors: Record<string, string> = {
  Commerce:   'bg-blue-500/10 text-blue-700',
  Finance:    'bg-green-500/10 text-green-700',
  Marketing:  'bg-purple-500/10 text-purple-700',
  Logistique: 'bg-orange-500/10 text-orange-700',
  Management: 'bg-red-500/10 text-red-700',
};

export default function AdminAcademyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { format } = useCurrency();

  const filtered = mockCourses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || c.status === activeTab;
    return matchSearch && matchTab;
  });

  const totalRevenue = mockCourses.reduce((sum, c) => sum + c.revenue, 0);
  const totalEnrolled = mockCourses.reduce((sum, c) => sum + c.enrolled, 0);
  const avgRating = mockCourses.filter(c => c.rating > 0).reduce((sum, c) => sum + c.rating, 0) / 
    mockCourses.filter(c => c.rating > 0).length;

  return (
    <AdminLayout title="Academy" description="Gestion des formations et apprenants">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
                <p className="text-2xl font-bold">{mockCourses.length}</p>
              </div>
              <p className="text-sm text-muted-foreground">Formations totales</p>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <p className="text-2xl font-bold text-primary">{totalEnrolled.toLocaleString()}</p>
              </div>
              <p className="text-sm text-muted-foreground">Apprenants inscrits</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">{avgRating.toFixed(1)}</p>
              </div>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xl font-bold text-green-600">{format(totalRevenue)}</p>
              </div>
              <p className="text-sm text-muted-foreground">Revenus Academy</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <CardTitle>Catalogue des formations</CardTitle>
                <CardDescription>Gérez les cours, instructeurs et apprenants</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Titre, instructeur, catégorie..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle formation
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="published">Publiées</TabsTrigger>
                <TabsTrigger value="draft">Brouillons</TabsTrigger>
                <TabsTrigger value="archived">Archivées</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formation</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Instructeur</TableHead>
                  <TableHead>Inscrits</TableHead>
                  <TableHead>Complétion</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Revenus</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const status = statusConfig[c.status];
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium max-w-48 truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.lessons} leçons</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[c.category] || 'bg-muted text-muted-foreground'}`}>
                          {c.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.instructor}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{c.enrolled.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-24">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Progression</span>
                            <span className="font-medium">{c.completionRate}%</span>
                          </div>
                          <Progress value={c.completionRate} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{c.rating}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{format(c.price)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {c.revenue > 0 ? format(c.revenue) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir la formation
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Award className="w-4 h-4 mr-2" />
                              Voir apprenants
                            </DropdownMenuItem>
                            {c.status === 'published' ? (
                              <DropdownMenuItem>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Dépublier
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Publier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
