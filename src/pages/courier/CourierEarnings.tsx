import { CourierLayout } from "@/components/courier/CourierLayout";
import { EarningsChart, EarningsPeriod } from "@/components/courier/EarningsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WithdrawalDialog } from "@/components/shared/WithdrawalDialog";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  TrendingUp,
  Download,
  Smartphone,
  Loader2,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useWallet, useTransactions, useWithdrawal, formatGNF } from "@/hooks/useWallet";
import { useWithdrawalLimits } from "@/hooks/useWithdrawalLimits";
import { useCourierMissions } from "@/hooks/useCourierMissions";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { useNavigate } from "react-router-dom";

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
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  const { wallet, loading: walletLoading } = useWallet();
  const { transactions, loading: txLoading } = useTransactions();
  const { myMissions } = useCourierMissions();
  const { requestWithdrawal, isLoading: withdrawing } = useWithdrawal();
  const navigate = useNavigate();
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

  const handleWithdraw = (data: { amount: number; method: "orange_money" | "mtn_money" | "cash"; phone?: string }) => {
    requestWithdrawal(data);
  };

  return (
    <CourierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Mes Revenus</h1>
            <p className="text-muted-foreground">Suivez vos gains et retraits</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/courier/withdrawals')} className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Historique retraits</span>
            </Button>
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
                    onClick={() => setWithdrawalOpen(true)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Retirer
                  </Button>
                  <p className="text-xs text-white/60 mt-2 text-center">
                    Min: {courierLimits.minAmount.toLocaleString()} · Max: {courierLimits.maxAmount.toLocaleString()} GNF
                  </p>
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

        {/* Withdrawal Dialog */}
        <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Demande de retrait</DialogTitle>
              <DialogDescription>
                Solde disponible: {computedBalance.toLocaleString("fr-GN")} GNF
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Limits info */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Min: {courierLimits.minAmount.toLocaleString()} GNF · Max: {courierLimits.maxAmount.toLocaleString()} GNF · Frais: {courierLimits.feePercent}%
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Montant à retirer</Label>
                <Input
                  type="number"
                  placeholder={`Min: ${courierLimits.minAmount.toLocaleString()} GNF`}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  min={courierLimits.minAmount}
                  max={Math.min(courierLimits.maxAmount, computedBalance)}
                />
              </div>

              {/* Method */}
              <div className="space-y-2">
                <Label>Mode de retrait</Label>
                <RadioGroup
                  value={withdrawalMethod}
                  onValueChange={(v) => setWithdrawalMethod(v as any)}
                  className="grid grid-cols-3 gap-4"
                >
                  <div>
                    <RadioGroupItem value="orange_money" id="courier-orange" className="peer sr-only" />
                    <Label htmlFor="courier-orange" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <Smartphone className="mb-2 h-6 w-6 text-[#FF6600]" />
                      <span className="text-sm font-medium">Orange Money</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="mtn_money" id="courier-mtn" className="peer sr-only" />
                    <Label htmlFor="courier-mtn" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <Smartphone className="mb-2 h-6 w-6 text-[#FFCC00]" />
                      <span className="text-sm font-medium">MTN Money</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="cash" id="courier-cash" className="peer sr-only" />
                    <Label htmlFor="courier-cash" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                      <Wallet className="mb-2 h-6 w-6 text-guinea-green" />
                      <span className="text-sm font-medium">Cash</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Phone */}
              {withdrawalMethod !== "cash" && (
                <div className="space-y-2">
                  <Label>Numéro de téléphone</Label>
                  <Input
                    placeholder="6XX XX XX XX"
                    value={withdrawalPhone}
                    onChange={(e) => setWithdrawalPhone(e.target.value)}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawalOpen(false)}>Annuler</Button>
              <Button onClick={handleWithdraw} disabled={withdrawing}>
                {withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirmer le retrait
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CourierLayout>
  );
};

export default CourierEarnings;
