import { useState } from "react";
import avatarMamadou from "@/assets/avatar-mamadou.jpg";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VideoPlayer } from "@/components/academy/VideoPlayer";
import { CourseContent, Module, Resource } from "@/components/academy/CourseContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Clock, 
  Users, 
  BookOpen, 
  Award, 
  Play,
  CheckCircle2,
  Globe,
  Smartphone,
  FileText,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock course data
const course = {
  id: "1",
  title: "Lancer sa boutique e-commerce de A à Z",
  description: "Cette formation complète vous guide pas à pas dans la création et la gestion de votre boutique en ligne sur GuineeGo LAT. Apprenez les stratégies éprouvées pour réussir dans le e-commerce en Afrique de l'Ouest.",
  thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
  instructor: {
    name: "Mamadou Diallo",
    avatar: avatarMamadou,
    title: "Expert E-commerce",
    students: 8500,
    courses: 12,
    rating: 4.9,
  },
  duration: "4h 30min",
  modules: 12,
  lessons: 48,
  students: 2456,
  rating: 4.8,
  reviewCount: 342,
  price: 150000,
  originalPrice: 250000,
  category: "E-commerce",
  level: "beginner" as const,
  language: "Français",
  lastUpdated: "Janvier 2024",
  certificate: true,
  features: [
    "4h 30min de vidéo à la demande",
    "12 modules complets",
    "Exercices pratiques",
    "Ressources téléchargeables",
    "Accès à vie",
    "Certificat de complétion",
    "Support communautaire",
  ],
  whatYouWillLearn: [
    "Créer et configurer votre boutique sur GuineeGo LAT",
    "Photographier et présenter vos produits de manière professionnelle",
    "Fixer vos prix et gérer vos marges",
    "Gérer vos stocks et votre logistique",
    "Attirer des clients grâce au marketing digital",
    "Fidéliser vos clients et augmenter vos ventes",
  ],
};

const courseModules: Module[] = [
  {
    id: "m1",
    title: "Introduction au e-commerce",
    isCompleted: true,
    lessons: [
      { id: "l1", title: "Bienvenue dans la formation", duration: "5:00", type: "video", isCompleted: true },
      { id: "l2", title: "Pourquoi le e-commerce en Guinée ?", duration: "12:00", type: "video", isCompleted: true },
      { id: "l3", title: "Quiz : Les bases du e-commerce", duration: "5:00", type: "quiz", isCompleted: true },
    ],
  },
  {
    id: "m2",
    title: "Créer votre boutique GuineeGo",
    lessons: [
      { id: "l4", title: "Créer votre compte vendeur", duration: "8:00", type: "video", isCompleted: true },
      { id: "l5", title: "Configurer votre profil boutique", duration: "15:00", type: "video", isCurrent: true },
      { id: "l6", title: "Paramètres de livraison", duration: "10:00", type: "video" },
      { id: "l7", title: "Exercice : Créez votre boutique", duration: "20:00", type: "exercise" },
    ],
  },
  {
    id: "m3",
    title: "Ajouter vos produits",
    lessons: [
      { id: "l8", title: "Photographier vos produits", duration: "18:00", type: "video", isLocked: true },
      { id: "l9", title: "Rédiger des descriptions efficaces", duration: "12:00", type: "video", isLocked: true },
      { id: "l10", title: "Fixer vos prix", duration: "15:00", type: "video", isLocked: true },
      { id: "l11", title: "Gérer les variations", duration: "10:00", type: "video", isLocked: true },
    ],
  },
  {
    id: "m4",
    title: "Gestion des commandes",
    lessons: [
      { id: "l12", title: "Recevoir et traiter les commandes", duration: "12:00", type: "video", isLocked: true },
      { id: "l13", title: "Préparer les expéditions", duration: "10:00", type: "video", isLocked: true },
      { id: "l14", title: "Gérer les retours", duration: "8:00", type: "video", isLocked: true },
    ],
  },
];

const courseResources: Resource[] = [
  { id: "r1", title: "Template fiche produit", type: "excel", size: "45 KB" },
  { id: "r2", title: "Guide de photographie produit", type: "pdf", size: "2.3 MB" },
  { id: "r3", title: "Checklist lancement boutique", type: "pdf", size: "180 KB" },
];

const CourseDetail = () => {
  const { id } = useParams();
  const [currentLessonId, setCurrentLessonId] = useState("l5");
  const [isEnrolled, setIsEnrolled] = useState(true);

  const currentLesson = courseModules
    .flatMap(m => m.lessons)
    .find(l => l.id === currentLessonId);

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-GN') + ' GNF';
  };

  const progress = 25; // Would be calculated from actual completion

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mt-16">
        {/* Course Header */}
        <section className="bg-gradient-to-br from-guinea-green to-guinea-green/80 text-white py-10">
          <div className="container-tight">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Info */}
              <div className="flex-1">
                <nav className="flex items-center gap-2 text-sm text-white/70 mb-4">
                  <Link to="/academy" className="hover:text-white">Academy</Link>
                  <span>/</span>
                  <span>{course.category}</span>
                </nav>

                <h1 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  {course.title}
                </h1>

                <p className="text-white/80 mb-4">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-guinea-yellow text-guinea-yellow" />
                    <span className="font-bold">{course.rating}</span>
                    <span className="text-white/70">({course.reviewCount} avis)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{course.students.toLocaleString()} étudiants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons} leçons</span>
                  </div>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3">
                  <img 
                    src={course.instructor.avatar} 
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{course.instructor.name}</p>
                    <p className="text-sm text-white/70">{course.instructor.title}</p>
                  </div>
                </div>
              </div>

              {/* Preview Card (if not enrolled) */}
              {!isEnrolled && (
                <Card className="w-full lg:w-80 flex-shrink-0 bg-card text-foreground">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                        <Play className="w-8 h-8 text-guinea-green ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-display font-bold text-guinea-green">
                        {formatPrice(course.price)}
                      </span>
                      {course.originalPrice && (
                        <span className="text-muted-foreground line-through">
                          {formatPrice(course.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button className="w-full mb-3 bg-guinea-green hover:bg-guinea-green/90" size="lg">
                      S'inscrire maintenant
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Garantie satisfait ou remboursé 7 jours
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Progress Bar (if enrolled) */}
        {isEnrolled && (
          <div className="bg-card border-b border-border py-4">
            <div className="container-tight">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Votre progression</span>
                <span className="text-sm text-guinea-green font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <section className="container-tight py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Video Player & Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              {isEnrolled && (
                <div>
                  <VideoPlayer
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    poster={course.thumbnail}
                    title={currentLesson?.title}
                    onProgress={(p) => console.log('Progress:', p)}
                    onComplete={() => console.log('Completed')}
                  />
                  <div className="mt-4">
                    <h2 className="font-display text-xl font-bold">{currentLesson?.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Module 2 • Leçon 2 • {currentLesson?.duration}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="about">
                <TabsList>
                  <TabsTrigger value="about">À propos</TabsTrigger>
                  <TabsTrigger value="reviews">Avis</TabsTrigger>
                  <TabsTrigger value="qa">Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6 space-y-6">
                  {/* What you'll learn */}
                  <div>
                    <h3 className="font-display font-bold text-lg mb-4">Ce que vous apprendrez</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {course.whatYouWillLearn.map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-guinea-green flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h3 className="font-display font-bold text-lg mb-4">Cette formation comprend</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { icon: Play, label: "4h 30min de vidéo" },
                        { icon: FileText, label: "Ressources téléchargeables" },
                        { icon: Globe, label: "Accès à vie" },
                        { icon: Smartphone, label: "Accessible sur mobile" },
                        { icon: Award, label: "Certificat de complétion" },
                        { icon: MessageCircle, label: "Support communautaire" },
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <feature.icon className="w-5 h-5 text-primary" />
                          <span className="text-sm">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructor */}
                  <div>
                    <h3 className="font-display font-bold text-lg mb-4">Votre formateur</h3>
                    <Card className="bg-muted/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <img 
                            src={course.instructor.avatar}
                            alt={course.instructor.name}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-bold">{course.instructor.name}</h4>
                            <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-guinea-yellow text-guinea-yellow" />
                                {course.instructor.rating}
                              </span>
                              <span>{course.instructor.students.toLocaleString()} étudiants</span>
                              <span>{course.instructor.courses} formations</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Les avis seront affichés ici</p>
                  </div>
                </TabsContent>

                <TabsContent value="qa" className="mt-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Les questions seront affichées ici</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Course Content Sidebar */}
            <div>
              <div className="sticky top-24">
                <h3 className="font-display font-bold text-lg mb-4">Contenu du cours</h3>
                <CourseContent
                  modules={courseModules}
                  resources={courseResources}
                  currentLessonId={currentLessonId}
                  onSelectLesson={setCurrentLessonId}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
