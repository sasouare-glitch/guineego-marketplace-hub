import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Headphones,
  Send,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  ShieldCheck,
  Truck,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const contactFaqs = [
  {
    q: "Quel est le délai de réponse du support ?",
    a: "Notre équipe répond aux demandes par email sous 24h ouvrables. Sur WhatsApp, le délai moyen est de moins de 30 minutes pendant les heures d'ouverture (8h – 22h, 7j/7).",
  },
  {
    q: "Comment signaler un problème avec une commande ?",
    a: "Rendez-vous dans « Mes commandes », ouvrez la commande concernée et cliquez sur « Signaler un problème ». Vous pouvez aussi nous contacter directement via WhatsApp ou ce formulaire en précisant votre numéro de commande.",
  },
  {
    q: "Puis-je modifier ou annuler ma commande ?",
    a: "Une commande peut être modifiée ou annulée tant qu'elle n'a pas été confirmée par le vendeur. Contactez-nous rapidement avec votre numéro de commande pour que nous interessions auprès du vendeur.",
  },
  {
    q: "Comment devenir vendeur ou coursier sur Sarematy ?",
    a: "Créez un compte, puis depuis votre profil demandez le rôle « Vendeur » ou « Coursier ». Notre équipe examine chaque demande sous 48h. Vous pouvez aussi consulter notre guide vendeur via le lien ci-dessous.",
  },
  {
    q: "Où puis-je consulter les conditions générales ?",
    a: "Les CGU, CGV et politique de confidentialité sont accessibles depuis le pied de page de chaque page. Nous vous invitons à les consulter régulièrement car elles peuvent évoluer.",
  },
  {
    q: "Comment réinitialiser mon mot de passe ?",
    a: "Sur la page de connexion, cliquez sur « Mot de passe oublié ». Un lien de réinitialisation vous sera envoyé par email. Si vous ne recevez rien, vérifiez vos spams ou contactez-nous.",
  },
];

const contactMethods = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Réponse rapide en moins de 30 min",
    value: "+224 621 00 00 00",
    action: "Ouvrir WhatsApp",
    href: "https://wa.me/224621000000",
    color: "bg-green-500/10 text-green-600",
  },
  {
    icon: Phone,
    title: "Téléphone",
    description: "Lun – Dim, 8h – 22h",
    value: "+224 621 00 00 00",
    action: "Appeler",
    href: "tel:+224621000000",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Réponse sous 24h ouvrables",
    value: "support@sarematy.com",
    action: "Nous écrire",
    href: "mailto:support@sarematy.com",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: MapPin,
    title: "Adresse",
    description: "Siège social & support",
    value: "Kaloum, Conakry, Guinée",
    action: "Voir sur la carte",
    href: "https://www.google.com/maps/search/?api=1&query=Kaloum,Conakry,Guinée",
    color: "bg-amber-500/10 text-amber-600",
  },
];

const subjects = [
  { value: "order", label: "Problème de commande" },
  { value: "delivery", label: "Livraison & Suivi" },
  { value: "return", label: "Retour & Remboursement" },
  { value: "seller", label: "Devenir vendeur" },
  { value: "courier", label: "Devenir coursier" },
  { value: "account", label: "Mon compte & Sécurité" },
  { value: "payment", label: "Paiement & Facturation" },
  { value: "bug", label: "Bug technique" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Autre" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Le nom est requis.";
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Adresse email invalide.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis.";
    } else if (!/^\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Numéro invalide (9 chiffres requis).";
    }
    if (!formData.subject) newErrors.subject = "Veuillez choisir un sujet.";
    if (!formData.message.trim()) newErrors.message = "Le message est requis.";
    else if (formData.message.trim().length < 10)
      newErrors.message = "Le message doit contenir au moins 10 caractères.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // For now, open email client with pre-filled content
    const body = encodeURIComponent(
      `Nom : ${formData.name}\nTéléphone : ${formData.phone}\nSujet : ${subjects.find((s) => s.value === formData.subject)?.label || formData.subject}\n\nMessage :\n${formData.message}`
    );
    window.open(`mailto:support@sarematy.com?subject=[Contact Sarematy] ${formData.subject}&body=${body}`, "_blank");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

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
              Contact
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Restons en contact
            </h1>
            <p className="text-lg text-muted-foreground">
              Une question, un problème ou une suggestion ? Notre équipe est là pour vous aider,
              7 jours sur 7.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                onClick={() => window.open(method.href, "_blank")}
              >
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${method.color}`}>
                    <method.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-1 font-semibold">{method.title}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  <p className="mt-2 text-sm font-medium">{method.value}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(method.href, "_blank");
                    }}
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form + Hours */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <Card>
              <CardContent className="p-6 md:p-8">
                <h2 className="mb-6 text-2xl font-bold">Envoyez-nous un message</h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <div className="mb-4 rounded-full bg-green-500/10 p-4">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">Message envoyé !</h3>
                    <p className="text-muted-foreground">
                      Votre client email a été ouvert avec le message pré-rempli. Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="621000000"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Sujet *</Label>
                        <select
                          id="subject"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({ ...formData, subject: e.target.value })
                          }
                          className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            errors.subject ? "border-destructive" : "border-input"
                          }`}
                        >
                          <option value="">Choisir un sujet…</option>
                          {subjects.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {errors.subject && (
                          <p className="text-sm text-destructive">{errors.subject}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre demande en détail…"
                        rows={5}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        className={errors.message ? "border-destructive" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer le message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 lg:col-span-2"
          >
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Heures d'ouverture</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Lundi – Vendredi</span>
                    <span className="font-medium">8h – 22h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Samedi – Dimanche</span>
                    <span className="font-medium">9h – 20h</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Jours fériés</span>
                    <span className="font-medium">10h – 16h</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Protection acheteur</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Vos paiements sont sécurisés et conservés jusqu'à validation de la livraison.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/protection">En savoir plus</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold">Raccourcis rapides</h3>
                <div className="space-y-2">
                  <Link
                    to="/help"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Centre d'aide</p>
                      <p className="text-xs text-muted-foreground">FAQ et guides</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/returns"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Retours & Remboursements</p>
                      <p className="text-xs text-muted-foreground">Politique et démarches</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/sell/start"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Devenir vendeur</p>
                      <p className="text-xs text-muted-foreground">Lancer votre boutique</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold">Questions fréquentes</h2>
              <p className="mt-2 text-muted-foreground">
                Réponses rapides avant de nous écrire.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {contactFaqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="overflow-hidden rounded-lg border bg-card px-4"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
