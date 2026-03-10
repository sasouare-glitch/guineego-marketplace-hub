import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface RoleGateProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

/**
 * Composant pour afficher du contenu uniquement si l'utilisateur a un des rôles requis.
 * Utile pour masquer des éléments UI selon le rôle.
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { hasAnyRole, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Composants pré-configurés pour chaque rôle
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function SellerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['ecommerce', 'admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function CourierOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['courier', 'admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function CloserOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['closer', 'admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function InvestorOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['investor', 'admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function CustomerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['customer', 'admin', 'super_user']} fallback={fallback}>{children}</RoleGate>;
}

export function SuperUserOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGate allowedRoles={['super_user', 'admin']} fallback={fallback}>{children}</RoleGate>;
}
