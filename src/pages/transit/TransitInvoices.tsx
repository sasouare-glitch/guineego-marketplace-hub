import { TransitLayout } from "@/components/transit/TransitLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-12-15",
    shipmentRef: "SHP-GN-2024-0847",
    description: "Fret maritime - 2.5m³ marchandises diverses",
    amount: 6250000,
    status: "paid" as const,
  },
  {
    id: "INV-2024-002",
    date: "2024-12-20",
    shipmentRef: "SHP-GN-2024-0912",
    description: "Fret aérien - 45kg électronique",
    amount: 540000,
    status: "paid" as const,
  },
  {
    id: "INV-2025-001",
    date: "2025-01-10",
    shipmentRef: "SHP-GN-2025-0023",
    description: "Fret maritime - 1.2m³ textiles",
    amount: 3000000,
    status: "pending" as const,
  },
  {
    id: "INV-2025-002",
    date: "2025-01-28",
    shipmentRef: "SHP-GN-2025-0056",
    description: "Fret aérien - 12kg échantillons",
    amount: 144000,
    status: "pending" as const,
  },
  {
    id: "INV-2025-003",
    date: "2025-02-05",
    shipmentRef: "SHP-GN-2025-0078",
    description: "Fret maritime - 5m³ mobilier",
    amount: 12500000,
    status: "overdue" as const,
  },
];

const statusConfig = {
  paid: { label: "Payée", variant: "default" as const, className: "bg-green-500/10 text-green-600 border-green-200" },
  pending: { label: "En attente", variant: "secondary" as const, className: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  overdue: { label: "En retard", variant: "destructive" as const, className: "bg-red-500/10 text-red-600 border-red-200" },
};

const formatGNF = (amount: number) =>
  new Intl.NumberFormat("fr-GN", { style: "decimal" }).format(amount) + " GNF";

const TransitInvoices = () => {
  const [search, setSearch] = useState("");

  const filtered = mockInvoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.shipmentRef.toLowerCase().includes(search.toLowerCase()) ||
      inv.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = mockInvoices
    .filter((i) => i.status === "pending" || i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <TransitLayout title="Mes factures" subtitle="Historique et gestion de vos factures transit">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total factures</p>
            <p className="text-2xl font-bold">{mockInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Payées</p>
            <p className="text-2xl font-bold text-green-600">
              {mockInvoices.filter((i) => i.status === "paid").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Montant en attente</p>
            <p className="text-2xl font-bold text-yellow-600">{formatGNF(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une facture..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucune facture trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((invoice) => {
            const status = statusConfig[invoice.status];
            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{invoice.id}</span>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{invoice.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Réf: {invoice.shipmentRef} • {new Date(invoice.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">{formatGNF(invoice.amount)}</p>
                    <div className="flex gap-1 mt-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </TransitLayout>
  );
};

export default TransitInvoices;
