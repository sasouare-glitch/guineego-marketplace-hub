import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BigActionButtonProps {
  icon: LucideIcon;
  label: string;
  color: "green" | "yellow" | "red" | "primary";
  onClick?: () => void;
  disabled?: boolean;
  pulse?: boolean;
}

const colorStyles = {
  green: "bg-guinea-green hover:bg-guinea-green/90 text-white shadow-lg shadow-guinea-green/30",
  yellow: "bg-guinea-yellow hover:bg-guinea-yellow/90 text-white shadow-lg shadow-guinea-yellow/30",
  red: "bg-guinea-red hover:bg-guinea-red/90 text-white shadow-lg shadow-guinea-red/30",
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30",
};

export const BigActionButton = ({
  icon: Icon,
  label,
  color,
  onClick,
  disabled,
  pulse,
}: BigActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-20 rounded-3xl font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-95",
        colorStyles[color],
        disabled && "opacity-50 cursor-not-allowed",
        pulse && "animate-pulse"
      )}
    >
      <Icon className="w-10 h-10" strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
};
