import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { CATEGORIES } from "@/constants/categories";

export function CategoriesSection() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge-guinea mb-4 inline-block">{t.categories.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            {t.categories.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.categories.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {CATEGORIES.filter((c) => c.id !== "Autres").map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/search?category=${category.id}`}
                className="group block bg-card rounded-2xl p-6 border border-border card-hover"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.label}
                </h3>
                <div className="flex items-center justify-end">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            {t.categories.viewAll}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
