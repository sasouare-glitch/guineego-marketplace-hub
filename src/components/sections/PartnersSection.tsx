import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import avatarMamadou from "@/assets/avatar-mamadou.jpg";
import avatarFatoumata from "@/assets/avatar-fatoumata.jpg";
import { 
  Truck, 
  Users2, 
  TrendingUp,
  CalendarDays,
  ChevronRight,
  Star,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export function PartnersSection() {
  const { t } = useTranslation();

  const partnerTypes = [
    {
      type: "courier",
      icon: Truck,
      title: t.partners.becomeCourier,
      description: t.partners.courierDesc,
      benefits: [
        t.partners.courierBenefit1,
        t.partners.courierBenefit2,
        t.partners.courierBenefit3,
        t.partners.courierBenefit4,
      ],
      cta: t.partners.courierCta,
      href: "/courier/join",
      color: "guinea-green",
      gradient: "from-guinea-green/10 to-guinea-green/5",
    },
    {
      type: "investor",
      icon: TrendingUp,
      title: t.partners.becomeInvestor,
      description: t.partners.investorDesc,
      benefits: [
        t.partners.investorBenefit1,
        t.partners.investorBenefit2,
        t.partners.investorBenefit3,
        t.partners.investorBenefit4,
      ],
      cta: t.partners.investorCta,
      href: "/invest",
      color: "guinea-yellow",
      gradient: "from-guinea-yellow/10 to-guinea-yellow/5",
    },
    {
      type: "lessor",
      icon: CalendarDays,
      title: t.partners.becomeLessor,
      description: t.partners.lessorDesc,
      benefits: [
        t.partners.lessorBenefit1,
        t.partners.lessorBenefit2,
        t.partners.lessorBenefit3,
        t.partners.lessorBenefit4,
      ],
      cta: t.partners.lessorCta,
      href: "/lessor/items/new",
      color: "violet-500",
      gradient: "from-violet-500/10 to-violet-500/5",
    },
  ];

  const testimonials = [
    {
      name: "Mamadou Diallo",
      role: t.partners.testimonial1Role,
      avatar: avatarMamadou,
      quote: t.partners.testimonial1Quote,
      rating: 5,
    },
    {
      name: "Fatoumata Camara",
      role: t.partners.testimonial2Role,
      avatar: avatarFatoumata,
      quote: t.partners.testimonial2Quote,
      rating: 5,
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
          <span className="badge-guinea mb-4 inline-block">
            <Users2 className="w-4 h-4 inline mr-2" />
            {t.partners.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            {t.partners.mainTitle}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.partners.mainDescription}
          </p>
        </motion.div>

        {/* Partner Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
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
                variant={index === 0 ? "default" : index === 1 ? "accent" : "guinea"} 
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
