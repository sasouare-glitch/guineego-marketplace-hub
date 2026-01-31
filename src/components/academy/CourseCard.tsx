import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Star, Play, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  instructorAvatar?: string;
  duration: string;
  modules: number;
  students: number;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  isFree?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  progress?: number;
}

interface CourseCardProps {
  course: Course;
  showProgress?: boolean;
}

const levelConfig = {
  beginner: { label: "Débutant", className: "bg-guinea-green/10 text-guinea-green" },
  intermediate: { label: "Intermédiaire", className: "bg-guinea-yellow/10 text-guinea-yellow" },
  advanced: { label: "Avancé", className: "bg-guinea-red/10 text-guinea-red" },
};

export const CourseCard = ({ course, showProgress = false }: CourseCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-GN') + ' GNF';
  };

  const level = levelConfig[course.level];

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-xl transition-all duration-300">
      {/* Thumbnail */}
      <Link to={`/academy/course/${course.id}`} className="block relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-6 h-6 text-guinea-green ml-1" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {course.isFree && (
            <Badge className="bg-guinea-green text-white">Gratuit</Badge>
          )}
          {course.isNew && (
            <Badge className="bg-guinea-yellow text-foreground">Nouveau</Badge>
          )}
          {course.isBestSeller && (
            <Badge className="bg-guinea-red text-white">Best-seller</Badge>
          )}
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {course.duration}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category & Level */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {course.category}
          </Badge>
          <Badge className={cn("text-xs", level.className)}>
            {level.label}
          </Badge>
        </div>

        {/* Title */}
        <Link to={`/academy/course/${course.id}`}>
          <h3 className="font-display font-semibold line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {course.title}
          </h3>
        </Link>

        {/* Instructor */}
        <p className="text-sm text-muted-foreground mt-1">
          Par {course.instructor}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-guinea-yellow text-guinea-yellow" />
            <span className="font-medium text-foreground">{course.rating}</span>
            <span>({course.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{course.students}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.modules} modules</span>
          </div>
        </div>

        {/* Progress or Price */}
        {showProgress && course.progress !== undefined ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium text-guinea-green">{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        ) : (
          <div className="mt-4 flex items-baseline gap-2">
            {course.isFree ? (
              <span className="font-display font-bold text-lg text-guinea-green">Gratuit</span>
            ) : (
              <>
                <span className="font-display font-bold text-lg text-guinea-green">
                  {formatPrice(course.price)}
                </span>
                {course.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(course.originalPrice)}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
