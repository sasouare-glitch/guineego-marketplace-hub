import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '@/lib/firebase/config';
import { 
  AuthContextType, 
  AuthState, 
  UserProfile, 
  UserClaims, 
  UserRole 
} from '@/types/auth';

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

  // Charger les Custom Claims
  const loadUserClaims = useCallback(async (user: User): Promise<UserClaims | null> => {
    try {
      const tokenResult = await getIdTokenResult(user, true);
      const claims = tokenResult.claims;
      
      // Extraire les claims personnalisés avec valeurs par défaut
      return {
        role: (claims.role as UserRole) || 'customer',
        roles: (claims.roles as UserRole[]) || ['customer'],
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
        const [profile, claims] = await Promise.all([
          loadUserProfile(user),
          loadUserClaims(user)
        ]);
        
        // Mettre à jour lastLoginAt
        await updateDoc(doc(db, 'users', user.uid), {
          'metadata.lastLoginAt': serverTimestamp()
        }).catch(() => {});
        
        setState({
          user,
          profile,
          claims,
          loading: false,
          error: null
        });
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
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Mettre à jour le profil Firebase
      await firebaseUpdateProfile(user, { displayName });
      
      // Créer le document utilisateur dans Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        role: 'customer',
        roles: ['customer'],
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
      await signInWithEmailAndPassword(auth, email, password);
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

  // Connexion Google
  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithPopup(auth, googleProvider);
      
      // Créer le profil si nouveau
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'customer',
          roles: ['customer'],
          profile: {
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
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

  // Connexion Facebook
  const signInWithFacebook = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const result = await signInWithPopup(auth, facebookProvider);
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          role: 'customer',
          roles: ['customer'],
          profile: {
            firstName: result.user.displayName?.split(' ')[0] || '',
            lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
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
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          phone: result.user.phoneNumber,
          role: 'customer',
          roles: ['customer'],
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

  // Vérifier si l'utilisateur a un rôle
  const hasRole = (role: UserRole): boolean => {
    if (!state.claims) return false;
    return state.claims.role === role || (state.claims.roles?.includes(role) ?? false);
  };

  // Vérifier si l'utilisateur a un des rôles
  const hasAnyRole = (roles: UserRole[]): boolean => {
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
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
