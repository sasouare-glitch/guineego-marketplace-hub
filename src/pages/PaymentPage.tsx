import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone, Shield, Wallet, Banknote, ArrowRight,
  CheckCircle2, Clock, Lock, Zap, CreditCard, Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const paymentMethods = [
  {
    icon: Smartphone,
    name: "Orange Money",
    description: "Payez instantanément via votre compte Orange Money. Confirmez par code USSD et recevez un reçu SMS.",
    color: "bg-orange-500/10 text-orange-600",
    badge: "Populaire",
    badgeVariant: "default" as const,
  },
  {
    icon: Smartphone,
    name: "MTN Money",
    description: "Utilisez votre portefeuille MTN Mobile Money pour des paiements rapides et sécurisés.",
    color: "bg-yellow-500/10 text-yellow-600",
    badge: null,
    badgeVariant: "secondary" as const,
  },
  {
    icon: Wallet,
    name: "Wallet GuineeGo",
    description: "Rechargez votre portefeuille interne et payez en un clic. Idéal pour les achats fréquents.",
    color: "bg-primary/10 text-primary",
    badge: "Rapide",
    badgeVariant: "secondary" as const,
  },
  {
    icon: Banknote,
    name: "Cash à la livraison",
    description: "Payez en espèces directement au coursier lors de la réception de votre commande.",
    color: "bg-green-500/10 text-green-600",
    badge: null,
    badgeVariant: "secondary" as const,
  },
  {
    icon: CreditCard,
    name: "Visa / Mastercard",
    description: "Payez par carte bancaire via Stripe. Accepte Visa, Mastercard et cartes internationales. Confirmation instantanée.",
    color: "bg-blue-500/10 text-blue-600",
    badge: "International",
    badgeVariant: "secondary" as const,
  },
];

const securityFeatures = [
  {
    icon: Lock,
    title: "Chiffrement SSL",
    description: "Toutes les transactions sont protégées par un chiffrement de bout en bout.",
  },
  {
    icon: Shield,
    title: "Anti-fraude",
    description: "Système de détection des transactions suspectes en temps réel.",
  },
  {
    icon: CheckCircle2,
    title: "Vérification USSD",
    description: "Confirmation sécurisée via code USSD pour les paiements mobile money.",
  },
  {
    icon: Clock,
    title: "Remboursement garanti",
    description: "Remboursement sous 48h en cas de problème avec votre commande.",
  },
];

const steps = [
  { step: "01", title: "Choisissez", description: "Sélectionnez votre mode de paiement préféré" },
  { step: "02", title: "Confirmez", description: "Validez la transaction via USSD ou mot de passe" },
  { step: "03", title: "Recevez", description: "Confirmation instantanée par SMS et notification" },
  { step: "04", title: "Profitez", description: "Votre commande est en route vers vous" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="container-tight relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Paiements 100% sécurisés
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                Payez comme vous <span className="text-primary">voulez</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Orange Money, MTN Money, Cash ou Wallet — choisissez le mode de paiement qui vous convient. 
                Transactions rapides, sécurisées et sans frais cachés.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/marketplace">
                    Commencer vos achats
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/sell/start">
                    <Globe className="w-5 h-5 mr-2" />
                    Devenir vendeur
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-16 bg-muted/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Modes de paiement acceptés
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Nous offrons plusieurs options adaptées aux habitudes de paiement en Guinée.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method, i) => (
                <motion.div
                  key={method.name}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${method.color}`}>
                          <method.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{method.name}</h3>
                            {method.badge && (
                              <Badge variant={method.badgeVariant} className="text-xs">
                                {method.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Comment ça marche ?
              </h2>
              <p className="text-muted-foreground">Un processus simple en 4 étapes</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-primary">{s.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-16 bg-muted/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                Sécurité maximale
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Vos transactions sont protégées à chaque étape grâce à nos systèmes de sécurité avancés.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {securityFeatures.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <Card className="text-center h-full border-border/50">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <feat.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                      <p className="text-sm text-muted-foreground">{feat.description}</p>
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
              <Zap className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
              <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
                Prêt à commander ?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto">
                Explorez notre marketplace et payez en toute simplicité avec le mode de paiement de votre choix.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/marketplace">
                  Découvrir la marketplace
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
