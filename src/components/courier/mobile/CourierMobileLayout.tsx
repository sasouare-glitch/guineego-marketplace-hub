import { ReactNode } from "react";
import { CourierMobileNav } from "./CourierMobileNav";
import { CourierMobileHeader } from "./CourierMobileHeader";

interface CourierMobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export const CourierMobileLayout = ({ 
  children, 
  title,
  showBack = false 
}: CourierMobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-32">
      <CourierMobileHeader title={title} showBack={showBack} />
      <main className="px-4 py-4">
        {children}
      </main>
      <CourierMobileNav />
    </div>
  );
};
