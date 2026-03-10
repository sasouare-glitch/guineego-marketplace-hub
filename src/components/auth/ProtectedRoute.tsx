import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteProps, UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

// Emails with unconditional admin access (mirrors AuthContext logic)
const ADMIN_EMAILS = ['sasouare@gmail.com'];
// super_user has access to all protected routes (like admin)
const SUPER_ROLES: UserRole[] = ['admin', 'super_user'];

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, claims, profile, loading, hasAnyRole } = useAuth();
  const location = useLocation();

  // Afficher le loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Bypass immédiat et inconditionnel pour les emails admin prioritaires
  // Placé AVANT toute vérification de claims/rôles pour éviter les race conditions
  const userEmail = user?.email?.toLowerCase();
  const isAdminEmail = userEmail && ADMIN_EMAILS.includes(userEmail);

  // Vérifier les rôles si spécifiés (seulement si l'utilisateur est connecté)
  if (requiredRoles && requiredRoles.length > 0) {
    // Admin email bypass - accès immédiat sans attendre les claims
    if (isAdminEmail) {
      return <>{children}</>;
    }

    // super_user bypass - accès à toutes les routes protégées
    const effectiveRoles = [...new Set([...requiredRoles, ...SUPER_ROLES])];

    // hasAnyRole now also checks profile fallback
    if (hasAnyRole(effectiveRoles)) {
      return <>{children}</>;
    }

    // Attendre que les claims OU le profil soient chargés avant de refuser l'accès
    if (!claims && !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Vérification des permissions...</p>
          </div>
        </div>
      );
    }

    // À ce stade, claims chargés mais rôle insuffisant
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

// HOC pour protéger un composant
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
