/**
 * Cloud Function: retrySmsScheduled
 * Runs every 5 minutes via Firebase Scheduled Functions (pub/sub).
 * Queries sms_logs for failed SMS (retryCount < 3, last attempt > 5 min ago),
 * re-sends them via Orange SMS API, and updates the log document.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const MAX_RETRIES = 3;

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
    throw new Error(`Orange OAuth failed (${response.status})`);
  }
  const data = await response.json() as { access_token: string };
  return data.access_token;
}

async function sendSms(
  token: string,
  senderAddress: string,
  senderName: string,
  recipientAddress: string,
  message: string
): Promise<{ ok: boolean; body: string }> {
  const response = await fetch(
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
          senderName,
          outboundSMSTextMessage: { message },
        },
      }),
    }
  );
  const body = await response.text();
  return { ok: response.ok, body };
}

export const retrySmsScheduled = functions
  .region('europe-west1')
  .pubsub.schedule('every 5 minutes')
  .timeZone('Africa/Conakry')
  .onRun(async () => {
    // Load SMS config
    const configSnap = await db.doc('config/orange_sms').get();
    if (!configSnap.exists) {
      console.log('No Orange SMS config found, skipping retry.');
      return null;
    }
    const config = configSnap.data() as OrangeSmsConfig;
    if (!config.enabled || !config.clientId || !config.clientSecret) {
      console.log('Orange SMS disabled or not configured, skipping retry.');
      return null;
    }

    // Find failed SMS eligible for retry
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const failedSnap = await db.collection('sms_logs')
      .where('status', '==', 'failed')
      .where('retryCount', '<', MAX_RETRIES)
      .limit(20)
      .get();

    if (failedSnap.empty) {
      console.log('No failed SMS to retry.');
      return null;
    }

    // Filter: only retry if last attempt was > 5 min ago
    const eligible = failedSnap.docs.filter(doc => {
      const data = doc.data();
      const lastAttempt = data.lastRetryAt?.toDate?.() || data.createdAt?.toDate?.();
      return !lastAttempt || lastAttempt < fiveMinAgo;
    });

    if (eligible.length === 0) {
      console.log('No SMS eligible for retry yet (cooldown).');
      return null;
    }

    let token: string;
    try {
      token = await getOrangeToken(config.clientId, config.clientSecret);
    } catch (err: any) {
      console.error('Failed to get Orange token for retry:', err.message);
      return null;
    }

    const senderAddress = config.senderAddress || 'tel:+224000000000';
    const senderName = config.senderName || 'GuineeGo';

    let successCount = 0;
    let failCount = 0;

    for (const doc of eligible) {
      const data = doc.data();
      const retryCount = (data.retryCount || 0) + 1;
      const message = data.message || `[GuineeGo] Ceci est un SMS de test. Votre configuration Orange SMS fonctionne correctement ! ✅`;

      try {
        const result = await sendSms(token, senderAddress, senderName, data.to, message);

        if (result.ok) {
          await doc.ref.update({
            status: 'sent',
            retryCount,
            lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            retryResponse: result.body,
            retriedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          successCount++;
        } else {
          const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';
          await doc.ref.update({
            retryCount,
            lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
            lastRetryError: result.body,
            status: newStatus,
          });
          if (newStatus === 'permanently_failed') {
            await createAdminNotification(data.to, doc.id);
          }
          failCount++;
        }
      } catch (err: any) {
        const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed';
        await doc.ref.update({
          retryCount,
          lastRetryAt: admin.firestore.FieldValue.serverTimestamp(),
          lastRetryError: err.message || 'Unknown error',
          status: newStatus,
        });
        if (newStatus === 'permanently_failed') {
          await createAdminNotification(data.to, doc.id);
        }
        failCount++;
      }
    }

    console.log(`SMS retry complete: ${successCount} sent, ${failCount} failed out of ${eligible.length} attempts.`);
    return null;
  });
