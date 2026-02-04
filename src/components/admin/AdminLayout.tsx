/**
 * ADMIN LAYOUT: Layout wrapper for admin pages
 */

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, User, Settings, ChevronDown, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, profile, signOut } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="h-full px-4 flex items-center justify-between gap-4">
              {/* Left side */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="shrink-0" />
                
                {title && (
                  <div className="hidden sm:block">
                    <h1 className="font-semibold text-foreground">{title}</h1>
                    {description && (
                      <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Back to site */}
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link to="/" className="gap-2">
                    <Home className="w-4 h-4" />
                    Retour au site
                  </Link>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px]"
                  >
                    3
                  </Badge>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.photoURL || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {profile?.displayName?.charAt(0)?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-foreground">
                          {profile?.displayName || 'Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground">Administrateur</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Mon profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/admin/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
