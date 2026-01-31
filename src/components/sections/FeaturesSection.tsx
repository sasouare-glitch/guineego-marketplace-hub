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
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Store,
    title: "Multi-vendeurs",
    description: "Ouvrez votre boutique en ligne en quelques minutes. Gérez vos produits, commandes et finances depuis votre tableau de bord.",
    href: "/sell/start",
    cta: "Devenir vendeur",
    gradient: "from-guinea-green/10 to-guinea-green/5",
    iconBg: "bg-guinea-green",
  },
  {
    icon: Globe,
    title: "Transit Chine-Guinée",
    description: "Importez vos marchandises facilement. Devis personnalisé, suivi en temps réel, tarification au kilo ou volume.",
    href: "/transit",
    cta: "Demander un devis",
    gradient: "from-guinea-yellow/10 to-guinea-yellow/5",
    iconBg: "bg-guinea-yellow",
  },
  {
    icon: Truck,
    title: "Livraison express",
    description: "Réseau de coursiers fiables couvrant Conakry et l'intérieur du pays. Suivi GPS en temps réel.",
    href: "/delivery",
    cta: "Suivre un colis",
    gradient: "from-guinea-red/10 to-guinea-red/5",
    iconBg: "bg-guinea-red",
  },
  {
    icon: GraduationCap,
    title: "GuineeGo Academy",
    description: "Formez-vous au e-commerce, marketing digital, closing. Vidéos, PDF, certifications reconnues.",
    href: "/academy",
    cta: "Voir les formations",
    gradient: "from-blue-500/10 to-blue-500/5",
    iconBg: "bg-blue-500",
  },
  {
    icon: CreditCard,
    title: "Paiement mobile",
    description: "Orange Money, MTN Money, cartes bancaires et wallet interne. Transactions sécurisées et instantanées.",
    href: "/payment",
    cta: "En savoir plus",
    gradient: "from-orange-500/10 to-orange-500/5",
    iconBg: "bg-orange-500",
  },
  {
    icon: Shield,
    title: "Protection acheteur",
    description: "Vos achats sont protégés. Remboursement garanti si le produit n'est pas conforme à la description.",
    href: "/protection",
    cta: "Notre garantie",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    iconBg: "bg-emerald-500",
  },
];

export function FeaturesSection() {
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
          <span className="badge-guinea mb-4 inline-block">Nos services</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Une plateforme complète pour acheter, vendre, expédier et vous former 
            au commerce en ligne en Guinée.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
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
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <Link 
                to={feature.href}
                className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all"
              >
                {feature.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
