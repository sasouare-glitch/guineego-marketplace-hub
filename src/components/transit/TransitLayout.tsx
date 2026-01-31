import { ReactNode } from "react";
import { TransitSidebar } from "./TransitSidebar";
import { TransitHeader } from "./TransitHeader";

interface TransitLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const TransitLayout = ({ children, title, subtitle }: TransitLayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <TransitSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TransitHeader title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
