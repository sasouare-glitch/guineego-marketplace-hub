import { Check, Play, Lock, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "quiz" | "exercise";
  isCompleted?: boolean;
  isLocked?: boolean;
  isCurrent?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  isCompleted?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "excel" | "doc";
  size: string;
}

interface CourseContentProps {
  modules: Module[];
  resources?: Resource[];
  currentLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
}

export const CourseContent = ({ 
  modules, 
  resources = [], 
  currentLessonId, 
  onSelectLesson 
}: CourseContentProps) => {
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 
    0
  );

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-guinea-green/10 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-guinea-green">Progression du cours</p>
            <p className="text-sm text-muted-foreground">
              {completedLessons} / {totalLessons} leçons terminées
            </p>
          </div>
          <div className="text-2xl font-display font-bold text-guinea-green">
            {Math.round((completedLessons / totalLessons) * 100)}%
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="border border-border rounded-lg overflow-hidden">
            {/* Module Header */}
            <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  module.isCompleted 
                    ? "bg-guinea-green text-white" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {module.isCompleted ? <Check className="w-4 h-4" /> : moduleIndex + 1}
                </div>
                <div>
                  <h4 className="font-medium">{module.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {module.lessons.filter(l => l.isCompleted).length} / {module.lessons.length} leçons
                  </p>
                </div>
              </div>
            </div>

            {/* Lessons */}
            <div className="divide-y divide-border">
              {module.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => !lesson.isLocked && onSelectLesson(lesson.id)}
                  disabled={lesson.isLocked}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                    lesson.isLocked 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-muted/50",
                    currentLessonId === lesson.id && "bg-primary/5 border-l-4 border-primary"
                  )}
                >
                  {/* Status Icon */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    lesson.isCompleted 
                      ? "bg-guinea-green text-white"
                      : lesson.isLocked
                      ? "bg-muted text-muted-foreground"
                      : currentLessonId === lesson.id
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {lesson.isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : lesson.isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      currentLessonId === lesson.id && "text-primary"
                    )}>
                      {lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lesson.type === "video" ? "Vidéo" : lesson.type === "quiz" ? "Quiz" : "Exercice"} • {lesson.duration}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resources */}
      {resources.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ressources
            </h4>
          </div>
          <div className="divide-y divide-border">
            {resources.map((resource) => (
              <div key={resource.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{resource.title}</p>
                    <p className="text-xs text-muted-foreground uppercase">{resource.type} • {resource.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
