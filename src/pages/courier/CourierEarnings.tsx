import { CourierLayout } from "@/components/courier/CourierLayout";
import { EarningsChart } from "@/components/courier/EarningsChart";
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
  Smartphone
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface Transaction {
  id: string;
  type: "earning" | "withdrawal" | "bonus";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending";
}

const transactions: Transaction[] = [
  { id: "1", type: "earning", description: "Mission #GG-0892", amount: 25000, date: "Aujourd'hui, 14:30", status: "completed" },
  { id: "2", type: "earning", description: "Mission #GG-0891", amount: 15000, date: "Aujourd'hui, 11:45", status: "completed" },
  { id: "3", type: "bonus", description: "Bonus performance", amount: 50000, date: "Hier, 18:00", status: "completed" },
  { id: "4", type: "withdrawal", description: "Retrait Orange Money", amount: -200000, date: "28 Jan 2024", status: "completed" },
  { id: "5", type: "earning", description: "Mission #GG-0890", amount: 45000, date: "28 Jan 2024", status: "completed" },
  { id: "6", type: "earning", description: "Mission #GG-0889", amount: 18000, date: "27 Jan 2024", status: "completed" },
  { id: "7", type: "withdrawal", description: "Retrait MTN Money", amount: -150000, date: "25 Jan 2024", status: "pending" },
];

const CourierEarnings = () => {
  const [period, setPeriod] = useState("week");

  const totalEarnings = transactions
    .filter(t => t.type !== "withdrawal" && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawals = transactions
    .filter(t => t.type === "withdrawal" && t.status === "pending")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <CourierLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Mes Revenus</h1>
            <p className="text-muted-foreground">Suivez vos gains et retraits</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
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

        {/* Balance Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Wallet Balance */}
          <Card className="bg-gradient-to-br from-guinea-green to-guinea-green/80 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm">Solde disponible</p>
                  <p className="text-3xl font-display font-bold mt-1">
                    485 000 GNF
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

          {/* Total Earnings */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Gains totaux</p>
                  <p className="text-2xl font-display font-bold mt-1">
                    {totalEarnings.toLocaleString('fr-GN')} GNF
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-guinea-green text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>+18% ce mois</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-guinea-green/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6 text-guinea-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">En attente</p>
                  <p className="text-2xl font-display font-bold mt-1">
                    {pendingWithdrawals.toLocaleString('fr-GN')} GNF
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    1 retrait en cours
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
        <EarningsChart />

        {/* Transactions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-lg">Historique des transactions</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === "withdrawal"
                          ? "bg-guinea-red/10"
                          : tx.type === "bonus"
                          ? "bg-guinea-yellow/10"
                          : "bg-guinea-green/10"
                      }`}
                    >
                      {tx.type === "withdrawal" ? (
                        <ArrowUpRight className="w-5 h-5 text-guinea-red" />
                      ) : (
                        <ArrowDownLeft className={`w-5 h-5 ${tx.type === "bonus" ? "text-guinea-yellow" : "text-guinea-green"}`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.amount < 0 ? "text-guinea-red" : "text-guinea-green"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString('fr-GN')} GNF
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
          </CardContent>
        </Card>
      </div>
    </CourierLayout>
  );
};

export default CourierEarnings;
