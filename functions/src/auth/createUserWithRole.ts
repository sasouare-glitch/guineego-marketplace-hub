/**
 * AUTH FUNCTION: Create User with Role
 * Callable function for user registration with role assignment
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { UserRole, setUserClaims } from '../utils/auth';

const db = admin.firestore();

interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  // Role-specific data
  businessName?: string;      // For ecommerce
  businessAddress?: string;   // For ecommerce
  vehicleType?: string;       // For courier
  zones?: string[];           // For courier
}

/**
 * Create user with role and profile
 * httpsCallable: createUserWithRole
 */
export const createUserWithRole = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateUserData, context) => {
    // Validate input
    if (!data.email || !data.password || !data.displayName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email, mot de passe et nom sont requis'
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['customer', 'ecommerce', 'courier', 'closer', 'investor'];
    if (!validRoles.includes(data.role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Rôle invalide'
      );
    }

    // Admin role requires existing admin to create
    if (data.role === 'admin') {
      if (!context.auth?.token?.role || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Seul un admin peut créer un autre admin'
        );
      }
    }

    try {
      // 1. Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        phoneNumber: data.phone
      });

      const uid = userRecord.uid;
      const batch = db.batch();

      // 2. Create base user document
      const userRef = db.collection('users').doc(uid);
      batch.set(userRef, {
        uid,
        email: data.email,
        displayName: data.displayName,
        phone: data.phone || null,
        role: data.role,
        avatar: null,
        verified: false,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 3. Create role-specific profile
      let roleDocId: string | null = null;

      switch (data.role) {
        case 'ecommerce': {
          const ecomRef = db.collection('ecommerces').doc();
          roleDocId = ecomRef.id;
          batch.set(ecomRef, {
            id: ecomRef.id,
            userId: uid,
            businessName: data.businessName || data.displayName,
            businessAddress: data.businessAddress || '',
            logo: null,
            rating: 0,
            totalSales: 0,
            totalProducts: 0,
            commission: 0.1, // 10% commission
            verified: false,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        }

        case 'courier': {
          const courierRef = db.collection('couriers').doc();
          roleDocId = courierRef.id;
          batch.set(courierRef, {
            id: courierRef.id,
            userId: uid,
            vehicleType: data.vehicleType || 'moto',
            zones: data.zones || ['Kaloum'],
            isOnline: false,
            currentLocation: null,
            rating: 0,
            totalDeliveries: 0,
            totalEarnings: 0,
            verified: false,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        }

        case 'closer': {
          const closerRef = db.collection('closers').doc();
          roleDocId = closerRef.id;
          batch.set(closerRef, {
            id: closerRef.id,
            userId: uid,
            assignedOrders: 0,
            completedOrders: 0,
            conversionRate: 0,
            totalCommission: 0,
            rating: 0,
            isAvailable: true,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        }

        case 'investor': {
          const investorRef = db.collection('investors').doc();
          roleDocId = investorRef.id;
          batch.set(investorRef, {
            id: investorRef.id,
            userId: uid,
            totalInvested: 0,
            totalReturns: 0,
            activeInvestments: 0,
            verified: false,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          break;
        }
      }

      // 4. Create wallet
      const walletRef = db.collection('wallets').doc(uid);
      batch.set(walletRef, {
        userId: uid,
        balance: 0,
        currency: 'GNF',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 5. Commit batch
      await batch.commit();

      // 6. Set custom claims
      const claims: any = { role: data.role, verified: false };
      if (roleDocId) {
        claims[`${data.role}Id`] = roleDocId;
      }
      await setUserClaims(uid, claims);

      return {
        success: true,
        uid,
        role: data.role,
        roleDocId,
        message: 'Compte créé avec succès'
      };

    } catch (error: any) {
      console.error('Error creating user:', error);

      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'Cet email est déjà utilisé'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création du compte'
      );
    }
  });
