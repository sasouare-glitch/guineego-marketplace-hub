import { Menu, User, MapPin, Power } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface CourierHeaderProps {
  onMenuClick: () => void;
}

export const CourierHeader = ({ onMenuClick }: CourierHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Menu mobile + Status */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {/* Online Status Toggle */}
        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-guinea-green animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm font-medium hidden sm:inline">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
          <Switch 
            checked={isOnline} 
            onCheckedChange={setIsOnline}
            className="data-[state=checked]:bg-guinea-green"
          />
        </div>
      </div>

      {/* Location */}
      <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-primary" />
        <span>Conakry, Kaloum</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications Firestore */}
        <NotificationCenter />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden md:inline font-medium">{user?.displayName || "Coursier"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.displayName || "Coursier"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/courier/profile")}>
              <User className="w-4 h-4 mr-2" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/courier/profile")}>
              <MapPin className="w-4 h-4 mr-2" />
              Mes zones
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-guinea-red" onClick={handleSignOut}>
              <Power className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
