import { useSubscriptionHistory } from '@/hooks/useSubscriptionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Smartphone, CreditCard } from 'lucide-react';

const methodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  orange_money: { label: 'Orange Money', icon: <Smartphone className="h-4 w-4 text-orange-500" /> },
  mtn_money: { label: 'MTN Money', icon: <Smartphone className="h-4 w-4 text-yellow-500" /> },
  card: { label: 'Carte bancaire', icon: <CreditCard className="h-4 w-4 text-primary" /> },
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  completed: 'default',
  pending: 'secondary',
  failed: 'destructive',
};

const statusLabel: Record<string, string> = {
  completed: 'Payé',
  pending: 'En attente',
  failed: 'Échoué',
};

export function SubscriptionHistory() {
  const { payments, loading } = useSubscriptionHistory();

  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader><CardTitle>Historique des paiements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Historique des paiements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucun paiement d'abonnement pour le moment
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Mode de paiement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const method = methodLabels[p.paymentMethod] || { label: p.paymentMethod, icon: null };
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-foreground">
                      {p.createdAt.toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{p.planName}</TableCell>
                    <TableCell className="text-foreground">
                      {p.amount === 0 ? 'Gratuit' : `${p.amount.toLocaleString('fr-GN')} GNF`}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-foreground">
                        {method.icon}
                        {method.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.status] || 'secondary'}>
                        {statusLabel[p.status] || p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
