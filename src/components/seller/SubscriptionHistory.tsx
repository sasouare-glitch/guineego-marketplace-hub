import { useSubscriptionHistory, type SubscriptionPayment } from '@/hooks/useSubscriptionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Smartphone, CreditCard, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import logoGuineego from '@/assets/logo-guineego.png';

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

const methodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  orange_money: { label: 'Orange Money', icon: <Smartphone className="h-4 w-4 text-orange-500" /> },
  mtn_money: { label: 'MTN Money', icon: <Smartphone className="h-4 w-4 text-yellow-500" /> },
  card: { label: 'Carte bancaire', icon: <CreditCard className="h-4 w-4 text-primary" /> },
};

const methodLabelText: Record<string, string> = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  card: 'Carte bancaire',
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

function generateInvoicePDF(payment: SubscriptionPayment) {
  const doc = new jsPDF();
  const dateStr = payment.createdAt.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const invoiceNum = `GGO-${payment.id.slice(0, 8).toUpperCase()}`;
  const amountStr = payment.amount === 0 ? 'Gratuit' : `${payment.amount.toLocaleString('fr-GN')} GNF`;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('GuineeGo', 20, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Marketplace & Services', 20, 32);

  // Invoice title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURE', 150, 25);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`N° ${invoiceNum}`, 150, 32);
  doc.text(`Date : ${dateStr}`, 150, 38);

  // Separator
  doc.setDrawColor(220, 220, 220);
  doc.line(20, 48, 190, 48);

  // Details section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Détails de la facture', 20, 60);

  const startY = 72;
  const labelX = 20;
  const valueX = 90;
  const lineH = 10;

  const rows = [
    ['Abonnement', `Plan ${payment.planName}`],
    ['Montant', amountStr],
    ['Mode de paiement', methodLabelText[payment.paymentMethod] || payment.paymentMethod],
    ['Statut', statusLabel[payment.status] || payment.status],
    ['Date de paiement', dateStr],
  ];

  doc.setFontSize(10);
  rows.forEach(([label, value], i) => {
    const y = startY + i * lineH;
    // Alternate row bg
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(labelX - 2, y - 6, 174, lineH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(label, labelX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(value, valueX, y);
  });

  // Total box
  const totalY = startY + rows.length * lineH + 10;
  doc.setFillColor(34, 34, 34);
  doc.roundedRect(110, totalY - 8, 80, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Total : ${amountStr}`, 118, totalY + 2);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('GuineeGo SAS — Conakry, Guinée', 20, 270);
  doc.text('support@guineego.com | www.guineego.com', 20, 275);
  doc.text('Ce document est généré automatiquement et fait office de justificatif de paiement.', 20, 280);

  doc.save(`facture-guineego-${invoiceNum}.pdf`);
  toast.success('Facture téléchargée');
}

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
                <TableHead className="text-right">Facture</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateInvoicePDF(p)}
                        className="gap-1.5"
                      >
                        <Download className="h-4 w-4" />
                        PDF
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
  );
}