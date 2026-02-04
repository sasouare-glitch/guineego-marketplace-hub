/**
 * AUTH FUNCTION: Get User Claims
 * Return current user's claims and role
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';

const db = admin.firestore();

/**
 * Get authenticated user's claims
 * httpsCallable: getUserClaims
 */
export const getUserClaims = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    const uid = verifyAuth(context);

    try {
      // Get user from Auth
      const userRecord = await admin.auth().getUser(uid);
      const claims = userRecord.customClaims || {};

      // Get user document for additional data
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.data() || {};

      return {
        uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        phoneNumber: userRecord.phoneNumber,
        photoURL: userRecord.photoURL,
        role: claims.role || 'customer',
        claims,
        profile: {
          verified: userData.verified || false,
          status: userData.status || 'active'
        }
      };

    } catch (error) {
      console.error('Error getting claims:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la récupération des informations'
      );
    }
  });
