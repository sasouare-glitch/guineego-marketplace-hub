/**
 * AUTH FUNCTION: Bootstrap Admin
 * One-time function to set admin role on a user by email
 * This is an HTTPS function (not callable) for easy use
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { setUserClaims } from '../utils/auth';

const db = admin.firestore();

/**
 * Bootstrap admin user by email
 * HTTP endpoint: POST /bootstrapAdmin
 * Body: { email: string, secretKey: string }
 * 
 * IMPORTANT: Delete this function after first admin is created
 */
export const bootstrapAdmin = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // Only POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, secretKey } = req.body;

    // Simple secret to prevent unauthorized access
    // Change this before deploying!
    const BOOTSTRAP_SECRET = 'guineego-admin-setup-2024';

    if (secretKey !== BOOTSTRAP_SECRET) {
      res.status(403).json({ error: 'Invalid secret key' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    try {
      // Find user by email
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;

      // Set admin custom claims
      await setUserClaims(uid, { role: 'admin' });

      // Update or create user document
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        await userRef.update({
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userRef.set({
          uid,
          email,
          displayName: userRecord.displayName || email,
          phone: userRecord.phoneNumber || null,
          role: 'admin',
          status: 'active',
          verified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // Log the action
      await db.collection('audit_logs').add({
        action: 'admin_bootstrapped',
        targetUserId: uid,
        targetEmail: email,
        performedBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({
        success: true,
        message: `Admin role assigned to ${email}`,
        uid
      });

    } catch (error: any) {
      console.error('Bootstrap admin error:', error);

      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ 
          error: `User with email ${email} not found. Please register first.` 
        });
        return;
      }

      res.status(500).json({ error: 'Internal error', details: error.message });
    }
  });
