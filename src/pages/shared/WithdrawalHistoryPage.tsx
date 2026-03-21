import { useState } from "react";
import { useWithdrawalHistory, Withdrawal, formatGNF } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Wallet,
  ArrowUpFromLine,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: {
    label: "En attente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  approved: {
    label: "Approuvé",
    icon: CheckCircle2,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  completed: {
    label: "Complété",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  rejected: {
    label: "Rejeté",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const methodConfig: Record<string, { label: string; icon: any; color: string }> = {
  orange_money: { label: "Orange Money", icon: Smartphone, color: "text-[#FF6600]" },
  mtn_money: { label: "MTN Money", icon: Smartphone, color: "text-[#FFCC00]" },
  cash: { label: "Cash", icon: Wallet, color: "text-primary" },
};

interface WithdrawalHistoryPageProps {
  backUrl: string;
  layout: React.ComponentType<{ children: React.ReactNode }>;
}

export default function WithdrawalHistoryPage({ backUrl, layout: Layout }: WithdrawalHistoryPageProps) {
  const navigate = useNavigate();
  const { data: withdrawals, isLoading, error } = useWithdrawalHistory();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (withdrawals || []).filter((w) => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const stats = {
    pending: (withdrawals || []).filter((w) => w.status === "pending").length,
    completed: (withdrawals || []).filter((w) => w.status === "completed").length,
    rejected: (withdrawals || []).filter((w) => w.status === "rejected").length,
    totalAmount: (withdrawals || [])
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + w.amount, 0),
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historique des retraits</h1>
            <p className="text-muted-foreground">Suivez l'état de vos demandes de retrait</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Complétés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejetés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ArrowUpFromLine className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatGNF(stats.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground">Total retiré</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvé</SelectItem>
              <SelectItem value="completed">Complété</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs">
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Demandes de retrait</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-sm">Erreur lors du chargement</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowUpFromLine className="w-8 h-8 mb-2" />
                <p className="text-sm">Aucune demande de retrait</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((withdrawal) => {
                  const status = statusConfig[withdrawal.status] || statusConfig.pending;
                  const method = methodConfig[withdrawal.method] || methodConfig.orange_money;
                  const StatusIcon = status.icon;
                  const MethodIcon = method.icon;

                  return (
                    <div key={withdrawal.id} className="flex items-center justify-between py-4 gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", status.className)}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground">
                              {formatGNF(withdrawal.amount)}
                            </p>
                            <Badge variant="outline" className={cn("text-xs", status.className)}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MethodIcon className={cn("w-3.5 h-3.5", method.color)} />
                            <span>{method.label}</span>
                            {withdrawal.phone && (
                              <>
                                <span>·</span>
                                <span>{withdrawal.phone}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {withdrawal.createdAt
                              ? new Date(withdrawal.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </p>
                          {withdrawal.rejectionReason && (
                            <p className="text-xs text-destructive mt-1">
                              Motif: {withdrawal.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm text-muted-foreground">Frais</p>
                        <p className="font-medium text-foreground">{formatGNF(withdrawal.fee)}</p>
                        {withdrawal.status === "completed" && withdrawal.completedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(withdrawal.completedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
