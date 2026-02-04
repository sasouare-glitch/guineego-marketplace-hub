/**
 * Admin Dashboard Page
 * Direction/Admin analytics and KPIs
 */

import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}
