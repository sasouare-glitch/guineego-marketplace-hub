import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteProps, UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

// Emails with unconditional admin access (mirrors AuthContext logic)
const ADMIN_EMAILS = ['sasouare@gmail.com'];
// super_user has access to all protected routes (like admin)
const SUPER_ROLES: UserRole[] = ['admin', 'super_user'];

function PermissionLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Vérification des permissions...</p>
      </div>
    </div>
  );
}

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

  const userEmail = user.email?.toLowerCase();
  const isAdminEmail = Boolean(userEmail && ADMIN_EMAILS.includes(userEmail));

  // Vérifier les rôles si spécifiés (seulement si l'utilisateur est connecté)
  if (requiredRoles && requiredRoles.length > 0) {
    // Un vendeur (ecommerce) peut aussi agir en tant que loueur.
    const mappedRoles = requiredRoles.map((r) => (r === 'lessor' ? ['lessor', 'ecommerce'] : [r])).flat();
    const effectiveRoles = [...new Set([...mappedRoles, ...SUPER_ROLES])];

    // Important: wait for auth-derived permission state before mounting
    // privileged routes, otherwise Firestore listeners can attach too early
    // and trigger the SDK b815/ca9 assertion on admin pages.
    if (!claims && !profile) {
      return <PermissionLoader />;
    }

    if (isAdminEmail || hasAnyRole(effectiveRoles)) {
      return <>{children}</>;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    // Cas spécial : si l'accès investor est requis et manquant,
    // on envoie l'utilisateur compléter son profil au lieu de
    // simplement bloquer avec /access-denied.
    if (requiredRoles.includes('investor')) {
      const target = `${location.pathname}${location.search}`;
      return (
        <Navigate
          to={`/investor/complete-profile?from=${encodeURIComponent(target)}`}
          replace
        />
      );
    }

    // Même logique pour le rôle loueur : on dirige vers l'onboarding
    // /become-lessor au lieu de bloquer brutalement.
    // Un vendeur (ecommerce) peut aussi louer ses équipements.
    if (requiredRoles.includes('lessor')) {
      const target = `${location.pathname}${location.search}`;
      return (
        <Navigate
          to={`/become-lessor?from=${encodeURIComponent(target)}`}
          replace
        />
      );
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
