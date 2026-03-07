import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  signInWithPopup,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getIdTokenResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '@/lib/firebase/config';
import { 
  AuthContextType, 
  AuthState, 
  UserProfile, 
  UserClaims, 
  UserRole 
} from '@/types/auth';

// Déterminer le rôle basé sur l'email (admin auto-attribué)
const ADMIN_EMAILS = ['sasouare@gmail.com'];
const determineUserRole = (email: string | null | undefined): UserRole => {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return 'admin';
  }
  return 'customer';
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    claims: null,
    loading: true,
    error: null
  });
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Charger le profil utilisateur depuis Firestore
  const loadUserProfile = useCallback(async (user: User): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return {
          uid: user.uid,
          email: user.email,
          phone: user.phoneNumber,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          ...userDoc.data()
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }, []);

  // Charger les Custom Claims (avec fallback Firestore + email admin override)
  const loadUserClaims = useCallback(async (user: User): Promise<UserClaims | null> => {
    try {
      // Priorité absolue : si l'email est dans la liste admin, role = admin
      if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        // Mettre à jour Firestore si le rôle n'est pas encore admin
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role !== 'admin') {
            await updateDoc(doc(db, 'users', user.uid), {
              role: 'admin',
              roles: ['admin'],
              'metadata.updatedAt': serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Could not update admin role in Firestore:', e);
        }

        const tokenResult = await getIdTokenResult(user, true);
        const claims = tokenResult.claims;
        return {
          role: 'admin',
          roles: ['admin'],
          ecomId: claims.ecomId as string | undefined,
          courierId: claims.courierId as string | undefined,
          closerId: claims.closerId as string | undefined,
          investorId: claims.investorId as string | undefined,
          emailVerified: user.emailVerified,
          phoneVerified: !!user.phoneNumber
        };
      }

      const tokenResult = await getIdTokenResult(user, true);
      const claims = tokenResult.claims;
      
      let role = (claims.role as UserRole) || null;
      let roles = (claims.roles as UserRole[]) || null;

      // Fallback: si pas de rôle dans les Custom Claims, vérifier Firestore
      if (!role || role === 'customer') {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role && userData.role !== 'customer') {
              role = userData.role as UserRole;
            }
            if (userData.roles && Array.isArray(userData.roles)) {
              roles = userData.roles as UserRole[];
            }
          }
        } catch (e) {
          console.warn('Fallback Firestore role check failed:', e);
        }
      }

      return {
        role: role || 'customer',
        roles: roles || [role || 'customer'],
        ecomId: claims.ecomId as string | undefined,
        courierId: claims.courierId as string | undefined,
        closerId: claims.closerId as string | undefined,
        investorId: claims.investorId as string | undefined,
        emailVerified: user.emailVerified,
        phoneVerified: !!user.phoneNumber
      };
    } catch (error) {
      console.error('Error loading user claims:', error);
      return null;
    }
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [profile, claims] = await Promise.all([
            loadUserProfile(user),
            loadUserClaims(user)
          ]);
          
          // Mettre à jour lastLoginAt seulement si le profil existe
          if (profile) {
            updateDoc(doc(db, 'users', user.uid), {
              'metadata.lastLoginAt': serverTimestamp()
            }).catch(() => {});
          }
          
          setState({
            user,
            profile,
            claims,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error loading user data:', error);
          setState({
            user,
            profile: null,
            claims: null,
            loading: false,
            error: null
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          claims: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile, loadUserClaims]);

  // Inscription par email
  const signUp = async (email: string, password: string, displayName: string, role?: UserRole) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil Firebase
      await firebaseUpdateProfile(user, { displayName });
      
      // Créer le document utilisateur dans Firestore
      const finalRole = role || determineUserRole(user.email);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        role: finalRole,
        roles: [finalRole],
        profile: {
          firstName: displayName.split(' ')[0] || '',
          lastName: displayName.split(' ').slice(1).join(' ') || '',
          language: 'fr',
          currency: 'GNF'
        },
        preferences: {
          notifications: { push: true, email: true, sms: false },
          marketing: false
        },
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          loyaltyPoints: 0
        },
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        }
      });
      
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  };

  // Connexion par email
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Auto-créer le document Firestore si absent (ex: compte créé via Firebase Console)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const role = determineUserRole(user.email);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || email?.split('@')[0] || '',
          role,
          roles: [role],
          profile: {
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            language: 'fr',
            currency: 'GNF'
          },
          metadata: {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          }
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  };

  // Déconnexion
  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  };

  // Réinitialisation mot de passe
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  // Mise à jour mot de passe
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!state.user || !state.user.email) {
      throw new Error('No user logged in');
    }
    
    const credential = EmailAuthProvider.credential(state.user.email, currentPassword);
    await reauthenticateWithCredential(state.user, credential);
    await firebaseUpdatePassword(state.user, newPassword);
  };

  // Helper: créer profil Google/Facebook si nouveau
  const ensureUserProfile = async (user: User) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      const role = determineUserRole(user.email);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role,
        roles: [role],
        profile: {
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          language: 'fr',
          currency: 'GNF'
        },
        metadata: {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        }
      });
    }
  };

  // Connexion Google (avec fallback popup robuste)
  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Tenter signInWithPopup directement
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserProfile(result.user);
    } catch (error: any) {
      // Si popup bloqué dans iframe, ouvrir dans une nouvelle fenêtre
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('Popup blocked or closed, retrying...', error.code);
      }
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  };

  // Connexion Facebook
  const signInWithFacebook = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithPopup(auth, facebookProvider);
      await ensureUserProfile(result.user);
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error: error as Error }));
      throw error;
    }
  };

  // Connexion par téléphone
  const signInWithPhone = async (phoneNumber: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (error) {
      throw error;
    }
  };

  // Vérifier OTP
  const verifyOTP = async (otp: string) => {
    if (!confirmationResult) {
      throw new Error('No confirmation result');
    }
    
    try {
      const result = await confirmationResult.confirm(otp);
      
      // Créer le profil si nouveau
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const role = determineUserRole(result.user.phoneNumber);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          phone: result.user.phoneNumber,
          role,
          roles: [role],
          profile: {
            language: 'fr',
            currency: 'GNF'
          },
          metadata: {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          }
        });
      }
      
      setConfirmationResult(null);
    } catch (error) {
      throw error;
    }
  };

  // Mettre à jour le profil
  const updateUserProfile = async (data: Partial<UserProfile['profile']>) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }
    
    await updateDoc(doc(db, 'users', state.user.uid), {
      profile: { ...state.profile?.profile, ...data },
      'metadata.updatedAt': serverTimestamp()
    });
    
    // Recharger le profil
    const profile = await loadUserProfile(state.user);
    setState(prev => ({ ...prev, profile }));
  };

  // Force-refresh des claims (peut être appelé manuellement)
  const refreshClaims = useCallback(async () => {
    if (!state.user) return;
    const [profile, claims] = await Promise.all([
      loadUserProfile(state.user),
      loadUserClaims(state.user)
    ]);
    setState(prev => ({ ...prev, profile, claims }));
  }, [state.user, loadUserProfile, loadUserClaims]);

  // Track current role via ref to avoid stale closure in onSnapshot
  const currentRoleRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    currentRoleRef.current = state.claims?.role || null;
  }, [state.claims?.role]);

  // Écouter les changements du document utilisateur pour auto-refresh des claims
  useEffect(() => {
    if (!state.user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', state.user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      // Si le rôle a changé dans Firestore, rafraîchir les claims (une seule fois)
      if (data.role && data.role !== currentRoleRef.current && !isRefreshingRef.current) {
        console.log('[AuthContext] Role changed in Firestore, refreshing claims…');
        isRefreshingRef.current = true;
        refreshClaims().finally(() => {
          isRefreshingRef.current = false;
        });
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.uid]);

  // Vérifier si l'utilisateur a un rôle
  // Les emails admin ont toujours tous les droits, quelle que soit l'état des claims
  const hasRole = (role: UserRole): boolean => {
    if (state.user?.email && ADMIN_EMAILS.includes(state.user.email.toLowerCase())) {
      return true;
    }
    if (!state.claims) return false;
    return state.claims.role === role || (state.claims.roles?.includes(role) ?? false);
  };

  // Vérifier si l'utilisateur a un des rôles
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (state.user?.email && ADMIN_EMAILS.includes(state.user.email.toLowerCase())) {
      return true;
    }
    if (!state.claims) return false;
    return roles.some(role => hasRole(role));
  };

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signInWithFacebook,
    signInWithPhone,
    verifyOTP,
    updateProfile: updateUserProfile,
    hasRole,
    hasAnyRole,
    refreshClaims
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
