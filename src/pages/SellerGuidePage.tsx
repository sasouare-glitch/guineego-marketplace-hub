import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Store,
  Package,
  Camera,
  DollarSign,
  Truck,
  MessageCircle,
  Star,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/hooks/useTranslation";

export default function SellerGuidePage() {
  const { t } = useTranslation();
  const g = t.pages.sellerGuide;

  const steps = [
    { icon: UserPlus, title: g.step1Title, description: g.step1Desc },
    { icon: Store, title: g.step2Title, description: g.step2Desc },
    { icon: Package, title: g.step3Title, description: g.step3Desc },
    { icon: Camera, title: g.step4Title, description: g.step4Desc },
    { icon: DollarSign, title: g.step5Title, description: g.step5Desc },
    { icon: Truck, title: g.step6Title, description: g.step6Desc },
  ];

  const bestPractices = [
    { icon: Camera, title: g.bp1Title, description: g.bp1Desc },
    { icon: MessageCircle, title: g.bp2Title, description: g.bp2Desc },
    { icon: Star, title: g.bp3Title, description: g.bp3Desc },
    { icon: TrendingUp, title: g.bp4Title, description: g.bp4Desc },
    { icon: ShieldCheck, title: g.bp5Title, description: g.bp5Desc },
    { icon: Wallet, title: g.bp6Title, description: g.bp6Desc },
  ];

  const rules = [g.rule1, g.rule2, g.rule3, g.rule4, g.rule5];

  const faqs = [
    { q: g.faq1Q, a: g.faq1A },
    { q: g.faq2Q, a: g.faq2A },
    { q: g.faq3Q, a: g.faq3A },
    { q: g.faq4Q, a: g.faq4A },
    { q: g.faq5Q, a: g.faq5A },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-32">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Badge variant="secondary" className="mb-4">
                <BookOpen className="mr-1 h-3 w-3" />
                {g.badge}
              </Badge>
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                {g.heroTitle1}{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Sarematy
                </span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                {g.heroDescription}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/sell/start">
                    {g.ctaStart}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/seller/subscription">{g.ctaPricing}</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">{g.stepsTitle}</h2>
              <p className="text-muted-foreground">{g.stepsSubtitle}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="h-full transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <step.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Best practices */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <Badge variant="secondary" className="mb-3">
                <Zap className="mr-1 h-3 w-3" />
                {g.bestPracticesBadge}
              </Badge>
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">{g.bestPracticesTitle}</h2>
              <p className="text-muted-foreground">{g.bestPracticesSubtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bestPractices.map((tip, i) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 rounded-lg border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <tip.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">{g.rulesTitle}</h2>
                <p className="text-muted-foreground">{g.rulesSubtitle}</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <ul className="space-y-4">
                    {rules.map((rule) => (
                      <li key={rule} className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/30 py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="mb-10 text-center">
                <Badge variant="secondary" className="mb-3">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  {g.faqBadge}
                </Badge>
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">{g.faqTitle}</h2>
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
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="p-10 text-center md:p-14">
                <h2 className="mb-3 text-3xl font-bold md:text-4xl">{g.ctaTitle}</h2>
                <p className="mx-auto mb-6 max-w-xl opacity-90">{g.ctaDesc}</p>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/sell/start">
                    {g.ctaButton}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
