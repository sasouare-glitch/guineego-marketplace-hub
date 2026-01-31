import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/investor/InvestorLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Calendar,
  Building,
  MapPin,
  Download,
  MessageSquare,
  Bell,
  Wallet,
  PiggyBank
} from "lucide-react";
import { cn } from "@/lib/utils";

const investmentData = {
  id: "1",
  title: "Expansion boutique mode Conakry",
  category: "E-commerce",
  company: "ModaAfrik SARL",
  location: "Conakry, Guinée",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
  investedAmount: 5000000,
  currentValue: 5750000,
  returnAmount: 750000,
  returnPercentage: 15,
  isPositive: true,
  startDate: "15 Jan 2024",
  endDate: "15 Juil 2024",
  nextPayout: "15 Mar 2024",
  progress: 85,
  status: "active" as const,
  expectedReturn: "18%",
  actualReturn: "15%",
  payoutFrequency: "Mensuel",
  totalPayouts: 6,
  receivedPayouts: 5,
  transactions: [
    { date: "15 Fév 2024", type: "Rendement", amount: 150000, status: "completed" },
    { date: "15 Mar 2024", type: "Rendement", amount: 150000, status: "completed" },
    { date: "15 Avr 2024", type: "Rendement", amount: 150000, status: "completed" },
    { date: "15 Mai 2024", type: "Rendement", amount: 150000, status: "completed" },
    { date: "15 Juin 2024", type: "Rendement", amount: 150000, status: "completed" },
    { date: "15 Juil 2024", type: "Capital + Rendement", amount: 5150000, status: "pending" }
  ]
};

const performanceData = [
  { date: "Jan", value: 5000000, expected: 5000000 },
  { date: "Fév", value: 5150000, expected: 5075000 },
  { date: "Mar", value: 5300000, expected: 5150000 },
  { date: "Avr", value: 5450000, expected: 5225000 },
  { date: "Mai", value: 5550000, expected: 5300000 },
  { date: "Juin", value: 5650000, expected: 5375000 },
  { date: "Juil", value: 5750000, expected: 5450000 },
];

export default function InvestmentDetail() {
  const { id } = useParams();
  const data = investmentData;

  const statusConfig = {
    active: { label: "En cours", color: "bg-guinea-green/10 text-guinea-green border-guinea-green/20" },
    completed: { label: "Terminé", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    pending: { label: "En attente", color: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20" }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  return (
    <InvestorLayout 
      title="Détails du placement" 
      subtitle="Suivi de votre investissement"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Link 
          to="/investor/investments" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à mes placements
        </Link>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="relative h-48">
            <img 
              src={data.image} 
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{data.category}</Badge>
                <Badge className={statusConfig[data.status].color}>
                  {statusConfig[data.status].label}
                </Badge>
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                {data.title}
              </h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {data.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {data.location}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            <div className="p-5 text-center">
              <Wallet className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{data.investedAmount.toLocaleString()} GNF</p>
              <p className="text-xs text-muted-foreground">Capital investi</p>
            </div>
            <div className="p-5 text-center">
              <PiggyBank className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{data.currentValue.toLocaleString()} GNF</p>
              <p className="text-xs text-muted-foreground">Valeur actuelle</p>
            </div>
            <div className="p-5 text-center">
              {data.isPositive ? (
                <TrendingUp className="w-5 h-5 text-guinea-green mx-auto mb-2" />
              ) : (
                <TrendingDown className="w-5 h-5 text-guinea-red mx-auto mb-2" />
              )}
              <p className={cn(
                "text-lg font-bold",
                data.isPositive ? "text-guinea-green" : "text-guinea-red"
              )}>
                {data.isPositive ? "+" : ""}{data.returnAmount.toLocaleString()} GNF
              </p>
              <p className="text-xs text-muted-foreground">Rendement ({data.returnPercentage}%)</p>
            </div>
            <div className="p-5 text-center">
              <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{data.progress}%</p>
              <p className="text-xs text-muted-foreground">Progression</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Performance</h3>
                  <p className="text-sm text-muted-foreground">Évolution vs prévision</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-guinea-green" />
                    <span className="text-muted-foreground">Réel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground">Prévu</span>
                  </div>
                </div>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={formatValue}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} GNF`]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expected" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={0} 
                      name="Prévu"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(152, 81%, 39%)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorActual)" 
                      name="Réel"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Historique des versements</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
              <div className="space-y-3">
                {data.transactions.map((tx, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 bg-secondary rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        tx.status === "completed" ? "bg-guinea-green/10" : "bg-guinea-yellow/10"
                      )}>
                        {tx.status === "completed" ? (
                          <TrendingUp className="w-5 h-5 text-guinea-green" />
                        ) : (
                          <Clock className="w-5 h-5 text-guinea-yellow" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-guinea-green">+{tx.amount.toLocaleString()} GNF</p>
                      <Badge 
                        variant="outline" 
                        className={tx.status === "completed" 
                          ? "bg-guinea-green/10 text-guinea-green border-guinea-green/20" 
                          : "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20"
                        }
                      >
                        {tx.status === "completed" ? "Versé" : "À venir"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <h3 className="font-display font-semibold text-foreground mb-4">Informations clés</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de début</span>
                  <span className="font-medium text-foreground">{data.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de fin</span>
                  <span className="font-medium text-foreground">{data.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rendement prévu</span>
                  <span className="font-medium text-guinea-green">{data.expectedReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rendement actuel</span>
                  <span className="font-medium text-guinea-green">{data.actualReturn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fréquence</span>
                  <span className="font-medium text-foreground">{data.payoutFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versements</span>
                  <span className="font-medium text-foreground">{data.receivedPayouts}/{data.totalPayouts}</span>
                </div>
              </div>
            </motion.div>

            {/* Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <h3 className="font-display font-semibold text-foreground mb-4">Progression</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Durée écoulée</span>
                  <span className="font-medium text-foreground">{data.progress}%</span>
                </div>
                <Progress value={data.progress} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Prochain versement: {data.nextPayout}</span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <Button className="w-full" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contacter le porteur
              </Button>
              <Button className="w-full" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Gérer les alertes
              </Button>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Télécharger le contrat
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </InvestorLayout>
  );
}
