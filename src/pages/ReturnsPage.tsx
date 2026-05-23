import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  RotateCcw,
  PackageCheck,
  Wallet,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: MessageCircle,
    title: "1. Contactez-nous",
    desc: "Ouvrez une demande de retour depuis « Mes commandes » ou contactez le support sous 48h après réception.",
  },
  {
    icon: PackageCheck,
    title: "2. Préparez le colis",
    desc: "Replacez l'article dans son emballage d'origine avec tous les accessoires, étiquettes et la facture.",
  },
  {
    icon: RotateCcw,
    title: "3. Remise au coursier",
    desc: "Notre coursier Sarematy passe récupérer le colis à l'adresse de livraison initiale.",
  },
  {
    icon: Wallet,
    title: "4. Remboursement",
    desc: "Une fois l'article vérifié par le vendeur, le remboursement est crédité sous 3 à 7 jours ouvrés.",
  },
];

const eligible = [
  "Article défectueux ou endommagé à la livraison",
  "Produit non conforme à la description",
  "Mauvaise taille, couleur ou modèle reçu",
  "Colis incomplet (accessoires manquants)",
];

const notEligible = [
  "Produits d'hygiène, alimentaires ou périssables",
  "Articles personnalisés ou sur-mesure",
  "Sous-vêtements, maillots de bain (pour raisons d'hygiène)",
  "Articles utilisés, lavés ou abîmés par le client",
  "Demandes faites au-delà de 48h après réception",
];

const faqs = [
  {
    q: "Quel est le délai pour demander un retour ?",
    a: "Vous disposez de 48 heures après la réception du colis pour signaler un problème et ouvrir une demande de retour depuis votre espace « Mes commandes ».",
  },
  {
    q: "Le retour est-il payant ?",
    a: "Le retour est gratuit si le problème vient du vendeur (article défectueux, non conforme, erreur). Dans les autres cas, des frais de livraison retour peuvent s'appliquer.",
  },
  {
    q: "Comment suivre le statut de ma demande ?",
    a: "Rendez-vous dans « Mes commandes » > détail de la commande. Le statut de la demande de retour s'affiche en temps réel jusqu'au remboursement final.",
  },
  {
    q: "Quand serai-je remboursé ?",
    a: "Le remboursement est traité dans un délai de 3 à 7 jours ouvrés après réception et validation du colis par le vendeur. Le crédit est renvoyé sur le moyen de paiement initial (Orange Money, MTN MoMo, carte ou portefeuille Sarematy).",
  },
  {
    q: "Puis-je échanger au lieu d'être remboursé ?",
    a: "Oui, dans la limite des stocks disponibles chez le vendeur. Indiquez l'option « Échange » lors de l'ouverture de votre demande.",
  },
  {
    q: "Que faire si le vendeur refuse mon retour ?",
    a: "Notre équipe Sarematy intervient en médiation. Contactez le support via WhatsApp ou l'adresse support@sarematy.com pour ouvrir un litige.",
  },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <RotateCcw className="mr-1 h-3 w-3" />
              Retours & Remboursements
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Une politique de retour simple et transparente
            </h1>
            <p className="text-lg text-muted-foreground">
              Sur Sarematy, votre satisfaction est notre priorité. Découvrez comment retourner un article et obtenir
              votre remboursement en toute sérénité.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick info */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Clock, title: "48h", desc: "Délai pour signaler un problème" },
            { icon: PackageCheck, title: "Gratuit", desc: "Si l'erreur vient du vendeur" },
            { icon: Wallet, title: "3-7 jours", desc: "Pour recevoir votre remboursement" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-2">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Comment effectuer un retour ?</h2>
          <p className="mt-2 text-muted-foreground">4 étapes simples pour retourner un article.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Eligibility */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold">Articles éligibles au retour</h3>
              </div>
              <ul className="space-y-2">
                {eligible.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                <h3 className="text-xl font-semibold">Articles non retournables</h3>
              </div>
              <ul className="space-y-2">
                {notEligible.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Protection notice */}
      <section className="container mx-auto px-4 py-12">
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold">Protection acheteur Sarematy</h3>
              <p className="text-sm text-muted-foreground">
                Vos paiements sont sécurisés et conservés jusqu'à validation de la livraison. En cas de litige, nous
                garantissons un remboursement intégral.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/protection">En savoir plus</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">Questions fréquentes</h2>
            <p className="mt-2 text-muted-foreground">Tout ce que vous devez savoir sur les retours.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Important notice */}
      <section className="container mx-auto px-4 py-12">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="mb-1 font-semibold">Important</p>
              <p className="text-muted-foreground">
                Toute demande de retour doit être faite dans les 48 heures suivant la réception. Pensez à filmer
                l'ouverture du colis (unboxing) en cas de produit endommagé : cela facilite la prise en charge.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Besoin d'aide ?</h2>
          <p className="mt-2 text-muted-foreground">Notre équipe support est disponible 7j/7.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("https://wa.me/224620000000", "_blank")}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-semibold">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">+224 620 000 000</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("tel:+224620000000", "_blank")}>
            <CardContent className="p-6 text-center">
              <Phone className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Téléphone</h3>
              <p className="text-sm text-muted-foreground">+224 620 000 000</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("mailto:support@sarematy.com", "_blank")}>
            <CardContent className="p-6 text-center">
              <Mail className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">support@sarematy.com</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
