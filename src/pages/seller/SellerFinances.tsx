import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/seller/StatCard";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useWallet, useTransactions, useWithdrawal } from "@/hooks/useWallet";
import { useCurrency } from "@/hooks/useCurrency";
import { useWithdrawalLimits } from "@/hooks/useWithdrawalLimits";
import { toast } from "sonner";

const typeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  credit: { label: "Crédit", icon: ArrowDownToLine, color: "text-primary", bgColor: "bg-primary/10" },
  debit: { label: "Débit", icon: ArrowUpFromLine, color: "text-destructive", bgColor: "bg-destructive/10" },
  sale: { label: "Vente", icon: ArrowDownToLine, color: "text-primary", bgColor: "bg-primary/10" },
  commission: { label: "Commission", icon: CreditCard, color: "text-muted-foreground", bgColor: "bg-muted" },
  withdrawal: { label: "Retrait", icon: ArrowUpFromLine, color: "text-accent", bgColor: "bg-accent/10" },
  refund: { label: "Remboursement", icon: ArrowUpFromLine, color: "text-destructive", bgColor: "bg-destructive/10" },
  fee: { label: "Frais", icon: CreditCard, color: "text-muted-foreground", bgColor: "bg-muted" },
};

const statusConfig: Record<string, { label: string; icon: any; variant: string }> = {
  completed: { label: "Effectué", icon: CheckCircle2, variant: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "En cours", icon: Clock, variant: "bg-accent/10 text-accent border-accent/20" },
  failed: { label: "Échoué", icon: XCircle, variant: "bg-destructive/10 text-destructive border-destructive/20" },
  cancelled: { label: "Annulé", icon: XCircle, variant: "bg-destructive/10 text-destructive border-destructive/20" },
};

function formatDate(date: Date | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function SellerFinances() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<"orange_money" | "mtn_money" | "cash">("orange_money");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalPhone, setWithdrawalPhone] = useState("");

  const { wallet, loading: walletLoading } = useWallet();
  const { transactions, loading: txLoading, hasMore, loadMore } = useTransactions(30);
  const { requestWithdrawal, isLoading: withdrawing } = useWithdrawal();
  const { format: formatPrice } = useCurrency();

  const loading = walletLoading;

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SellerLayout>
    );
  }

  const availableBalance = wallet?.balance ?? 0;
  const pendingBalance = wallet?.pendingWithdrawals ?? 0;
  const totalSales = wallet?.totalSales ?? wallet?.totalEarnings ?? 0;

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter === "all") return true;
    return t.category === typeFilter || t.type === typeFilter;
  });

  const handleWithdraw = () => {
    const amount = parseInt(withdrawalAmount);
    if (!amount || amount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (amount > availableBalance) {
      toast.error("Solde insuffisant");
      return;
    }
    if (withdrawalMethod !== "cash" && !withdrawalPhone) {
      toast.error("Numéro de téléphone requis");
      return;
    }
    requestWithdrawal({
      amount,
      method: withdrawalMethod,
      phone: withdrawalMethod !== "cash" ? withdrawalPhone : undefined,
    });
    setWithdrawalOpen(false);
    setWithdrawalAmount("");
    setWithdrawalPhone("");
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">Finances</h1>
            <p className="text-muted-foreground">Gérez vos revenus et retraits</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
            <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4" />
                  Retirer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Demande de retrait</DialogTitle>
                  <DialogDescription>
                    Solde disponible: {formatPrice(availableBalance)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Montant à retirer</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5000000"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mode de retrait</Label>
                    <RadioGroup
                      value={withdrawalMethod}
                      onValueChange={(v) => setWithdrawalMethod(v as any)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="orange_money" id="orange" className="peer sr-only" />
                        <Label htmlFor="orange" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <Smartphone className="mb-2 h-6 w-6 text-[#FF6600]" />
                          <span className="text-sm font-medium">Orange Money</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="mtn_money" id="mtn" className="peer sr-only" />
                        <Label htmlFor="mtn" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <Smartphone className="mb-2 h-6 w-6 text-[#FFCC00]" />
                          <span className="text-sm font-medium">MTN Money</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                        <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                          <WalletIcon className="mb-2 h-6 w-6 text-primary" />
                          <span className="text-sm font-medium">Cash</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {withdrawalMethod !== "cash" && (
                    <div className="space-y-2">
                      <Label>Numéro de téléphone</Label>
                      <Input
                        placeholder="+224 6XX XX XX XX"
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
          </motion.div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Solde disponible"
            value={formatPrice(availableBalance)}
            icon={WalletIcon}
            iconColor="primary"
            delay={0}
          />
          <StatCard
            title="En attente"
            value={formatPrice(pendingBalance)}
            icon={Clock}
            iconColor="accent"
            delay={0.1}
          />
          <StatCard
            title="Total des ventes"
            value={formatPrice(totalSales)}
            icon={TrendingUp}
            iconColor="primary"
            delay={0.2}
          />
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="credit">Crédits</SelectItem>
              <SelectItem value="debit">Débits</SelectItem>
              <SelectItem value="sale">Ventes</SelectItem>
              <SelectItem value="withdrawal">Retraits</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Transactions List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Historique des transactions</h3>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Aucune transaction</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTransactions.map((transaction) => {
                const typeKey = transaction.category || transaction.type;
                const type = typeConfig[typeKey] || typeConfig.credit;
                const status = statusConfig[transaction.status] || statusConfig.pending;
                const TypeIcon = type.icon;
                const StatusIcon = status.icon;
                const isPositive = transaction.type === 'credit';

                return (
                  <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", type.bgColor)}>
                        <TypeIcon className={cn("w-5 h-5", type.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatDate(transaction.createdAt)}</span>
                          {transaction.metadata?.orderId && (
                            <>
                              <span>•</span>
                              <span>#{transaction.metadata.orderId.toString().slice(0, 8)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className={cn("hidden sm:flex items-center gap-1", status.variant)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                      <span className={cn("font-bold text-right min-w-[140px]", isPositive ? "text-primary" : "text-foreground")}>
                        {isPositive ? "+" : "-"}{formatPrice(transaction.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasMore && !txLoading && filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-border flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore}>
                Charger plus
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </SellerLayout>
  );
}
