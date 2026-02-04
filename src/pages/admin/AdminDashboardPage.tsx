/**
 * Admin Dashboard Page
 * Direction/Admin analytics and KPIs
 */

import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminDashboardPage() {
  return (
    <AdminLayout title="Dashboard" description="Vue d'ensemble des performances">
      <AdminDashboard />
    </AdminLayout>
  );
}
