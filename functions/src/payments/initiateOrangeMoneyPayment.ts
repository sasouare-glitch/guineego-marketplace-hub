/**
 * ORANGE MONEY PAYMENT INITIATION
 * Callable Cloud Function that initiates a payment request via Orange Money API
 * 
 * Flow:
 * 1. Frontend calls this function with plan details + phone number
 * 2. Function calls Orange Money API to request payment (USSD push to user's phone)
 * 3. Returns payment token / status to frontend
 * 4. Orange Money sends webhook callback to confirmSubscriptionPayment when done
 * 
 * Required Firebase Config (set via firebase functions:config:set):
 *   orange_money.client_id
 *   orange_money.client_secret
 *   orange_money.merchant_key
 *   orange_money.api_url  (sandbox: https://api.orange.com)
 *   orange_money.notify_url (your webhook URL for confirmSubscriptionPayment)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface InitiatePaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  phone: string; // e.g. "620000000" or "+224620000000"
  paymentMethod: 'orange_money';
}

interface OrangeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangePaymentResponse {
  status: number;
  message: string;
  pay_token: string;
  payment_url: string;
  notif_token: string;
}

/**
 * Get OAuth2 token from Orange Money API
 */
async function getOrangeAccessToken(clientId: string, clientSecret: string, apiUrl: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${apiUrl}/oauth/v3/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new functions.https.HttpsError('unavailable', `Orange OAuth failed: ${errorText}`);
  }

  const data = (await response.json()) as OrangeTokenResponse;
  return data.access_token;
}

/**
 * Format phone number for Orange Money API (must be tel:+224XXXXXXXXX)
 */
function formatPhone(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+224')) {
    return `tel:${cleaned}`;
  }
  if (cleaned.startsWith('224')) {
    return `tel:+${cleaned}`;
  }
  // Assume Guinea local number
  return `tel:+224${cleaned}`;
}

/**
 * Initiate Orange Money Payment
 * Callable function: initiateOrangeMoneyPayment
 */
export const initiateOrangeMoneyPayment = functions
  .region('europe-west1')
  .https.onCall(async (data: InitiatePaymentRequest, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté.');
    }

    const sellerId = context.auth.uid;
    const { planId, planName, amount, phone } = data;

    // 2. Validate input
    if (!planId || !amount || !phone) {
      throw new functions.https.HttpsError('invalid-argument', 'planId, amount et phone sont requis.');
    }

    if (amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Le montant doit être positif.');
    }

    // 3. Get Orange Money config
    const config = functions.config();
    const omConfig = config.orange_money;

    if (!omConfig?.client_id || !omConfig?.client_secret || !omConfig?.merchant_key) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Orange Money API non configurée. Contactez l\'administrateur.'
      );
    }

    const apiUrl = omConfig.api_url || 'https://api.orange.com';
    const notifyUrl = omConfig.notify_url || '';

    try {
      // 4. Get OAuth token
      const accessToken = await getOrangeAccessToken(omConfig.client_id, omConfig.client_secret, apiUrl);

      // 5. Create pending payment record in Firestore FIRST
      const paymentRef = await db
        .collection('seller_settings')
        .doc(sellerId)
        .collection('subscription_payments')
        .add({
          planId,
          planName,
          amount,
          phone,
          paymentMethod: 'orange_money',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      const orderId = paymentRef.id;

      // 6. Call Orange Money Web Payment API
      const paymentBody = {
        merchant_key: omConfig.merchant_key,
        currency: 'GNF',
        order_id: orderId,
        amount: amount,
        return_url: omConfig.return_url || 'https://guineego.web.app/seller/subscription',
        cancel_url: omConfig.cancel_url || 'https://guineego.web.app/seller/subscription',
        notif_url: notifyUrl, // Webhook callback URL
        lang: 'fr',
        reference: `sub_${sellerId}_${orderId}`,
        // Customer info
        customer: {
          name: context.auth.token.name || 'Vendeur',
          email: context.auth.token.email || '',
          phone: formatPhone(phone),
        },
      };

      const paymentResponse = await fetch(`${apiUrl}/orange-money-webpay/dev/v1/webpayment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(paymentBody),
      });

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        console.error('Orange Money API error:', errorText);

        // Mark payment as failed
        await paymentRef.update({
          status: 'failed',
          failureReason: `API error: ${paymentResponse.status}`,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw new functions.https.HttpsError('unavailable', 'Erreur de l\'API Orange Money. Veuillez réessayer.');
      }

      const paymentResult = (await paymentResponse.json()) as OrangePaymentResponse;

      // 7. Update payment doc with provider tokens
      await paymentRef.update({
        payToken: paymentResult.pay_token,
        notifToken: paymentResult.notif_token,
        paymentUrl: paymentResult.payment_url,
      });

      console.log(`Orange Money payment initiated: ${orderId} for seller ${sellerId}`);

      // 8. Return payment URL to frontend (user redirects to complete payment)
      return {
        success: true,
        paymentId: orderId,
        paymentUrl: paymentResult.payment_url,
        payToken: paymentResult.pay_token,
      };

    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error('Error initiating Orange Money payment:', error);
      throw new functions.https.HttpsError('internal', 'Erreur interne lors de l\'initiation du paiement.');
    }
  });
