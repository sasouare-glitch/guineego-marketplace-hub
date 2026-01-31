import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Play, 
  Clock, 
  Users, 
  Award,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Megaphone,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const courses = [
  {
    id: 1,
    title: "Lancer sa boutique e-commerce",
    category: "Débutant",
    duration: "4h 30min",
    students: 1234,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
    href: "/academy/course/1",
  },
  {
    id: 2,
    title: "Marketing digital en Afrique",
    category: "Intermédiaire",
    duration: "6h 15min",
    students: 856,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    href: "/academy/course/2",
  },
  {
    id: 3,
    title: "Devenir closer pro",
    category: "Avancé",
    duration: "8h 00min",
    students: 432,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop",
    href: "/academy/course/3",
  },
];

const academyStats = [
  { icon: BookOpen, value: "50+", label: "Formations" },
  { icon: Users, value: "5K+", label: "Étudiants" },
  { icon: Award, value: "98%", label: "Satisfaction" },
];

export function AcademySection() {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-guinea-yellow/5 to-transparent" />
      
      <div className="container-tight relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-guinea mb-4 inline-block">
              <GraduationCap className="w-4 h-4 inline mr-2" />
              GuineeGo Academy
            </span>
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-6">
              Formez-vous au commerce digital
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Des formations conçues pour l'Afrique, par des experts africains. 
              Apprenez à créer, gérer et développer votre activité e-commerce 
              avec des méthodes adaptées à notre marché.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {academyStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-guinea-green/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-guinea-green" />
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/academy">
                  Explorer les formations
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/academy/pricing">
                  Voir les tarifs
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Right - Course Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ x: 5 }}
              >
                <Link
                  to={course.href}
                  className="group flex gap-4 bg-card rounded-2xl p-4 border border-border card-hover"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-foreground fill-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-guinea-green/10 text-guinea-green rounded-full mb-2">
                      {course.category}
                    </span>
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.students.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
