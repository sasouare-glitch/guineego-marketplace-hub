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
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Users, 
  Shield, 
  MapPin,
  Building,
  Calendar,
  FileText,
  Download,
  Share2,
  Heart,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const opportunityData = {
  id: "1",
  title: "Marketplace mode africaine - Expansion régionale",
  category: "E-commerce",
  description: "Investissez dans l'expansion de la première marketplace de mode africaine vers le Sénégal, la Côte d'Ivoire et le Mali. Ce projet vise à créer un réseau de distribution régional pour les créateurs de mode africains.",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
  returnRate: "18%",
  duration: "12 mois",
  minInvestment: "1 000 000 GNF",
  maxInvestment: "10 000 000 GNF",
  riskLevel: "medium" as const,
  funded: 72,
  target: "50 000 000 GNF",
  raised: "36 000 000 GNF",
  investors: 45,
  daysLeft: 23,
  location: "Conakry, Guinée",
  company: "AfriMode SARL",
  startDate: "Mars 2024",
  endDate: "Mars 2025",
  highlights: [
    "Croissance de 200% des ventes en 2023",
    "Plus de 150 créateurs partenaires",
    "Présence dans 5 pays africains",
    "Équipe expérimentée de 25 personnes"
  ],
  documents: [
    { name: "Business Plan 2024", type: "PDF" },
    { name: "États financiers 2023", type: "PDF" },
    { name: "Présentation investisseurs", type: "PPTX" },
    { name: "Contrat d'investissement", type: "PDF" }
  ]
};

const projectionData = [
  { month: "Mois 1", value: 1000000, projected: 1000000 },
  { month: "Mois 3", value: 1015000, projected: 1045000 },
  { month: "Mois 6", value: 1045000, projected: 1090000 },
  { month: "Mois 9", value: 1090000, projected: 1135000 },
  { month: "Mois 12", value: 1180000, projected: 1180000 },
];

const revenueData = [
  { quarter: "T1", revenue: 850000000, profit: 85000000 },
  { quarter: "T2", revenue: 1200000000, profit: 144000000 },
  { quarter: "T3", revenue: 1800000000, profit: 234000000 },
  { quarter: "T4", revenue: 2500000000, profit: 375000000 },
];

export default function OpportunityDetail() {
  const { id } = useParams();
  const data = opportunityData;

  const riskConfig = {
    low: { label: "Risque faible", color: "bg-guinea-green/10 text-guinea-green border-guinea-green/20" },
    medium: { label: "Risque modéré", color: "bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/20" },
    high: { label: "Risque élevé", color: "bg-guinea-red/10 text-guinea-red border-guinea-red/20" }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return value.toLocaleString();
  };

  return (
    <InvestorLayout 
      title="Détails de l'opportunité" 
      subtitle="Analysez avant d'investir"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Link 
          to="/investor/opportunities" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux opportunités
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <img 
            src={data.image} 
            alt={data.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{data.category}</Badge>
              <Badge className={riskConfig[data.riskLevel].color}>
                <Shield className="w-3 h-3 mr-1" />
                {riskConfig[data.riskLevel].label}
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
              {data.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <TrendingUp className="w-5 h-5 text-guinea-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-guinea-green">{data.returnRate}</p>
                <p className="text-xs text-muted-foreground">Rendement prévu</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{data.duration}</p>
                <p className="text-xs text-muted-foreground">Durée</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Users className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{data.investors}</p>
                <p className="text-xs text-muted-foreground">Investisseurs</p>
              </div>
              <div className="bg-card rounded-xl p-4 border border-border text-center">
                <Calendar className="w-5 h-5 text-guinea-red mx-auto mb-2" />
                <p className="text-2xl font-bold text-guinea-red">{data.daysLeft}j</p>
                <p className="text-xs text-muted-foreground">Restants</p>
              </div>
            </motion.div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="financials">Financiers</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="updates">Actualités</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground mb-4">Description du projet</h3>
                  <p className="text-muted-foreground leading-relaxed">{data.description}</p>
                </motion.div>

                {/* Highlights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground mb-4">Points forts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-guinea-green flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Projection Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground mb-4">Projection de rendement</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour un investissement de 1 000 000 GNF
                  </p>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <defs>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(152, 81%, 39%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="month" 
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
                          formatter={(value: number) => [`${value.toLocaleString()} GNF`, 'Valeur']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="projected" 
                          stroke="hsl(152, 81%, 39%)" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorProjected)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="financials" className="mt-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground mb-4">Revenus et bénéfices</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="quarter" 
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
                        <Bar dataKey="revenue" fill="hsl(152, 81%, 39%)" radius={[8, 8, 0, 0]} name="Revenus" />
                        <Bar dataKey="profit" fill="hsl(38, 96%, 51%)" radius={[8, 8, 0, 0]} name="Bénéfices" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <h3 className="font-display font-semibold text-foreground mb-4">Documents disponibles</h3>
                  <div className="space-y-3">
                    {data.documents.map((doc, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.type}</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="updates" className="mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-6 border border-border text-center py-12"
                >
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground mb-2">Aucune actualité</h3>
                  <p className="text-muted-foreground">Les mises à jour du projet apparaîtront ici</p>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Investment Card */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border sticky top-6"
            >
              {/* Funding Progress */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-2xl font-bold text-foreground">{data.raised}</span>
                  <span className="text-muted-foreground">/ {data.target}</span>
                </div>
                <Progress value={data.funded} className="h-3 mb-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-guinea-green font-medium">{data.funded}% financé</span>
                  <span className="text-muted-foreground">{data.daysLeft} jours restants</span>
                </div>
              </div>

              {/* Investment Range */}
              <div className="bg-secondary rounded-xl p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Minimum</span>
                  <span className="font-medium text-foreground">{data.minInvestment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Maximum</span>
                  <span className="font-medium text-foreground">{data.maxInvestment}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Début:</span>
                  <span className="font-medium text-foreground">{data.startDate}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fin:</span>
                  <span className="font-medium text-foreground">{data.endDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  Investir maintenant
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </InvestorLayout>
  );
}
