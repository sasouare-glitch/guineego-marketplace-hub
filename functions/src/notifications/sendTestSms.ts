/**
 * Cloud Function: sendTestSms
 * Sends a test SMS via Orange SMS API using credentials from Firestore config/orange_sms
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface OrangeSmsConfig {
  clientId: string;
  clientSecret: string;
  senderAddress: string;
  senderName: string;
  enabled: boolean;
}

async function getOrangeToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://api.orange.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Orange OAuth failed (${response.status}): ${text}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// Admin emails with bypass (same as client-side)
const ADMIN_EMAILS = ['sasouare@gmail.com'];

export const sendTestSms = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    // Admin check - use email bypass or claims
    const userEmail = context.auth.token.email || '';
    const claims = context.auth.token;
    const isAdmin = ADMIN_EMAILS.includes(userEmail) || 
                   claims.role === 'admin' || 
                   claims.role === 'super_admin';
    
    if (!isAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Accès réservé aux administrateurs');
    }

    const { phoneNumber } = data as { phoneNumber: string };
    if (!phoneNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone requis');
    }

    // Load config
    const configSnap = await db.doc('config/orange_sms').get();
    if (!configSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Configuration Orange SMS introuvable');
    }

    const config = configSnap.data() as OrangeSmsConfig;
    if (!config.clientId || !config.clientSecret) {
      throw new functions.https.HttpsError('failed-precondition', 'Credentials Orange SMS manquants');
    }

    // Format recipient
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const recipientAddress = cleanPhone.startsWith('tel:') 
      ? cleanPhone 
      : cleanPhone.startsWith('+224') 
        ? `tel:${cleanPhone}` 
        : `tel:+224${cleanPhone}`;

    const senderAddress = config.senderAddress || `tel:+224000000000`;

    try {
      // Get OAuth token
      const token = await getOrangeToken(config.clientId, config.clientSecret);

      // Send SMS
      const smsResponse = await fetch(
        `https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(senderAddress)}/requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            outboundSMSMessageRequest: {
              address: recipientAddress,
              senderAddress,
              senderName: config.senderName || 'GuineeGo',
              outboundSMSTextMessage: {
                message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
              },
            },
          }),
        }
      );

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error('Orange SMS API error:', errorText);
        throw new functions.https.HttpsError('internal', `Erreur Orange SMS (${smsResponse.status}): ${errorText}`);
      }

      const result = await smsResponse.json();

      // Log to Firestore
      await db.collection('sms_logs').add({
        type: 'test',
        to: recipientAddress,
        status: 'sent',
        message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
        response: JSON.stringify(result),
        sentBy: context.auth.uid,
        retryCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: `SMS de test envoyé au ${recipientAddress}` };
    } catch (err: any) {
      // Log failure
      await db.collection('sms_logs').add({
        type: 'test',
        to: recipientAddress,
        status: 'failed',
        message: `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`,
        error: err.message || 'Unknown error',
        sentBy: context.auth.uid,
        retryCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError('internal', err.message || 'Erreur inconnue');
    }
  });
