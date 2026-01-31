import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CourseCard, Course } from "@/components/academy/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, GraduationCap, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";

const allCourses: Course[] = [
  {
    id: "1",
    title: "Lancer sa boutique e-commerce de A à Z",
    description: "Apprenez à créer et gérer votre boutique en ligne sur GuineeGo LAT",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
    instructor: "Mamadou Diallo",
    duration: "4h 30min",
    modules: 12,
    students: 2456,
    rating: 4.8,
    reviewCount: 342,
    price: 150000,
    originalPrice: 250000,
    category: "E-commerce",
    level: "beginner",
    isBestSeller: true,
  },
  {
    id: "2",
    title: "Marketing digital pour entrepreneurs africains",
    description: "Maîtrisez les techniques de marketing adaptées au marché africain",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600",
    instructor: "Fatoumata Barry",
    duration: "6h 15min",
    modules: 15,
    students: 1823,
    rating: 4.7,
    reviewCount: 256,
    price: 200000,
    category: "Marketing",
    level: "intermediate",
    isNew: true,
  },
  {
    id: "3",
    title: "Gestion des stocks et logistique",
    description: "Optimisez votre chaîne d'approvisionnement et vos stocks",
    thumbnail: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600",
    instructor: "Ibrahim Sow",
    duration: "3h 45min",
    modules: 8,
    students: 987,
    rating: 4.6,
    reviewCount: 134,
    price: 120000,
    category: "Logistique",
    level: "intermediate",
  },
  {
    id: "4",
    title: "Import Chine-Guinée : Guide complet",
    description: "Tout savoir sur l'importation depuis la Chine vers la Guinée",
    thumbnail: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600",
    instructor: "Amadou Camara",
    duration: "5h 00min",
    modules: 10,
    students: 3245,
    rating: 4.9,
    reviewCount: 567,
    price: 180000,
    category: "Transit",
    level: "beginner",
    isBestSeller: true,
  },
  {
    id: "5",
    title: "Photographie produit pour e-commerce",
    description: "Créez des photos professionnelles pour vos produits",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600",
    instructor: "Aissatou Bah",
    duration: "2h 30min",
    modules: 6,
    students: 1456,
    rating: 4.5,
    reviewCount: 189,
    price: 0,
    category: "Créativité",
    level: "beginner",
    isFree: true,
  },
  {
    id: "6",
    title: "Service client et fidélisation",
    description: "Construisez une relation durable avec vos clients",
    thumbnail: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600",
    instructor: "Mariama Sylla",
    duration: "3h 00min",
    modules: 7,
    students: 876,
    rating: 4.7,
    reviewCount: 98,
    price: 0,
    category: "Service client",
    level: "beginner",
    isFree: true,
    isNew: true,
  },
  {
    id: "7",
    title: "Comptabilité pour e-commerçants",
    description: "Gérez vos finances et votre comptabilité efficacement",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
    instructor: "Oumar Barry",
    duration: "4h 00min",
    modules: 9,
    students: 654,
    rating: 4.4,
    reviewCount: 76,
    price: 150000,
    category: "Finance",
    level: "advanced",
  },
  {
    id: "8",
    title: "Devenir closer professionnel",
    description: "Techniques de vente et closing pour maximiser vos conversions",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600",
    instructor: "Alpha Diallo",
    duration: "5h 30min",
    modules: 11,
    students: 1234,
    rating: 4.8,
    reviewCount: 213,
    price: 220000,
    category: "Vente",
    level: "intermediate",
    isBestSeller: true,
  },
];

const categories = [
  "Tous",
  "E-commerce",
  "Marketing",
  "Logistique",
  "Transit",
  "Finance",
  "Vente",
  "Service client",
];

const Academy = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Tous" || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const freeCourses = allCourses.filter(c => c.isFree);
  const bestSellers = allCourses.filter(c => c.isBestSeller);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-guinea-green to-guinea-green/80 text-white py-16 mt-16">
          <div className="container-tight">
            <div className="max-w-2xl">
              <Badge className="bg-guinea-yellow text-foreground mb-4">
                <GraduationCap className="w-3 h-3 mr-1" />
                GuineeGo Academy
              </Badge>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Formez-vous au e-commerce et développez votre business
              </h1>
              <p className="text-white/80 text-lg mb-6">
                Des formations pratiques créées par des experts africains pour réussir dans le commerce en ligne.
              </p>
              
              {/* Search */}
              <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une formation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white text-foreground"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              {[
                { icon: GraduationCap, value: "50+", label: "Formations" },
                { icon: Users, value: "15K+", label: "Étudiants" },
                { icon: Award, value: "98%", label: "Satisfaction" },
                { icon: TrendingUp, value: "85%", label: "Réussite" },
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <stat.icon className="w-6 h-6 mb-2 text-guinea-yellow" />
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-white/70 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-border sticky top-16 bg-background z-30">
          <div className="container-tight">
            <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container-tight py-10">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">Toutes les formations</TabsTrigger>
              <TabsTrigger value="free">Gratuites</TabsTrigger>
              <TabsTrigger value="bestseller">Populaires</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredCourses.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg font-medium mb-2">Aucune formation trouvée</p>
                  <p className="text-muted-foreground">Essayez avec d'autres critères</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="free">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {freeCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bestseller">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bestSellers.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* CTA Section */}
        <section className="bg-muted py-16">
          <div className="container-tight text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Prêt à développer vos compétences ?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Inscrivez-vous gratuitement et accédez à des formations de qualité pour booster votre business.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/register">Créer un compte gratuit</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/academy/course/5">Essayer une formation gratuite</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Academy;
