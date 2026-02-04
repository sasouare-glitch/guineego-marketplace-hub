/**
 * Firebase Auth Hooks
 * Authentication state management with role-based access
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  getIdTokenResult,
  type User,
  type UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, callFunction } from './config';
import { useEffect, useState, useCallback, useMemo, createContext, useContext, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPES
// ============================================

export type UserRole = 'customer' | 'ecommerce' | 'courier' | 'closer' | 'investor' | 'admin';

export interface UserClaims {
  role: UserRole;
  ecommerceId?: string;
  courierId?: string;
  closerId?: string;
  investorId?: string;
  verified?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: UserRole;
  claims: UserClaims;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithFacebook: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshClaims: () => Promise<UserClaims>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isCourier: boolean;
  isCloser: boolean;
}

// ============================================
// AUTH CONTEXT
// ============================================

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();

  // Fetch user claims and profile
  const fetchUserProfile = useCallback(async (firebaseUser: User): Promise<UserProfile> => {
    const tokenResult = await getIdTokenResult(firebaseUser, true);
    const claims = (tokenResult.claims as unknown) as UserClaims;
    
    // Fetch additional profile data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || userData?.displayName,
      photoURL: firebaseUser.photoURL || userData?.avatar,
      phoneNumber: firebaseUser.phoneNumber || userData?.phone,
      role: claims.role || userData?.role || 'customer',
      claims
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userProfile = await fetchUserProfile(firebaseUser);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth state error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Sign up with email/password
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    displayName: string,
    role: UserRole = 'customer'
  ) => {
    setError(null);
    try {
      // Use Cloud Function for full registration
      const createUser = callFunction<any, { uid: string }>('createUserWithRole');
      const result = await createUser({
        email,
        password,
        displayName,
        role
      });

      // Sign in the user
      return signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists, if not create profile
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          avatar: result.user.photoURL,
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Sign in with Facebook
  const signInWithFacebook = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      
      // Check if user exists, if not create profile
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          avatar: result.user.photoURL,
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      queryClient.clear();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [queryClient]);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Refresh claims
  const refreshClaims = useCallback(async (): Promise<UserClaims> => {
    if (!user) throw new Error('No user logged in');
    
    const tokenResult = await getIdTokenResult(user, true);
    const claims = (tokenResult.claims as unknown) as UserClaims;
    
    setProfile(prev => prev ? { ...prev, claims, role: claims.role } : null);
    
    return claims;
  }, [user]);

  // Role checking
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  }, [profile]);

  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isSeller = useMemo(() => hasRole(['ecommerce', 'admin']), [hasRole]);
  const isCourier = useMemo(() => hasRole(['courier', 'admin']), [hasRole]);
  const isCloser = useMemo(() => hasRole(['closer', 'admin']), [hasRole]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    resetPassword,
    refreshClaims,
    hasRole,
    isAdmin,
    isSeller,
    isCourier,
    isCloser
  }), [
    user, profile, loading, error,
    signUp, signIn, signInWithGoogle, signInWithFacebook,
    logout, resetPassword, refreshClaims, hasRole,
    isAdmin, isSeller, isCourier, isCloser
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Main auth hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for current user role
 */
export function useCurrentUserRole() {
  const { profile, loading, hasRole, refreshClaims } = useAuth();
  
  return {
    role: profile?.role || null,
    claims: profile?.claims || null,
    loading,
    hasRole,
    refreshClaims,
    isCustomer: profile?.role === 'customer',
    isEcommerce: profile?.role === 'ecommerce',
    isCourier: profile?.role === 'courier',
    isCloser: profile?.role === 'closer',
    isInvestor: profile?.role === 'investor',
    isAdmin: profile?.role === 'admin'
  };
}

/**
 * Require auth hook - redirects if not authenticated
 */
export function useRequireAuth(requiredRoles?: UserRole[]) {
  const { user, profile, loading, hasRole } = useAuth();
  
  const isAuthorized = useMemo(() => {
    if (!user || !profile) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return hasRole(requiredRoles);
  }, [user, profile, requiredRoles, hasRole]);
  
  return {
    user,
    profile,
    loading,
    isAuthorized
  };
}
