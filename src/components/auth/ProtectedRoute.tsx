import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRouteProps } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ 
  children, 
  requiredRoles,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, claims, loading, hasAnyRole } = useAuth();
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

  // Rediriger si non authentifié
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Vérifier les rôles si spécifiés
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(requiredRoles)) {
      // Afficher le fallback ou rediriger vers accès refusé
      if (fallback) {
        return <>{fallback}</>;
      }
      return <Navigate to="/access-denied" replace />;
    }
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
