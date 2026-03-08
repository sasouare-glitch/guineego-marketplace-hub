import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  BarChart3,
  PieChart,
  DollarSign,
  Globe,
  Users,
  CheckCircle2,
  ChevronRight,
  Landmark,
  Leaf,
  ShoppingBag,
  Building2,
  Zap,
  Star,
  Lock,
  FileText,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const stats = [
  { value: "2.5 Mds GNF", label: "Investissements gérés" },
  { value: "18%", label: "Rendement moyen annuel" },
  { value: "150+", label: "Investisseurs actifs" },
  { value: "95%", label: "Taux de satisfaction" },
];

const sectors = [
  {
    icon: ShoppingBag,
    name: "E-commerce",
    roi: "15-22%",
    risk: "Modéré",
    description: "Financez des boutiques en ligne à forte croissance sur le marché guinéen.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Building2,
    name: "Immobilier",
    roi: "12-18%",
    risk: "Faible",
    description: "Investissez dans des projets immobiliers à Conakry et dans les grandes villes.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Leaf,
    name: "Agriculture",
    roi: "20-30%",
    risk: "Élevé",
    description: "Soutenez l'agriculture locale : cacao, café, anacarde et cultures vivrières.",
    color: "bg-guinea-green/10 text-guinea-green",
  },
  {
    icon: Globe,
    name: "Logistique",
    roi: "14-20%",
    risk: "Modéré",
    description: "Participez au développement du réseau de livraison last-mile en Guinée.",
    color: "bg-destructive/10 text-destructive",
  },
];

const advantages = [
  {
    icon: TrendingUp,
    title: "Rendements compétitifs",
    description: "Des retours sur investissement parmi les plus attractifs d'Afrique de l'Ouest, à partir de 12% annuel.",
  },
  {
    icon: Shield,
    title: "Capital sécurisé",
    description: "Vos fonds sont protégés par des garanties contractuelles et un système d'escrow certifié.",
  },
  {
    icon: BarChart3,
    title: "Dashboard en temps réel",
    description: "Suivez vos placements, dividendes et la performance de votre portfolio 24h/24.",
  },
  {
    icon: PieChart,
    title: "Diversification",
    description: "Répartissez vos investissements sur plusieurs secteurs pour minimiser les risques.",
  },
  {
    icon: FileText,
    title: "Transparence totale",
    description: "Business plans détaillés, rapports trimestriels et accès à toute la documentation.",
  },
  {
    icon: Users,
    title: "Accompagnement dédié",
    description: "Un conseiller personnel pour vous guider dans vos choix d'investissement.",
  },
];

const steps = [
  {
    step: "01",
    title: "Créez votre compte",
    description: "Inscription gratuite en 3 minutes avec vérification d'identité.",
  },
  {
    step: "02",
    title: "Explorez les opportunités",
    description: "Consultez les projets disponibles avec analyses ROI et niveaux de risque.",
  },
  {
    step: "03",
    title: "Investissez",
    description: "Choisissez un montant à partir de 500 000 GNF et confirmez votre placement.",
  },
  {
    step: "04",
    title: "Percevez vos gains",
    description: "Recevez vos dividendes directement sur votre wallet ou compte bancaire.",
  },
];

const InvestPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85 text-primary-foreground py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge className="bg-accent text-accent-foreground mb-6 text-sm px-4 py-1.5 font-semibold">
                💰 Plateforme d'investissement N°1 en Guinée
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              Investissez dans{" "}
              <span className="text-accent">l'avenir</span> de la Guinée
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl opacity-80 mb-8 max-w-2xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              Accédez à des opportunités d'investissement exclusives avec des rendements
              de 12 à 30% par an. Votre capital, nos garanties.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              <Button asChild size="xl" variant="accent" className="text-lg">
                <Link to="/register">
                  Commencer à investir <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="text-lg">
                <a href="#secteurs">Voir les opportunités</a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <p className="text-3xl md:text-4xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pourquoi investir avec GuineeGo ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Une plateforme conçue pour maximiser vos rendements en toute sécurité
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((a, i) => (
              <motion.div
                key={a.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50 hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <a.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{a.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{a.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secteurs */}
      <section id="secteurs" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Secteurs d'investissement
            </h2>
            <p className="text-muted-foreground text-lg">
              Des opportunités diversifiées pour tous les profils d'investisseurs
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sectors.map((s, i) => (
              <motion.div
                key={s.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full hover:shadow-lg transition-all border-border/50 hover:border-primary/30">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-4`}>
                      <s.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{s.description}</p>
                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">ROI</p>
                        <p className="font-bold text-primary text-sm">{s.roi}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Risque</p>
                        <Badge
                          variant={s.risk === "Faible" ? "secondary" : s.risk === "Modéré" ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {s.risk}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment investir ?
            </h2>
            <p className="text-muted-foreground text-lg">Un processus simple et transparent</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="relative text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="text-center mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Votre capital est protégé
              </h2>
              <p className="text-muted-foreground text-lg">
                Nous mettons en place les meilleures pratiques pour sécuriser vos investissements
              </p>
            </motion.div>
            <motion.div
              className="grid sm:grid-cols-2 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              {[
                { icon: Lock, text: "Fonds sécurisés en compte séquestre (escrow)" },
                { icon: FileText, text: "Contrats juridiques signés électroniquement" },
                { icon: Shield, text: "Due diligence approfondie sur chaque projet" },
                { icon: BarChart3, text: "Rapports financiers trimestriels détaillés" },
                { icon: Landmark, text: "Partenariats avec des banques locales agréées" },
                { icon: Users, text: "Comité d'investissement indépendant" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/50">
                  <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Nos investisseurs témoignent</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Abdoulaye K.",
                role: "Investisseur depuis 2024",
                quote: "J'ai diversifié mon portfolio entre e-commerce et agriculture. Les rendements dépassent mes attentes et le suivi est impeccable.",
              },
              {
                name: "Fatoumata C.",
                role: "Investisseuse depuis 2023",
                quote: "La transparence de GuineeGo m'a convaincue. Je reçois des rapports détaillés chaque trimestre et mon conseiller est toujours disponible.",
              },
              {
                name: "Mohamed D.",
                role: "Investisseur depuis 2024",
                quote: "Avec 2 millions GNF investis, j'ai déjà perçu 3 dividendes. La plateforme est sérieuse et professionnelle.",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-border/50">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic mb-4">"{t.quote}"</p>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <DollarSign className="h-12 w-12 mx-auto mb-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Faites fructifier votre capital
            </h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
              Rejoignez +150 investisseurs qui font confiance à GuineeGo.
              Investissement minimum : 500 000 GNF.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" variant="accent" className="text-lg">
                <Link to="/register">
                  Ouvrir mon compte investisseur <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="text-lg">
                <Link to="/protection">Nos garanties</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InvestPage;
