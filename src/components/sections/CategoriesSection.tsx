import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Car, 
  Sparkles, 
  Baby, 
  Dumbbell, 
  BookOpen,
  ChevronRight
} from "lucide-react";

const categories = [
  { 
    name: "Électronique", 
    icon: Smartphone, 
    count: 2340, 
    href: "/marketplace/electronics",
    color: "from-blue-500 to-blue-600"
  },
  { 
    name: "Mode & Vêtements", 
    icon: Shirt, 
    count: 3567, 
    href: "/marketplace/fashion",
    color: "from-pink-500 to-rose-500"
  },
  { 
    name: "Maison & Déco", 
    icon: Home, 
    count: 1890, 
    href: "/marketplace/home",
    color: "from-amber-500 to-orange-500"
  },
  { 
    name: "Auto & Moto", 
    icon: Car, 
    count: 756, 
    href: "/marketplace/auto",
    color: "from-slate-600 to-slate-700"
  },
  { 
    name: "Beauté & Santé", 
    icon: Sparkles, 
    count: 1234, 
    href: "/marketplace/beauty",
    color: "from-purple-500 to-purple-600"
  },
  { 
    name: "Bébé & Enfant", 
    icon: Baby, 
    count: 987, 
    href: "/marketplace/kids",
    color: "from-teal-500 to-teal-600"
  },
  { 
    name: "Sport & Loisirs", 
    icon: Dumbbell, 
    count: 654, 
    href: "/marketplace/sports",
    color: "from-green-500 to-emerald-500"
  },
  { 
    name: "Livres & Médias", 
    icon: BookOpen, 
    count: 432, 
    href: "/marketplace/books",
    color: "from-indigo-500 to-indigo-600"
  },
];

export function CategoriesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="badge-guinea mb-4 inline-block">Catégories</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Explorez nos univers
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Des milliers de produits locaux et importés, soigneusement sélectionnés 
            pour répondre à tous vos besoins.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={category.href}
                className="group block bg-card rounded-2xl p-6 border border-border card-hover"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {category.count.toLocaleString()} produits
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link 
            to="/categories" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            Voir toutes les catégories
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
