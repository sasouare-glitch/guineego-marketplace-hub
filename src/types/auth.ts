import { User as FirebaseUser } from 'firebase/auth';

// Rôles disponibles dans l'application
export type UserRole = 
  | 'customer'      // Client acheteur
  | 'ecommerce'     // E-commerçant / Vendeur
  | 'courier'       // Coursier / Livreur
  | 'closer'        // Closer (finalisation ventes)
  | 'investor'      // Investisseur
  | 'admin';        // Administrateur

// Structure des Custom Claims Firebase
export interface UserClaims {
  role: UserRole;
  roles?: UserRole[];          // Multi-rôles possibles
  ecomId?: string;             // ID boutique pour vendeurs
  courierId?: string;          // ID coursier
  closerId?: string;           // ID closer
  investorId?: string;         // ID investisseur
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

// Profil utilisateur enrichi
export interface UserProfile {
  uid: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  
  // Données Firestore
  profile?: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    language: 'fr' | 'en' | 'ar';
    currency: 'GNF' | 'USD' | 'EUR' | 'XOF';
  };
  
  addresses?: Address[];
  
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
  };
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  commune: string;
  quartier: string;
  address: string;
  isDefault: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// État du contexte d'authentification
export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  claims: UserClaims | null;
  loading: boolean;
  error: Error | null;
}

// Actions d'authentification
export interface AuthActions {
  // Email/Password
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  
  // OAuth
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  
  // Phone
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  
  // Profile
  updateProfile: (data: Partial<UserProfile['profile']>) => Promise<void>;
  
  // Rôles
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  refreshClaims: () => Promise<void>;
}

export interface AuthContextType extends AuthState, AuthActions {}

// Props pour les routes protégées
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}
