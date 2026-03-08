import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Lock, Eye, AlertTriangle, CheckCircle2,
  ArrowRight, ShieldCheck, RefreshCw, HeadphonesIcon,
  Scale, UserCheck, Fingerprint, BadgeCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const protections = [
  {
    icon: ShieldCheck,
    title: "Garantie acheteur",
    description: "Chaque achat est couvert par notre garantie. Si votre commande n'arrive pas ou ne correspond pas, vous êtes remboursé.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: RefreshCw,
    title: "Remboursement sous 48h",
    description: "En cas de litige confirmé, votre remboursement est traité automatiquement sous 48 heures ouvrables.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Lock,
    title: "Paiements sécurisés",
    description: "Toutes les transactions sont chiffrées de bout en bout. Vos données bancaires ne sont jamais stockées.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Eye,
    title: "Vendeurs vérifiés",
    description: "Chaque vendeur est vérifié et noté par la communauté. Consultez les avis avant d'acheter.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: HeadphonesIcon,
    title: "Support 7j/7",
    description: "Notre équipe de support est disponible tous les jours pour résoudre vos problèmes rapidement.",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: Scale,
    title: "Médiation équitable",
    description: "En cas de désaccord entre acheteur et vendeur, notre équipe intervient comme médiateur impartial.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

const securityLayers = [
  {
    icon: Fingerprint,
    title: "Authentification renforcée",
    description: "Vérification par code USSD, email et notifications push pour chaque transaction sensible.",
  },
  {
    icon: AlertTriangle,
    title: "Détection anti-fraude",
    description: "Algorithmes intelligents qui détectent et bloquent les activités suspectes en temps réel.",
  },
  {
    icon: UserCheck,
    title: "Vérification d'identité",
    description: "Les vendeurs et coursiers sont vérifiés avec pièce d'identité et numéro de téléphone.",
  },
  {
    icon: BadgeCheck,
    title: "Conformité réglementaire",
    description: "Nous respectons les normes de protection des données et de sécurité financière en Guinée.",
  },
];

const faqItems = [
  {
    question: "Comment signaler un problème avec ma commande ?",
    answer: "Rendez-vous dans \"Mes commandes\", sélectionnez la commande concernée et cliquez sur \"Signaler un problème\". Notre équipe vous répondra sous 24h.",
  },
  {
    question: "Sous quel délai suis-je remboursé ?",
    answer: "Les remboursements sont traités sous 48 heures ouvrables après validation du litige. Le montant est crédité sur votre mode de paiement d'origine ou votre Wallet GuineeGo.",
  },
  {
    question: "Comment savoir si un vendeur est fiable ?",
    answer: "Chaque vendeur a un badge de vérification, une note moyenne et des avis clients. Les vendeurs avec le badge \"Vérifié\" ont passé notre processus de validation.",
  },
  {
    question: "Mes données personnelles sont-elles protégées ?",
    answer: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations avec des tiers sans votre consentement.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function ProtectionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-primary/5" />
          <div className="container-tight relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Protection acheteur garantie
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                Achetez en toute <span className="text-primary">confiance</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Chez GuineeGo, votre sécurité est notre priorité. Chaque transaction est protégée, 
                chaque vendeur est vérifié, et notre équipe veille sur vos achats 7 jours sur 7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/marketplace">
                    Acheter en sécurité
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Protections Grid */}
        <section className="py-16 bg-muted/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Vos garanties
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                6 niveaux de protection pour des achats sereins sur GuineeGo.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {protections.map((item, i) => (
                <motion.div
                  key={item.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Layers */}
        <section className="py-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Sécurité multicouche
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Plusieurs niveaux de sécurité protègent chaque interaction sur la plateforme.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {securityLayers.map((layer, i) => (
                <motion.div
                  key={layer.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full border-border/50">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <layer.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{layer.title}</h3>
                      <p className="text-sm text-muted-foreground">{layer.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Questions fréquentes
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((faq, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-primary rounded-3xl p-10 md:p-16 text-center"
            >
              <Shield className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
                Protégé à chaque étape
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                De la commande à la livraison, votre satisfaction est garantie. Rejoignez des milliers d'acheteurs qui font confiance à GuineeGo.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/marketplace">
                  Explorer la marketplace
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
