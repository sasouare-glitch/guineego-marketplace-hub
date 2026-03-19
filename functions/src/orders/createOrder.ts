/**
 * ORDERS FUNCTION: Create Order
 * Authenticated checkout entry point
 */

import * as functions from 'firebase-functions';
import { verifyAuth } from '../utils/auth';
import { createOrderRecord, type CreateOrderData } from './orderCreation';

/**
 * Create new order with multi-vendor support
 * httpsCallable: createOrder
 */
export const createOrder = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateOrderData, context) => {
    const uid = verifyAuth(context);

    try {
      return await createOrderRecord({
        ...data,
        customerId: uid,
        isGuest: false,
        clearCartUserId: uid,
      });
    } catch (error: any) {
      console.error('Error creating order:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la commande'
      );
    }
  });