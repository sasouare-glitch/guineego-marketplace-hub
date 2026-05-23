import { useState, useMemo } from "react";
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
import { useTranslation } from "@/hooks/useTranslation";

export default function ContactPage() {
  const { t } = useTranslation();
  const c = t.pages.contact;

  const contactMethods = useMemo(
    () => [
      {
        icon: MessageCircle,
        title: c.methods.whatsapp.title,
        description: c.methods.whatsapp.description,
        value: "+224 621 00 00 00",
        action: c.methods.whatsapp.action,
        href: "https://wa.me/224621000000",
        color: "bg-green-500/10 text-green-600",
      },
      {
        icon: Phone,
        title: c.methods.phone.title,
        description: c.methods.phone.description,
        value: "+224 621 00 00 00",
        action: c.methods.phone.action,
        href: "tel:+224621000000",
        color: "bg-primary/10 text-primary",
      },
      {
        icon: Mail,
        title: c.methods.email.title,
        description: c.methods.email.description,
        value: "support@sarematy.com",
        action: c.methods.email.action,
        href: "mailto:support@sarematy.com",
        color: "bg-blue-500/10 text-blue-600",
      },
      {
        icon: MapPin,
        title: c.methods.address.title,
        description: c.methods.address.description,
        value: c.methods.address.value,
        action: c.methods.address.action,
        href: "https://www.google.com/maps/search/?api=1&query=Kaloum,Conakry,Guinée",
        color: "bg-amber-500/10 text-amber-600",
      },
    ],
    [c]
  );

  const subjects = useMemo(
    () => [
      { value: "order", label: c.subjects.order },
      { value: "delivery", label: c.subjects.delivery },
      { value: "return", label: c.subjects.return },
      { value: "seller", label: c.subjects.seller },
      { value: "courier", label: c.subjects.courier },
      { value: "account", label: c.subjects.account },
      { value: "payment", label: c.subjects.payment },
      { value: "bug", label: c.subjects.bug },
      { value: "suggestion", label: c.subjects.suggestion },
      { value: "other", label: c.subjects.other },
    ],
    [c]
  );

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
    if (!formData.name.trim()) newErrors.name = c.errors.nameRequired;
    if (!formData.email.trim()) {
      newErrors.email = c.errors.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = c.errors.emailInvalid;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = c.errors.phoneRequired;
    } else if (!/^\d{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = c.errors.phoneInvalid;
    }
    if (!formData.subject) newErrors.subject = c.errors.subjectRequired;
    if (!formData.message.trim()) newErrors.message = c.errors.messageRequired;
    else if (formData.message.trim().length < 10)
      newErrors.message = c.errors.messageTooShort;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const subjectLabel =
      subjects.find((s) => s.value === formData.subject)?.label || formData.subject;
    const body = encodeURIComponent(
      `${c.mailLabels.name} : ${formData.name}\n${c.mailLabels.phone} : ${formData.phone}\n${c.mailLabels.subject} : ${subjectLabel}\n\n${c.mailLabels.message} :\n${formData.message}`
    );
    window.open(
      `mailto:support@sarematy.com?subject=[Contact Sarematy] ${formData.subject}&body=${body}`,
      "_blank"
    );
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
              {c.badge}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              {c.heroTitle}
            </h1>
            <p className="text-lg text-muted-foreground">{c.heroDescription}</p>
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
              <Card
                className="h-full transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                onClick={() => window.open(method.href, "_blank")}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full ${method.color}`}
                  >
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
                <h2 className="mb-6 text-2xl font-bold">{c.formTitle}</h2>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-12 text-center"
                  >
                    <div className="mb-4 rounded-full bg-green-500/10 p-4">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{c.sentTitle}</h3>
                    <p className="text-muted-foreground">{c.sentDesc}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{c.fields.name}</Label>
                        <Input
                          id="name"
                          placeholder={c.fields.namePlaceholder}
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
                        <Label htmlFor="email">{c.fields.email}</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={c.fields.emailPlaceholder}
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
                        <Label htmlFor="phone">{c.fields.phone}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={c.fields.phonePlaceholder}
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
                        <Label htmlFor="subject">{c.fields.subject}</Label>
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
                          <option value="">{c.fields.subjectPlaceholder}</option>
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
                      <Label htmlFor="message">{c.fields.message}</Label>
                      <Textarea
                        id="message"
                        placeholder={c.fields.messagePlaceholder}
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
                      {c.submit}
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
                  <h3 className="font-semibold">{c.hoursTitle}</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">{c.hoursWeekdays}</span>
                    <span className="font-medium">{c.hoursWeekdaysValue}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">{c.hoursWeekend}</span>
                    <span className="font-medium">{c.hoursWeekendValue}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">{c.hoursHolidays}</span>
                    <span className="font-medium">{c.hoursHolidaysValue}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{c.protectionTitle}</h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{c.protectionDesc}</p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/protection">{c.protectionCta}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="mb-3 font-semibold">{c.shortcutsTitle}</h3>
                <div className="space-y-2">
                  <Link
                    to="/help"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{c.shortcutHelp}</p>
                      <p className="text-xs text-muted-foreground">{c.shortcutHelpDesc}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/returns"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{c.shortcutReturns}</p>
                      <p className="text-xs text-muted-foreground">{c.shortcutReturnsDesc}</p>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                  <Link
                    to="/sell/start"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-primary/5"
                  >
                    <Store className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{c.shortcutSell}</p>
                      <p className="text-xs text-muted-foreground">{c.shortcutSellDesc}</p>
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
              <h2 className="text-3xl font-bold">{c.faqTitle}</h2>
              <p className="mt-2 text-muted-foreground">{c.faqSubtitle}</p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-2">
              {c.faqs.map((faq, i) => (
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
