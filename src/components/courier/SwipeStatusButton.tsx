import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeStatusButtonProps {
  onComplete: () => void;
  label: string;
  completedLabel?: string;
  disabled?: boolean;
  /** GPS proximity info */
  gpsInfo?: {
    distanceToTarget: number | null;
    isNearTarget: boolean;
    targetLabel: string;
    formatDistance: (m: number) => string;
    error: string | null;
  };
}

export const SwipeStatusButton = ({ 
  onComplete, 
  label, 
  completedLabel = "Terminé !",
  disabled = false,
  gpsInfo,
}: SwipeStatusButtonProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Reset when label changes (new status step)
  useEffect(() => {
    setIsCompleted(false);
    x.set(0);
  }, [label]);
  
  const buttonWidth = 300;
  const handleWidth = 56;
  const threshold = buttonWidth - handleWidth - 20;
  
  const background = useTransform(
    x,
    [0, threshold],
    ["hsl(152, 81%, 39%)", "hsl(152, 81%, 30%)"]
  );
  
  const opacity = useTransform(x, [0, threshold / 2, threshold], [1, 0.5, 0]);

  const handleDragEnd = () => {
    if (x.get() > threshold * 0.8) {
      animate(x, threshold, { type: "spring", stiffness: 300, damping: 30 });
      setIsCompleted(true);
      onComplete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  if (disabled) {
    return (
      <div className="w-full">
        {gpsInfo?.distanceToTarget !== null && gpsInfo?.distanceToTarget !== undefined && (
          <div className="text-center text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
            <Navigation className="w-3 h-3" />
            {gpsInfo.formatDistance(gpsInfo.distanceToTarget)} du {gpsInfo.targetLabel}
          </div>
        )}
        <div className="w-full h-14 rounded-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground font-medium">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={constraintsRef}
      className="relative w-full h-14 rounded-full overflow-hidden"
      style={{ background }}
    >
      {/* Text label */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center text-white font-medium"
        style={{ opacity }}
      >
        <span className="flex items-center gap-2">
          {label}
          <ChevronRight className="w-5 h-5 animate-pulse" />
        </span>
      </motion.div>

      {/* Completed state */}
      {isCompleted && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center text-white font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Check className="w-5 h-5 mr-2" />
          {completedLabel}
        </motion.div>
      )}

      {/* Draggable handle */}
      {!isCompleted && (
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{ x }}
          className={cn(
            "absolute left-1 top-1 w-12 h-12 rounded-full bg-white shadow-lg",
            "flex items-center justify-center cursor-grab active:cursor-grabbing"
          )}
        >
          <ChevronRight className="w-6 h-6 text-guinea-green" />
        </motion.div>
      )}
    </motion.div>
  );
};
