import { CourierLayout } from "@/components/courier/CourierLayout";
import { EarningsChart, EarningsPeriod } from "@/components/courier/EarningsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  TrendingUp,
  Download,
  Smartphone,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useWallet, useTransactions, formatGNF } from "@/hooks/useWallet";
import { useWithdrawalLimits } from "@/hooks/useWithdrawalLimits";
import { useCourierMissions } from "@/hooks/useCourierMissions";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";

function getPeriodStart(period: EarningsPeriod): Date {
  const now = new Date();
  switch (period) {
    case "today": return startOfDay(now);
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "year": return startOfYear(now);
  }
}

const CourierEarnings = () => {
  const [period, setPeriod] = useState<EarningsPeriod>("week");
  const { wallet, loading: walletLoading } = useWallet();
  const { transactions, loading: txLoading } = useTransactions();
  const { myMissions } = useCourierMissions();
  const { getEffectiveLimits } = useWithdrawalLimits();
  const courierLimits = getEffectiveLimits('courier');

  const loading = walletLoading;

  // Calculate from delivered missions as fallback
  const deliveredMissions = myMissions.filter((m) => m.status === "delivered");
  const totalEarningsFromMissions = deliveredMissions.reduce((sum, m) => sum + (m.fee || 0), 0);
  const totalWithdrawals = wallet?.totalWithdrawals || 0;

  const computedTotalEarnings = wallet?.totalEarnings || totalEarningsFromMissions;
  const computedBalance = wallet?.balance || (totalEarningsFromMissions - totalWithdrawals);
  const completedCount = wallet?.completedMissions || deliveredMissions.length;

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const start = getPeriodStart(period);
    return transactions.filter((tx) => {
      if (!tx.createdAt) return false;
      const d = new Date(tx.createdAt);
      return d >= start;
    });
  }, [transactions, period]);

  return (
    <CourierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Mes Revenus</h1>
            <p className="text-muted-foreground">Suivez vos gains et retraits</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as EarningsPeriod)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-guinea-green to-guinea-green/80 text-white border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/80 text-sm">Solde disponible</p>
                      <p className="text-3xl font-display font-bold mt-1">
                        {computedBalance.toLocaleString("fr-GN")} GNF
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Retirer
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Gains totaux</p>
                      <p className="text-2xl font-display font-bold mt-1">
                        {computedTotalEarnings.toLocaleString("fr-GN")} GNF
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-guinea-green text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>{completedCount} missions</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-guinea-green/10 flex items-center justify-center">
                      <ArrowDownLeft className="w-6 h-6 text-guinea-green" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">En attente</p>
                      <p className="text-2xl font-display font-bold mt-1">
                        {(wallet?.pendingWithdrawals || 0).toLocaleString("fr-GN")} GNF
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Retraits en cours
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-guinea-yellow/10 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-guinea-yellow" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <EarningsChart missions={myMissions} period={period} />

            {/* Transactions */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">
                    Historique des transactions
                    {filteredTransactions.length !== transactions.length && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {filteredTransactions.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exporter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === "debit"
                                ? "bg-guinea-red/10"
                                : "bg-guinea-green/10"
                            }`}
                          >
                            {tx.type === "debit" ? (
                              <ArrowUpRight className="w-5 h-5 text-guinea-red" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5 text-guinea-green" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === "debit" ? "text-guinea-red" : "text-guinea-green"}`}>
                            {tx.type === "credit" ? "+" : "-"}
                            {tx.amount.toLocaleString("fr-GN")} GNF
                          </p>
                          {tx.status === "pending" && (
                            <Badge variant="outline" className="text-xs bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20">
                              En attente
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune transaction pour cette période</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CourierLayout>
  );
};

export default CourierEarnings;
