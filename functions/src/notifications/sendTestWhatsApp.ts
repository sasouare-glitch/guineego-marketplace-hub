/**
 * Cloud Function: sendTestWhatsApp
 * Sends a test WhatsApp message via Twilio using credentials from Firestore config/twilio_whatsapp
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const ADMIN_EMAILS = ['sasouare@gmail.com'];

export const sendTestWhatsApp = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

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

    // Load Twilio config
    const configSnap = await db.doc('config/twilio_whatsapp').get();
    if (!configSnap.exists) {
      throw new functions.https.HttpsError('failed-precondition', 'Configuration Twilio WhatsApp introuvable');
    }

    const config = configSnap.data()!;
    if (!config.accountSid || !config.authToken || !config.fromNumber) {
      throw new functions.https.HttpsError('failed-precondition', 'Credentials Twilio WhatsApp incomplets');
    }

    // Format recipient
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    let normalized: string;
    if (cleaned.startsWith('+224')) {
      normalized = cleaned;
    } else if (cleaned.startsWith('224')) {
      normalized = `+${cleaned}`;
    } else if (cleaned.startsWith('6') || cleaned.startsWith('3')) {
      normalized = `+224${cleaned}`;
    } else {
      normalized = `+224${cleaned}`;
    }
    const formattedTo = `whatsapp:${normalized}`;

    const testMessage = `[GuineeGo] ✅ Ceci est un message WhatsApp de test. Votre configuration Twilio fonctionne correctement !`;

    const logRef = db.collection('whatsapp_logs').doc();

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: config.fromNumber,
          Body: testMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        await logRef.set({
          type: 'test',
          to: formattedTo,
          body: testMessage,
          status: 'failed',
          error: `Twilio [${response.status}]: ${result.message || JSON.stringify(result)}`,
          sentBy: context.auth.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError('internal', `Erreur Twilio (${response.status}): ${result.message || 'Erreur inconnue'}`);
      }

      await logRef.set({
        type: 'test',
        to: formattedTo,
        body: testMessage,
        status: 'sent',
        messageSid: result.sid,
        sentBy: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: `WhatsApp de test envoyé au ${formattedTo}` };
    } catch (err: any) {
      const existing = await logRef.get();
      if (!existing.exists) {
        await logRef.set({
          type: 'test',
          to: formattedTo,
          body: testMessage,
          status: 'failed',
          error: err?.message || String(err),
          sentBy: context.auth.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      if (err instanceof functions.https.HttpsError) throw err;
      throw new functions.https.HttpsError('internal', err.message || 'Erreur inconnue');
    }
  });
