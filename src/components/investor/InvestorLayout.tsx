import { ReactNode } from "react";
import { InvestorSidebar } from "./InvestorSidebar";
import { InvestorHeader } from "./InvestorHeader";

interface InvestorLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const InvestorLayout = ({ children, title, subtitle }: InvestorLayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <InvestorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <InvestorHeader title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
