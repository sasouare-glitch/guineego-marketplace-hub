import { useState } from "react";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";
import { cn } from "@/lib/utils";

interface SellerLayoutProps {
  children: React.ReactNode;
}

export function SellerLayout({ children }: SellerLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block">
        <SellerSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Header */}
      <SellerHeader
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <div className="p-3 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
