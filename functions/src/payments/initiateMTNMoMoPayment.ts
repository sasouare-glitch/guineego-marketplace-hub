/**
 * MTN MOMO PAYMENT INITIATION
 * Callable Cloud Function that initiates a payment request via MTN MoMo API (Collections)
 *
 * Flow:
 * 1. Frontend calls this function with plan details + phone number
 * 2. Function calls MTN MoMo RequestToPay API (USSD push to user's phone)
 * 3. Returns referenceId to frontend for status polling
 * 4. MTN sends callback to confirmSubscriptionPayment OR we poll status
 *
 * Required Firebase Config (set via firebase functions:config:set):
 *   mtn_momo.subscription_key       (Ocp-Apim-Subscription-Key)
 *   mtn_momo.api_user               (X-Reference-Id used to create API user)
 *   mtn_momo.api_key                (API Key generated for the user)
 *   mtn_momo.api_url                (sandbox: https://sandbox.momodeveloper.mtn.com)
 *   mtn_momo.environment            ("sandbox" or "production")
 *   mtn_momo.callback_url           (webhook URL for confirmSubscriptionPayment)
 *   mtn_momo.currency               ("GNF" — default)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

interface InitiateMTNPaymentRequest {
  planId: string;
  planName: string;
  amount: number;
  phone: string; // e.g. "660000000" or "+224660000000"
}

/**
 * Get OAuth2 token from MTN MoMo API (Basic Auth with apiUser:apiKey)
 */
async function getMTNAccessToken(
  apiUser: string,
  apiKey: string,
  apiUrl: string,
  subscriptionKey: string
): Promise<string> {
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

  const response = await fetch(`${apiUrl}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new functions.https.HttpsError('unavailable', `MTN OAuth failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Format phone to MSISDN (international without +): 224XXXXXXXXX
 */
function formatMSISDN(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.startsWith('224')) return cleaned;
  if (cleaned.startsWith('00224')) return cleaned.slice(2);
  // Assume Guinea local number
  return `224${cleaned}`;
}

/**
 * Initiate MTN MoMo RequestToPay
 * Callable function: initiateMTNMoMoPayment
 */
export const initiateMTNMoMoPayment = functions
  .region('europe-west1')
  .https.onCall(async (data: InitiateMTNPaymentRequest, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté.');
    }

    const sellerId = context.auth.uid;
    const { planId, planName, amount, phone } = data;

    // 2. Validate
    if (!planId || !amount || !phone) {
      throw new functions.https.HttpsError('invalid-argument', 'planId, amount et phone sont requis.');
    }
    if (amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Le montant doit être positif.');
    }

    // 3. Get MTN config
    const config = functions.config();
    const mtn = config.mtn_momo;

    if (!mtn?.subscription_key || !mtn?.api_user || !mtn?.api_key) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'MTN MoMo API non configurée. Contactez l\'administrateur.'
      );
    }

    const apiUrl = mtn.api_url || 'https://sandbox.momodeveloper.mtn.com';
    const environment = mtn.environment || 'sandbox';
    const callbackUrl = mtn.callback_url || '';
    const currency = mtn.currency || 'GNF';

    try {
      // 4. Get access token
      const accessToken = await getMTNAccessToken(mtn.api_user, mtn.api_key, apiUrl, mtn.subscription_key);

      // 5. Create pending payment in Firestore
      const paymentRef = await db
        .collection('seller_settings')
        .doc(sellerId)
        .collection('subscription_payments')
        .add({
          planId,
          planName,
          amount,
          phone,
          paymentMethod: 'mtn_money',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      const paymentDocId = paymentRef.id;
      const referenceId = uuidv4(); // MTN requires a UUID for each request

      // 6. Call MTN MoMo RequestToPay
      const requestBody = {
        amount: String(amount),
        currency,
        externalId: paymentDocId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: formatMSISDN(phone),
        },
        payerMessage: `Abonnement ${planName} - GuineeGo`,
        payeeNote: `sub_${sellerId}_${paymentDocId}`,
      };

      const payResponse = await fetch(`${apiUrl}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': environment,
          'Ocp-Apim-Subscription-Key': mtn.subscription_key,
          'Content-Type': 'application/json',
          ...(callbackUrl ? { 'X-Callback-Url': callbackUrl } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      if (!payResponse.ok) {
        const errorText = await payResponse.text();
        console.error('MTN MoMo API error:', errorText);

        await paymentRef.update({
          status: 'failed',
          failureReason: `API error: ${payResponse.status}`,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        throw new functions.https.HttpsError('unavailable', 'Erreur de l\'API MTN MoMo. Veuillez réessayer.');
      }

      // MTN returns 202 Accepted (async processing)
      // Store the referenceId to check status later
      await paymentRef.update({
        mtnReferenceId: referenceId,
      });

      console.log(`MTN MoMo RequestToPay initiated: ${referenceId} for seller ${sellerId}`);

      // 7. Optionally poll for status immediately (sandbox responds fast)
      // In production, rely on the callback instead
      if (environment === 'sandbox') {
        // Wait a moment for sandbox to process
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(`${apiUrl}/collection/v1_0/requesttopay/${referenceId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': environment,
            'Ocp-Apim-Subscription-Key': mtn.subscription_key,
          },
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('MTN MoMo sandbox status:', statusData);

          if (statusData.status === 'SUCCESSFUL') {
            // Auto-confirm in sandbox
            await paymentRef.update({
              status: 'completed',
              providerTransactionId: statusData.financialTransactionId || referenceId,
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Activate plan
            const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await db.collection('seller_settings').doc(sellerId).update({
              subscription: {
                planId,
                planName,
                subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt,
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
              success: true,
              paymentId: paymentDocId,
              referenceId,
              status: 'SUCCESSFUL',
              autoConfirmed: true,
            };
          } else if (statusData.status === 'FAILED') {
            await paymentRef.update({
              status: 'failed',
              failureReason: statusData.reason || 'Paiement MTN échoué',
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
              success: false,
              paymentId: paymentDocId,
              referenceId,
              status: 'FAILED',
              reason: statusData.reason,
            };
          }
        }
      }

      // Return pending — will be confirmed via callback
      return {
        success: true,
        paymentId: paymentDocId,
        referenceId,
        status: 'PENDING',
        autoConfirmed: false,
      };

    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) throw error;
      console.error('Error initiating MTN MoMo payment:', error);
      throw new functions.https.HttpsError('internal', 'Erreur interne lors de l\'initiation du paiement.');
    }
  });

/**
 * Check MTN MoMo payment status (polling fallback)
 * Callable function: checkMTNPaymentStatus
 */
export const checkMTNPaymentStatus = functions
  .region('europe-west1')
  .https.onCall(async (data: { paymentId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté.');
    }

    const sellerId = context.auth.uid;
    const { paymentId } = data;

    if (!paymentId) {
      throw new functions.https.HttpsError('invalid-argument', 'paymentId requis.');
    }

    // Get payment doc
    const paymentSnap = await db
      .collection('seller_settings')
      .doc(sellerId)
      .collection('subscription_payments')
      .doc(paymentId)
      .get();

    if (!paymentSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Paiement introuvable.');
    }

    const paymentData = paymentSnap.data()!;

    // Already resolved
    if (paymentData.status !== 'pending') {
      return { status: paymentData.status, planId: paymentData.planId };
    }

    const referenceId = paymentData.mtnReferenceId;
    if (!referenceId) {
      return { status: 'pending' };
    }

    // Poll MTN API
    const config = functions.config();
    const mtn = config.mtn_momo;
    const apiUrl = mtn.api_url || 'https://sandbox.momodeveloper.mtn.com';
    const environment = mtn.environment || 'sandbox';

    const accessToken = await getMTNAccessToken(mtn.api_user, mtn.api_key, apiUrl, mtn.subscription_key);

    const statusResponse = await fetch(`${apiUrl}/collection/v1_0/requesttopay/${referenceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Target-Environment': environment,
        'Ocp-Apim-Subscription-Key': mtn.subscription_key,
      },
    });

    if (!statusResponse.ok) {
      return { status: 'pending' };
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'SUCCESSFUL') {
      await paymentSnap.ref.update({
        status: 'completed',
        providerTransactionId: statusData.financialTransactionId || referenceId,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.collection('seller_settings').doc(sellerId).update({
        subscription: {
          planId: paymentData.planId,
          planName: paymentData.planName,
          subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { status: 'completed', planId: paymentData.planId };
    } else if (statusData.status === 'FAILED') {
      await paymentSnap.ref.update({
        status: 'failed',
        failureReason: statusData.reason || 'Paiement MTN échoué',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { status: 'failed', reason: statusData.reason };
    }

    return { status: 'pending' };
  });
