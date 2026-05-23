import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle, Search, MessageCircle, Phone, Mail,
  ShoppingBag, Truck, CreditCard, Store, Shield,
  User, Package, ArrowRight, BookOpen, Headphones,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  {
    icon: ShoppingBag,
    title: "Commander",
    description: "Passer une commande, panier, paiement",
    color: "bg-primary/10 text-primary",
    link: "#commander",
  },
  {
    icon: Truck,
    title: "Livraison",
    description: "Suivi, délais, zones desservies",
    color: "bg-blue-500/10 text-blue-600",
    link: "#livraison",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    description: "Orange Money, MoMo, Stripe, cash",
    color: "bg-emerald-500/10 text-emerald-600",
    link: "#paiements",
  },
  {
    icon: Store,
    title: "Vendre",
    description: "Devenir vendeur, gérer sa boutique",
    color: "bg-amber-500/10 text-amber-600",
    link: "#vendre",
  },
  {
    icon: Shield,
    title: "Sécurité",
    description: "Protection, litiges, remboursements",
    color: "bg-violet-500/10 text-violet-600",
    link: "#securite",
  },
  {
    icon: User,
    title: "Mon compte",
    description: "Profil, mot de passe, préférences",
    color: "bg-rose-500/10 text-rose-600",
    link: "#compte",
  },
];

const faqs = [
  {
    id: "commander",
    category: "Commander",
    question: "Comment passer une commande sur GuineeGo ?",
    answer: "Parcourez la marketplace, ajoutez vos articles au panier, puis cliquez sur « Commander ». Renseignez votre adresse de livraison, choisissez un mode de paiement (Orange Money, MTN MoMo, Stripe ou paiement à la livraison) et confirmez. Vous recevrez un SMS et une notification dès la confirmation.",
  },
  {
    id: "guest",
    category: "Commander",
    question: "Puis-je commander sans créer de compte ?",
    answer: "Oui. Vous pouvez commander en tant qu'invité en renseignant simplement un numéro de téléphone valide (9 chiffres commençant par 6 ou 3). Vous pourrez suivre votre commande via le lien reçu par SMS.",
  },
  {
    id: "livraison",
    category: "Livraison",
    question: "Quels sont les délais de livraison ?",
    answer: "À Conakry, la livraison s'effectue généralement sous 24 à 48h. Pour les autres communes et villes de Guinée, comptez 2 à 5 jours ouvrables selon le coursier et la zone.",
  },
  {
    id: "track",
    category: "Livraison",
    question: "Comment suivre ma commande ?",
    answer: "Rendez-vous dans « Mes commandes » ou utilisez le lien public reçu par SMS (/track/...). Vous verrez le statut en temps réel : confirmée, en préparation, prête, expédiée, en cours de livraison, livrée.",
  },
  {
    id: "delivery-fee",
    category: "Livraison",
    question: "Comment sont calculés les frais de livraison ?",
    answer: "Les frais dépendent de la commune de livraison, de la distance et du poids du colis. Le montant exact s'affiche avant la validation du paiement.",
  },
  {
    id: "paiements",
    category: "Paiements",
    question: "Quels moyens de paiement sont acceptés ?",
    answer: "Nous acceptons Orange Money, MTN Mobile Money, carte bancaire (via Stripe) et le paiement à la livraison (cash) pour certaines commandes.",
  },
  {
    id: "secure-payment",
    category: "Paiements",
    question: "Mes informations de paiement sont-elles sécurisées ?",
    answer: "Oui. Toutes les transactions sont chiffrées de bout en bout. Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs.",
  },
  {
    id: "vendre",
    category: "Vendre",
    question: "Comment devenir vendeur sur GuineeGo ?",
    answer: "Créez un compte, puis demandez le rôle « Vendeur » depuis votre profil. Une fois validé, accédez à votre tableau de bord pour ajouter produits, suivre commandes et gérer vos finances. Consultez notre guide vendeur pour les bonnes pratiques.",
  },
  {
    id: "commission",
    category: "Vendre",
    question: "Quelles sont les commissions prélevées ?",
    answer: "Vous recevez 95% du prix de vente. La commission de 5% couvre la plateforme, les paiements et le support. Pas de frais d'inscription.",
  },
  {
    id: "securite",
    category: "Sécurité",
    question: "Que faire si je ne reçois pas ma commande ?",
    answer: "Contactez le support depuis cette page ou via WhatsApp. Si votre commande n'arrive pas ou ne correspond pas, vous êtes couvert par notre garantie acheteur : remboursement traité sous 48h ouvrables après validation du litige.",
  },
  {
    id: "refund",
    category: "Sécurité",
    question: "Comment demander un remboursement ?",
    answer: "Depuis « Mes commandes », ouvrez la commande concernée et cliquez sur « Signaler un problème ». Décrivez la situation ; notre équipe traite la demande sous 48h.",
  },
  {
    id: "compte",
    category: "Mon compte",
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Vous recevrez un lien de réinitialisation par email.",
  },
  {
    id: "change-phone",
    category: "Mon compte",
    question: "Comment modifier mon numéro de téléphone ?",
    answer: "Rendez-vous dans votre profil > Paramètres > Sécurité pour mettre à jour votre numéro. Une vérification par SMS est requise.",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <Headphones className="mr-1 h-3 w-3" />
              Centre d'aide
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Comment pouvons-nous vous aider ?
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Trouvez des réponses, contactez notre équipe, ou consultez nos guides pour tirer le meilleur de GuineeGo.
            </p>

            {/* Search */}
            <div className="relative mx-auto max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question…"
                className="h-14 pl-12 text-base shadow-md"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold md:text-3xl">Parcourir par catégorie</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, i) => (
              <motion.a
                key={cat.title}
                href={cat.link}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="group h-full cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${cat.color}`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 text-lg font-semibold">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                    <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Voir <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold md:text-3xl">Questions fréquentes</h2>
            </div>

            {filteredFaqs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <HelpCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucune réponse trouvée pour « {searchQuery} ». Contactez notre support ci-dessous.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    id={faq.id}
                    className="overflow-hidden rounded-lg border bg-card px-4"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex flex-col items-start gap-1 pr-4">
                        <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-3 text-2xl font-bold md:text-3xl">Vous n'avez pas trouvé votre réponse ?</h2>
            <p className="mb-8 text-muted-foreground">Notre équipe support est disponible 7j/7 pour vous aider.</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-semibold">WhatsApp</h3>
                  <p className="mb-3 text-sm text-muted-foreground">Réponse rapide en moins de 30 min</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open("https://wa.me/224621000000", "_blank")}
                  >
                    Ouvrir WhatsApp
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Phone className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-semibold">Téléphone</h3>
                  <p className="mb-3 text-sm text-muted-foreground">Lun – Dim, 8h – 22h</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open("tel:+224621000000", "_blank")}
                  >
                    +224 621 00 00 00
                  </Button>
                </CardContent>
              </Card>

              <Card className="transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-semibold">Email</h3>
                  <p className="mb-3 text-sm text-muted-foreground">Réponse sous 24h</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open("mailto:support@guineego.com", "_blank")}
                  >
                    Nous écrire
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="border-t bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
            <Link to="/seller/guide">
              <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Guide vendeur</h3>
                    <p className="text-sm text-muted-foreground">Lancer et faire grandir votre boutique</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>

            <Link to="/protection">
              <Card className="group h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-6">
                  <Package className="h-10 w-10 text-emerald-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Protection acheteur</h3>
                    <p className="text-sm text-muted-foreground">Garanties, remboursements, médiation</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
