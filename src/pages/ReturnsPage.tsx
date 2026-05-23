import { useMemo } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";

export default function ReturnsPage() {
  const { t } = useTranslation();
  const r = t.pages.returns;

  const quickInfo = useMemo(
    () => [
      { icon: Clock, title: r.quickInfo[0].title, desc: r.quickInfo[0].desc },
      { icon: PackageCheck, title: r.quickInfo[1].title, desc: r.quickInfo[1].desc },
      { icon: Wallet, title: r.quickInfo[2].title, desc: r.quickInfo[2].desc },
    ],
    [r]
  );

  const steps = useMemo(
    () => [
      { icon: MessageCircle, title: r.steps[0].title, desc: r.steps[0].desc },
      { icon: PackageCheck, title: r.steps[1].title, desc: r.steps[1].desc },
      { icon: RotateCcw, title: r.steps[2].title, desc: r.steps[2].desc },
      { icon: Wallet, title: r.steps[3].title, desc: r.steps[3].desc },
    ],
    [r]
  );

  const eligible = r.eligible;
  const notEligible = r.notEligible;
  const faqs = r.faqs;

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
              {r.badge}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              {r.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground">
              {r.heroDesc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick info */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          {quickInfo.map((item, i) => (
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
          <h2 className="text-3xl font-bold">{r.stepsTitle}</h2>
          <p className="mt-2 text-muted-foreground">{r.stepsSubtitle}</p>
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
                <h3 className="text-xl font-semibold">{r.eligibleTitle}</h3>
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
                <h3 className="text-xl font-semibold">{r.notEligibleTitle}</h3>
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
              <h3 className="mb-1 text-lg font-semibold">{r.protectionTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {r.protectionDesc}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/protection">{r.protectionCta}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">{r.faqTitle}</h2>
            <p className="mt-2 text-muted-foreground">{r.faqSubtitle}</p>
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
              <p className="mb-1 font-semibold">{r.importantTitle}</p>
              <p className="text-muted-foreground">
                {r.importantDesc}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">{r.helpTitle}</h2>
          <p className="mt-2 text-muted-foreground">{r.helpSubtitle}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("https://wa.me/224620000000", "_blank")}>
            <CardContent className="p-6 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-green-600" />
              <h3 className="font-semibold">{r.whatsapp}</h3>
              <p className="text-sm text-muted-foreground">+224 620 000 000</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("tel:+224620000000", "_blank")}>
            <CardContent className="p-6 text-center">
              <Phone className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{r.phone}</h3>
              <p className="text-sm text-muted-foreground">+224 620 000 000</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => window.open("mailto:support@sarematy.com", "_blank")}>
            <CardContent className="p-6 text-center">
              <Mail className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h3 className="font-semibold">{r.email}</h3>
              <p className="text-sm text-muted-foreground">support@sarematy.com</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
