/**
 * SendGrid Direct Email Sender
 * Fallback when Firebase "Trigger Email" extension is not active.
 * 
 * Configuration: Store your SendGrid API key in Firestore:
 *   collection: config / document: sendgrid
 *   fields: { apiKey: "SG.xxxxx", fromEmail: "noreply@guineego.app", fromName: "GuineeGo" }
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

let cachedConfig: SendGridConfig | null = null;
let configExpiry = 0;

/**
 * Get SendGrid config from Firestore (cached 5 min)
 */
async function getConfig(): Promise<SendGridConfig | null> {
  if (cachedConfig && Date.now() < configExpiry) return cachedConfig;

  try {
    const doc = await db.collection('config').doc('sendgrid').get();
    const data = doc.data();
    if (!data?.apiKey) {
      console.warn('⚠️ SendGrid non configuré — document config/sendgrid manquant ou sans apiKey');
      return null;
    }
    cachedConfig = {
      apiKey: data.apiKey,
      fromEmail: data.fromEmail || 'noreply@guineego.app',
      fromName: data.fromName || 'GuineeGo',
    };
    configExpiry = Date.now() + 5 * 60 * 1000;
    return cachedConfig;
  } catch (error) {
    console.error('❌ Erreur lecture config SendGrid:', error);
    return null;
  }
}

/**
 * Send an email directly via SendGrid API v3
 * Returns true on success, false on failure
 */
export async function sendEmailViaSendGrid(params: SendEmailParams): Promise<boolean> {
  const config = await getConfig();
  if (!config) return false;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: config.fromEmail, name: config.fromName },
        subject: params.subject,
        content: [{ type: 'text/html', value: params.html }],
      }),
    });

    if (response.status === 202 || response.status === 200) {
      console.log(`✅ [SendGrid] Email envoyé à ${params.to}: "${params.subject}"`);
      return true;
    }

    const errorBody = await response.text();
    console.error(`❌ [SendGrid] Erreur ${response.status}: ${errorBody}`);
    return false;
  } catch (error) {
    console.error('❌ [SendGrid] Erreur envoi:', error);
    return false;
  }
}

/**
 * Send email with dual strategy:
 * 1. Write to Firestore 'mail' collection (for Trigger Email extension)
 * 2. If extension not configured or as extra fallback, send via SendGrid directly
 * 
 * @param useSendGridFallback - if true, also sends via SendGrid as fallback
 */
export async function sendEmailWithFallback(
  params: SendEmailParams,
  useSendGridFallback: boolean = true
): Promise<void> {
  // Strategy 1: Write to 'mail' collection for Firebase extension
  try {
    await db.collection('mail').add({
      to: params.to,
      message: {
        subject: params.subject,
        html: params.html,
      },
    });
    console.log(`✅ [mail] Document ajouté pour ${params.to}`);
  } catch (error) {
    console.error(`❌ [mail] Erreur écriture collection mail:`, error);
  }

  // Strategy 2: SendGrid direct fallback
  if (useSendGridFallback) {
    await sendEmailViaSendGrid(params);
  }
}
