/**
 * Authentication & Authorization Utilities
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// User roles enum
export type UserRole = 'customer' | 'ecommerce' | 'closer' | 'courier' | 'investor' | 'super_user' | 'admin';

export interface UserClaims {
  role: UserRole;
  ecommerceId?: string;
  courierId?: string;
  closerId?: string;
  investorId?: string;
  verified?: boolean;
}

/**
 * Verify user is authenticated
 */
export function verifyAuth(context: functions.https.CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié'
    );
  }
  return context.auth.uid;
}

/**
 * Verify user has required role
 */
export function verifyRole(
  context: functions.https.CallableContext,
  allowedRoles: UserRole[]
): UserClaims {
  const uid = verifyAuth(context);
  const claims = context.auth?.token as UserClaims | undefined;
  
  if (!claims?.role || !allowedRoles.includes(claims.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}`
    );
  }
  
  return claims;
}

/**
 * Verify user is admin
 */
export function verifyAdmin(context: functions.https.CallableContext): void {
  verifyRole(context, ['admin', 'super_user']);
}

/**
 * Verify user is e-commerce seller
 */
export function verifySeller(context: functions.https.CallableContext): UserClaims {
  return verifyRole(context, ['ecommerce', 'admin', 'super_user']);
}

/**
 * Verify user is courier
 */
export function verifyCourier(context: functions.https.CallableContext): UserClaims {
  return verifyRole(context, ['courier', 'admin', 'super_user']);
}

/**
 * Verify user is closer
 */
export function verifyCloser(context: functions.https.CallableContext): UserClaims {
  return verifyRole(context, ['closer', 'admin']);
}

/**
 * Set custom claims for user
 */
export async function setUserClaims(uid: string, claims: Partial<UserClaims>): Promise<void> {
  const currentClaims = (await admin.auth().getUser(uid)).customClaims as UserClaims || {};
  const newClaims: UserClaims = {
    ...currentClaims,
    ...claims,
    role: claims.role || currentClaims.role || 'customer'
  };
  
  await admin.auth().setCustomUserClaims(uid, newClaims);
  
  // Update user document for Firestore queries
  await admin.firestore().collection('users').doc(uid).update({
    role: newClaims.role,
    claims: newClaims,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  try {
    return await admin.auth().getUserByEmail(email);
  } catch {
    return null;
  }
}
