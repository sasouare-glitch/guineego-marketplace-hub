import * as functions from 'firebase-functions';
import {
  assertGuestCheckoutAllowed,
  createOrderRecord,
  type CreateOrderData,
  type PaymentMethod,
} from './orderCreation';

function isValidGuineaPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 8 || digits.length === 11 || digits.length === 12;
}

function generateGuestCustomerId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const createGuestOrder = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateOrderData) => {
    try {
      if (!data?.shippingAddress?.fullName?.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Le nom complet est requis');
      }

      if (!data?.shippingAddress?.phone || !isValidGuineaPhone(data.shippingAddress.phone)) {
        throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone invalide');
      }

      assertGuestCheckoutAllowed(data.paymentMethod as PaymentMethod);

      return await createOrderRecord({
        ...data,
        customerId: generateGuestCustomerId(),
        isGuest: true,
      });
    } catch (error: any) {
      console.error('Error creating guest order:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la création de la commande invitée'
      );
    }
  });
