import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Truck, 
  Users2, 
  TrendingUp, 
  DollarSign,
  ChevronRight,
  MapPin,
  Star,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const partnerTypes = [
  {
    type: "courier",
    icon: Truck,
    title: "Devenir Coursier",
    description: "Rejoignez notre réseau de livreurs et gagnez de l'argent en livrant des colis à Conakry et dans tout le pays.",
    benefits: [
      "Revenus flexibles selon vos horaires",
      "Formation gratuite incluse",
      "Application mobile dédiée",
      "Paiements hebdomadaires",
    ],
    cta: "Postuler maintenant",
    href: "/courier/join",
    color: "guinea-green",
    gradient: "from-guinea-green/10 to-guinea-green/5",
  },
  {
    type: "investor",
    icon: TrendingUp,
    title: "Devenir Investisseur",
    description: "Participez à la croissance de l'e-commerce guinéen. Investissez dans notre écosystème et générez des rendements.",
    benefits: [
      "Rendements attractifs",
      "Tableau de bord en temps réel",
      "Accompagnement personnalisé",
      "Diversification de portefeuille",
    ],
    cta: "Découvrir les opportunités",
    href: "/invest",
    color: "guinea-yellow",
    gradient: "from-guinea-yellow/10 to-guinea-yellow/5",
  },
];

const testimonials = [
  {
    name: "Mamadou Diallo",
    role: "Coursier, Conakry",
    avatar: avatarMamadou,
    quote: "GuineeGo m'a permis de travailler à mon rythme et de bien gagner ma vie. Le système est transparent et les paiements sont toujours à temps.",
    rating: 5,
  },
  {
    name: "Fatoumata Camara",
    role: "Investisseuse",
    avatar: avatarFatoumata,
    quote: "J'ai diversifié mes investissements avec GuineeGo. Les rendements sont bons et le suivi est excellent. Je recommande !",
    rating: 5,
  },
];

export function PartnersSection() {
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
          <span className="badge-guinea mb-4 inline-block">
            <Users2 className="w-4 h-4 inline mr-2" />
            Partenariats
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Rejoignez l'aventure GuineeGo
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Que vous souhaitiez devenir coursier ou investisseur, 
            GuineeGo vous offre des opportunités uniques pour prospérer.
          </p>
        </motion.div>

        {/* Partner Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {partnerTypes.map((partner, index) => (
            <motion.div
              key={partner.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-gradient-to-br ${partner.gradient} bg-card rounded-3xl p-8 border border-border overflow-hidden`}
            >
              {/* Background decoration */}
              <div className={`absolute -top-10 -right-10 w-40 h-40 bg-${partner.color}/10 rounded-full blur-3xl`} />
              
              <div className={`w-16 h-16 bg-${partner.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <partner.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                {partner.title}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {partner.description}
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {partner.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full bg-${partner.color}/20 flex items-center justify-center`}>
                      <ChevronRight className={`w-3 h-3 text-${partner.color}`} />
                    </div>
                    <span className="text-foreground/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={index === 0 ? "default" : "accent"} 
                size="lg" 
                asChild
              >
                <Link to={partner.href}>
                  {partner.cta}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-guinea-yellow text-guinea-yellow" />
                ))}
              </div>
              
              <p className="text-foreground/80 mb-6 italic">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
