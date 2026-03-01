import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
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
} from "lucide-react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/seller/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "sale" | "withdrawal" | "refund" | "fee";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  date: string;
  reference?: string;
}

const transactions: Transaction[] = [
  {
    id: "1",
    type: "sale",
    amount: 12500000,
    description: "Vente #GG-1234 - iPhone 15 Pro Max",
    status: "completed",
    date: "2024-01-15 14:30",
    reference: "#GG-1234",
  },
  {
    id: "2",
    type: "sale",
    amount: 2500000,
    description: "Vente #GG-1233 - AirPods Pro 2",
    status: "completed",
    date: "2024-01-15 12:15",
    reference: "#GG-1233",
  },
  {
    id: "3",
    type: "withdrawal",
    amount: -5000000,
    description: "Retrait vers Orange Money",
    status: "pending",
    date: "2024-01-14 18:00",
  },
  {
    id: "4",
    type: "fee",
    amount: -375000,
    description: "Commission GuineeGo (3%)",
    status: "completed",
    date: "2024-01-14 16:45",
  },
  {
    id: "5",
    type: "sale",
    amount: 15350000,
    description: "Vente #GG-1232 - MacBook Air M3",
    status: "completed",
    date: "2024-01-14 16:45",
    reference: "#GG-1232",
  },
  {
    id: "6",
    type: "refund",
    amount: -9800000,
    description: "Remboursement #GG-1230 - Client annulé",
    status: "completed",
    date: "2024-01-12 11:00",
    reference: "#GG-1230",
  },
  {
    id: "7",
    type: "withdrawal",
    amount: -10000000,
    description: "Retrait vers MTN Money",
    status: "completed",
    date: "2024-01-10 09:30",
  },
];

const typeConfig = {
  sale: {
    label: "Vente",
    icon: ArrowDownToLine,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  withdrawal: {
    label: "Retrait",
    icon: ArrowUpFromLine,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  refund: {
    label: "Remboursement",
    icon: ArrowUpFromLine,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  fee: {
    label: "Commission",
    icon: CreditCard,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const statusConfig = {
  completed: {
    label: "Effectué",
    icon: CheckCircle2,
    variant: "bg-primary/10 text-primary border-primary/20",
  },
  pending: {
    label: "En cours",
    icon: Clock,
    variant: "bg-accent/10 text-accent border-accent/20",
  },
  failed: {
    label: "Échoué",
    icon: XCircle,
    variant: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const formatPrice = (price: number) => {
  const absPrice = Math.abs(price);
  return (price < 0 ? "-" : "+") + absPrice.toLocaleString("fr-GN") + " GNF";
};

export default function SellerFinances() {
  const [periodFilter, setPeriodFilter] = useState("month");
  const [typeFilter, setTypeFilter] = useState("all");
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState("orange");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  const availableBalance = 15175000;
  const pendingBalance = 5000000;
  const totalSales = 30350000;

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter === "all") return true;
    return t.type === typeFilter;
  });

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-bold text-foreground">Finances</h1>
            <p className="text-muted-foreground">
              Gérez vos revenus et retraits
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2"
          >
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
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
                    Solde disponible: {availableBalance.toLocaleString("fr-GN")} GNF
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
                      onValueChange={setWithdrawalMethod}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="orange"
                          id="orange"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="orange"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Smartphone className="mb-2 h-6 w-6 text-[#FF6600]" />
                          <span className="text-sm font-medium">Orange Money</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="mtn"
                          id="mtn"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="mtn"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Smartphone className="mb-2 h-6 w-6 text-[#FFCC00]" />
                          <span className="text-sm font-medium">MTN Money</span>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem
                          value="cash"
                          id="cash"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="cash"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Wallet className="mb-2 h-6 w-6 text-primary" />
                          <span className="text-sm font-medium">Cash</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Numéro de téléphone</Label>
                    <Input placeholder="+224 6XX XX XX XX" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWithdrawalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => setWithdrawalOpen(false)}>
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
            value={`${availableBalance.toLocaleString("fr-GN")} GNF`}
            icon={Wallet}
            iconColor="primary"
            delay={0}
          />
          <StatCard
            title="En attente"
            value={`${pendingBalance.toLocaleString("fr-GN")} GNF`}
            icon={Clock}
            iconColor="accent"
            delay={0.1}
          />
          <StatCard
            title="Ventes ce mois"
            value={`${totalSales.toLocaleString("fr-GN")} GNF`}
            change={18}
            changeLabel="vs mois dernier"
            icon={TrendingUp}
            iconColor="primary"
            delay={0.2}
          />
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="sale">Ventes</SelectItem>
              <SelectItem value="withdrawal">Retraits</SelectItem>
              <SelectItem value="refund">Remboursements</SelectItem>
              <SelectItem value="fee">Commissions</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Historique des transactions
            </h3>
          </div>

          <div className="divide-y divide-border">
            {filteredTransactions.map((transaction) => {
              const type = typeConfig[transaction.type];
              const status = statusConfig[transaction.status];
              const TypeIcon = type.icon;
              const StatusIcon = status.icon;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        type.bgColor
                      )}
                    >
                      <TypeIcon className={cn("w-5 h-5", type.color)} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{transaction.date}</span>
                        {transaction.reference && (
                          <>
                            <span>•</span>
                            <span>{transaction.reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge
                      variant="outline"
                      className={cn("hidden sm:flex items-center gap-1", status.variant)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                    <span
                      className={cn(
                        "font-bold text-right min-w-[140px]",
                        transaction.amount > 0 ? "text-primary" : "text-foreground"
                      )}
                    >
                      {formatPrice(transaction.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </SellerLayout>
  );
}
