import { Bell, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TransitHeaderProps {
  title: string;
  subtitle?: string;
}

export const TransitHeader = ({ title, subtitle }: TransitHeaderProps) => {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un colis..." 
              className="pl-10 w-64 bg-secondary border-0"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-guinea-red rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              2
            </span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" />
              <AvatarFallback>IB</AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">Ibrahim Barry</p>
              <p className="text-xs text-muted-foreground">Client Transit</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};
