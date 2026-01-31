import { motion } from "framer-motion";
import { 
  Store, 
  Truck, 
  Globe, 
  GraduationCap, 
  CreditCard, 
  Shield,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Store,
      titleKey: "multiVendor" as const,
      descKey: "multiVendorDesc" as const,
      href: "/sell/start",
      ctaKey: "becomeSeller" as const,
      gradient: "from-guinea-green/10 to-guinea-green/5",
      iconBg: "bg-guinea-green",
    },
    {
      icon: Globe,
      titleKey: "transitChina" as const,
      descKey: "transitChinaDesc" as const,
      href: "/transit",
      ctaKey: "getQuote" as const,
      gradient: "from-guinea-yellow/10 to-guinea-yellow/5",
      iconBg: "bg-guinea-yellow",
    },
    {
      icon: Truck,
      titleKey: "expressDelivery" as const,
      descKey: "expressDeliveryDesc" as const,
      href: "/delivery",
      ctaKey: "trackPackage" as const,
      gradient: "from-guinea-red/10 to-guinea-red/5",
      iconBg: "bg-guinea-red",
    },
    {
      icon: GraduationCap,
      titleKey: "academy" as const,
      descKey: "academyDesc" as const,
      href: "/academy",
      ctaKey: "viewCourses" as const,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-500",
    },
    {
      icon: CreditCard,
      titleKey: "mobilePayment" as const,
      descKey: "mobilePaymentDesc" as const,
      href: "/payment",
      ctaKey: "learnMore" as const,
      gradient: "from-orange-500/10 to-orange-500/5",
      iconBg: "bg-orange-500",
    },
    {
      icon: Shield,
      titleKey: "buyerProtection" as const,
      descKey: "buyerProtectionDesc" as const,
      href: "/protection",
      ctaKey: "ourGuarantee" as const,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-500",
    },
  ];

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-tight">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="badge-guinea mb-4 inline-block">{t.features.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            {t.features.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.features.subtitle}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group relative bg-gradient-to-br ${feature.gradient} bg-card rounded-3xl p-8 border border-border overflow-hidden card-hover`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/50 to-transparent rounded-bl-full opacity-50" />
              
              <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {t.features[feature.titleKey]}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {t.features[feature.descKey]}
              </p>
              
              <Link 
                to={feature.href}
                className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all"
              >
                {t.features[feature.ctaKey]}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
