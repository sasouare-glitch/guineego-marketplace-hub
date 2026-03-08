/**
 * Admin SMS Logs Page
 * Displays history of all SMS sent from the sms_logs Firestore collection
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Search, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface SmsLog {
  id: string;
  type: string;
  to: string;
  status: string;
  error?: string;
  sentBy?: string;
  orderId?: string;
  createdAt: Date | null;
  response?: string;
}

export default function AdminSmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [limitCount, setLimitCount] = useState(50);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'sms_logs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (statusFilter !== 'all') {
        q = query(
          collection(db, 'sms_logs'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snap = await getDocs(q);
      const results: SmsLog[] = snap.docs.map(doc => {
        const d = doc.data();
        return {
          ...d,
          id: doc.id,
          createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : null,
        } as SmsLog;
      });
      setLogs(results);
    } catch (err) {
      console.error('Error loading SMS logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(); }, [statusFilter, limitCount]);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.to?.toLowerCase().includes(term) ||
      log.type?.toLowerCase().includes(term) ||
      log.orderId?.toLowerCase().includes(term) ||
      log.error?.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'sent') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Envoyé</Badge>;
    if (status === 'failed') return <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30"><XCircle className="w-3 h-3 mr-1" />Échoué</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
  };

  return (
    <AdminLayout title="Historique SMS" description="Journal des SMS envoyés via Orange SMS API">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total SMS</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.sent}</p>
                <p className="text-sm text-muted-foreground">Envoyés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <XCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.failed}</p>
                <p className="text-sm text-muted-foreground">Échoués</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Journal des SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, commande..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="sent">Envoyés</SelectItem>
                  <SelectItem value="failed">Échoués</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadLogs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Aucun SMS trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                          {log.createdAt
                            ? log.createdAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.to || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{log.type || '—'}</Badge>
                        </TableCell>
                        <TableCell><StatusBadge status={log.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.error || log.orderId || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {filteredLogs.length >= limitCount && (
              <div className="text-center mt-4">
                <Button variant="ghost" onClick={() => setLimitCount(prev => prev + 50)}>
                  Charger plus
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
