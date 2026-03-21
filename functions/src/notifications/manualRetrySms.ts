import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const fetch = require('node-fetch') as typeof import('node-fetch').default;

const db = admin.firestore();

async function getOrangeToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.orange.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error('OAuth token error');
  return data.access_token;
}

// Admin emails with bypass (same as client-side)
const ADMIN_EMAILS = ['sasouare@gmail.com'];

export const manualRetrySms = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Non authentifié');

  // Admin check - use email bypass or claims
  const userEmail = context.auth.token.email || '';
  const claims = context.auth.token;
  const isAdmin = ADMIN_EMAILS.includes(userEmail) || 
                 claims.role === 'admin' || 
                 claims.role === 'super_admin';
  
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin requis');
  }

  const { logId } = data;
  if (!logId) throw new functions.https.HttpsError('invalid-argument', 'logId requis');

  const logRef = db.collection('sms_logs').doc(logId);
  const logSnap = await logRef.get();
  if (!logSnap.exists) throw new functions.https.HttpsError('not-found', 'Log SMS introuvable');

  const logData = logSnap.data()!;
  if (logData.status === 'sent') {
    throw new functions.https.HttpsError('already-exists', 'Ce SMS a déjà été envoyé');
  }

  // Get Orange SMS config
  const configSnap = await db.collection('config').doc('orange_sms').get();
  if (!configSnap.exists) throw new functions.https.HttpsError('failed-precondition', 'Config Orange SMS manquante');
  const config = configSnap.data()!;

  try {
    const token = await getOrangeToken(config.clientId, config.clientSecret);
    const senderAddress = config.senderAddress || 'tel:+224000000';
    const encodedSender = encodeURIComponent(senderAddress);

    const smsRes = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: [`tel:${logData.to}`],
            senderAddress,
            outboundSMSTextMessage: { message: logData.message || 'Retry SMS' },
          },
        }),
      }
    );

    const smsData = await smsRes.json() as any;

    if (smsRes.ok) {
      await logRef.update({
        status: 'sent',
        retryCount: (logData.retryCount || 0) + 1,
        lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
        manualRetry: true,
        response: JSON.stringify(smsData),
      });
      return { success: true, message: 'SMS renvoyé avec succès' };
    } else {
      await logRef.update({
        retryCount: (logData.retryCount || 0) + 1,
        lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
        lastRetryError: JSON.stringify(smsData),
        manualRetry: true,
      });
      throw new functions.https.HttpsError('internal', `Échec: ${JSON.stringify(smsData)}`);
    }
  } catch (err: any) {
    if (err instanceof functions.https.HttpsError) throw err;
    await logRef.update({
      retryCount: (logData.retryCount || 0) + 1,
      lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
      lastRetryError: err.message,
      manualRetry: true,
    });
    throw new functions.https.HttpsError('internal', err.message);
  }
});
