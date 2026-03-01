import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/categories";

interface CategoryBarProps {
  activeCategory?: string;
}

export const CategoryBar = ({ activeCategory }: CategoryBarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative bg-card border-b border-border">
      <div className="container-tight">
        <div className="relative flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 z-10 h-full rounded-none bg-gradient-to-r from-card via-card to-transparent pr-6 hidden sm:flex"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-2 sm:px-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <Link
                  key={category.id}
                  to={`/search?category=${category.id}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                    "text-sm font-medium",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </Link>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 z-10 h-full rounded-none bg-gradient-to-l from-card via-card to-transparent pl-6 hidden sm:flex"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
