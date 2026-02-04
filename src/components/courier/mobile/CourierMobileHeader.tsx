import { ArrowLeft, Bell, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CourierMobileHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const CourierMobileHeader = ({ title, showBack }: CourierMobileHeaderProps) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <header className="sticky top-0 z-40 bg-card border-b-2 border-border safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Back or Status */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-2xl"
            >
              <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
            </Button>
          ) : (
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
                isOnline 
                  ? "bg-guinea-green text-white" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Power className="w-5 h-5" strokeWidth={3} />
              <span>{isOnline ? "EN LIGNE" : "HORS LIGNE"}</span>
            </button>
          )}
        </div>

        {/* Center: Title */}
        {title && (
          <h1 className="text-lg font-bold text-center flex-1 truncate px-2">
            {title}
          </h1>
        )}

        {/* Right: Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl relative"
        >
          <Bell className="w-7 h-7" strokeWidth={2.5} />
          <span className="absolute top-2 right-2 w-4 h-4 bg-guinea-red rounded-full flex items-center justify-center text-[10px] text-white font-bold">
            3
          </span>
        </Button>
      </div>
    </header>
  );
};
