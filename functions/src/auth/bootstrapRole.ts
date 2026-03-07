/**
 * AUTH FUNCTION: Bootstrap Role
 * Assign any valid role to a user by email (secured by secret key)
 * HTTP endpoint: POST /bootstrapRole
 * Body: { email: string, role: string, secretKey: string }
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { setUserClaims, UserRole } from '../utils/auth';

const db = admin.firestore();

const BOOTSTRAP_SECRET = 'guineego-admin-setup-2024';
const VALID_ROLES: UserRole[] = ['customer', 'ecommerce', 'courier', 'closer', 'investor', 'admin'];

export const bootstrapRole = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { email, role, secretKey } = req.body;

    if (secretKey !== BOOTSTRAP_SECRET) {
      res.status(403).json({ error: 'Invalid secret key' });
      return;
    }

    if (!email || !role) {
      res.status(400).json({ error: 'email and role are required' });
      return;
    }

    if (!VALID_ROLES.includes(role as UserRole)) {
      res.status(400).json({ error: `Invalid role. Valid: ${VALID_ROLES.join(', ')}` });
      return;
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;

      await setUserClaims(uid, { role: role as UserRole });

      // Ensure user doc exists
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        await userRef.update({
          role,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userRef.set({
          uid,
          email,
          displayName: userRecord.displayName || email,
          role,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // For courier role, ensure couriers doc exists
      if (role === 'courier') {
        const courierRef = db.collection('couriers').doc(uid);
        const courierDoc = await courierRef.get();
        if (!courierDoc.exists) {
          await courierRef.set({
            userId: uid,
            email,
            displayName: userRecord.displayName || email,
            status: 'active',
            isOnline: false,
            vehicleType: 'moto',
            zones: [],
            totalDeliveries: 0,
            rating: 5.0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      await db.collection('audit_logs').add({
        action: 'role_bootstrapped',
        targetUserId: uid,
        targetEmail: email,
        newRole: role,
        performedBy: 'system',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({
        success: true,
        message: `Role '${role}' assigned to ${email}`,
        uid
      });

    } catch (error: any) {
      console.error('Bootstrap role error:', error);
      if (error.code === 'auth/user-not-found') {
        res.status(404).json({ error: `User ${email} not found. Register first.` });
        return;
      }
      res.status(500).json({ error: 'Internal error', details: error.message });
    }
  });
