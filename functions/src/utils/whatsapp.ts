/**
 * WhatsApp Business API via Twilio
 * Fallback channel when Orange SMS fails
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Format: whatsapp:+14155238886
  enabled: boolean;
}

interface WhatsAppMessage {
  to: string;          // Guinea phone number (will be formatted)
  body: string;
  orderId: string;
  type: string;        // e.g. 'status_confirmed'
}

/**
 * Send a WhatsApp message via Twilio API
 * Returns true if sent successfully, false otherwise
 */
export async function sendWhatsApp(message: WhatsAppMessage): Promise<boolean> {
  const logRef = db.collection('whatsapp_logs').doc();
  const logBase = {
    type: message.type,
    to: message.to,
    body: message.body,
    orderId: message.orderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const config = await getTwilioConfig();
    if (!config) {
      await logRef.set({ ...logBase, status: 'failed', error: 'Twilio WhatsApp non configuré' });
      console.warn('⚠️ Twilio WhatsApp non configuré — fallback ignoré');
      return false;
    }

    if (!config.enabled) {
      await logRef.set({ ...logBase, status: 'skipped', error: 'WhatsApp désactivé' });
      return false;
    }

    const formattedTo = formatWhatsAppNumber(message.to);
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
        Body: message.body,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      await logRef.set({
        ...logBase,
        to: formattedTo,
        status: 'failed',
        error: `Twilio [${response.status}]: ${data.message || JSON.stringify(data)}`,
      });
      console.error(`❌ WhatsApp échoué [${response.status}]:`, data);
      return false;
    }

    await logRef.set({
      ...logBase,
      to: formattedTo,
      status: 'sent',
      messageSid: data.sid,
    });
    console.log(`✅ WhatsApp envoyé à ${formattedTo} (SID: ${data.sid})`);
    return true;
  } catch (error: any) {
    const existingLog = await logRef.get();
    if (!existingLog.exists) {
      await logRef.set({ ...logBase, status: 'failed', error: error?.message || String(error) });
    }
    console.error('❌ Erreur envoi WhatsApp:', error);
    return false;
  }
}

/**
 * Get Twilio config from Firestore
 */
async function getTwilioConfig(): Promise<WhatsAppConfig | null> {
  try {
    const doc = await db.collection('config').doc('twilio_whatsapp').get();
    const data = doc.data();
    if (!data?.accountSid || !data?.authToken || !data?.fromNumber) {
      return null;
    }
    return {
      accountSid: data.accountSid,
      authToken: data.authToken,
      fromNumber: data.fromNumber,
      enabled: data.enabled !== false,
    };
  } catch {
    return null;
  }
}

/**
 * Format phone number for WhatsApp (whatsapp:+224XXXXXXXXX)
 */
function formatWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
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
  return `whatsapp:${normalized}`;
}
