import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CATEGORIES } from "@/constants/categories";
import { useTranslation } from "@/hooks/useTranslation";

export default function CategoriesPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 lg:pt-32">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
          <div className="container-tight py-12 lg:py-16 text-center">
            <span className="badge-guinea mb-4 inline-block">
              {t.categories?.badge ?? "Catégories"}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t.categories?.title ?? "Toutes les catégories"}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.categories?.subtitle ??
                "Parcourez tous nos univers et trouvez exactement ce qu'il vous faut."}
            </p>
          </div>
        </section>

        {/* Grid */}
        <section className="container-tight py-10 lg:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {CATEGORIES.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={`/search?category=${encodeURIComponent(cat.id)}`}
                    className="group block bg-card border border-border rounded-2xl p-5 lg:p-6 hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <div
                      className={`w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-base lg:text-lg">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                      {t.marketplace?.viewAll ?? "Voir tout"} →
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
