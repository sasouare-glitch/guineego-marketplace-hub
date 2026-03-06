/**
 * NOTIFICATIONS: Send Order Confirmation
 * Sends SMS (Orange API) + Email (Firebase Trigger Email Extension)
 * after a successful order creation
 */

import * as admin from 'firebase-admin';
import { wrapInTemplate, ctaButton, infoRow, divider, sectionTitle, APP_URL, COLORS } from '../utils/emailTemplate';
import { sendEmailWithFallback } from '../utils/sendgrid';

const db = admin.firestore();

interface OrderData {
  id: string;
  customerId: string;
  pricing: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    commune: string;
    address: string;
  };
  paymentMethod: string;
}

/**
 * Send order confirmation via Email + SMS
 */
export async function sendOrderConfirmation(order: OrderData): Promise<void> {
  const customerDoc = await db.collection('users').doc(order.customerId).get();
  const customer = customerDoc.data();

  const promises: Promise<void>[] = [];

  // 1. Send Email (via Firebase Trigger Email Extension)
  const email = customer?.email;
  if (email) {
    promises.push(sendConfirmationEmail(email, order));
  }

  // 2. Send SMS (via Orange SMS API)
  const phone = order.shippingAddress.phone;
  if (phone) {
    promises.push(sendConfirmationSMS(phone, order));
  }

  await Promise.allSettled(promises);
}

/**
 * Write to 'mail' collection — Firebase Trigger Email Extension picks it up
 */
async function sendConfirmationEmail(email: string, order: OrderData): Promise<void> {
  try {
    const itemsList = order.items
      .map(item => `• ${item.name} x${item.quantity} — ${item.price.toLocaleString()} GNF`)
      .join('<br>');

    const itemsHtml = order.items
      .map(item => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${COLORS.darkText};">${item.name} <span style="color: ${COLORS.mutedText};">x${item.quantity}</span></td>
          <td style="padding: 8px 0; font-size: 14px; color: ${COLORS.darkText}; text-align: right;">${item.price.toLocaleString()} GNF</td>
        </tr>`)
      .join('');

    const bodyContent = `
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${COLORS.green};">✅ Commande confirmée !</h2>
      <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.bodyText};">
        Bonjour <strong>${order.shippingAddress.fullName}</strong>, votre commande a été créée avec succès.
      </p>

      <div style="background-color: ${COLORS.lightBg}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.mutedText};">Numéro de commande</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: ${COLORS.darkText}; letter-spacing: 0.5px;">${order.id}</p>
      </div>

      ${sectionTitle('📦', 'Articles commandés')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
      </table>

      ${divider()}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${infoRow('Sous-total', `${order.pricing.subtotal.toLocaleString()} GNF`)}
        ${infoRow('Livraison', `${order.pricing.shippingFee.toLocaleString()} GNF`)}
        ${order.pricing.discount > 0 ? infoRow('Réduction', `-${order.pricing.discount.toLocaleString()} GNF`) : ''}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: ${COLORS.darkText};">Total</td>
          <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: ${COLORS.green}; text-align: right;">${order.pricing.total.toLocaleString()} GNF</td>
        </tr>
      </table>

      ${divider()}

      ${sectionTitle('📍', 'Livraison')}
      <p style="margin: 0; font-size: 14px; color: ${COLORS.bodyText};">${order.shippingAddress.address}, ${order.shippingAddress.commune}</p>
      
      <div style="margin-top: 12px;">
        ${sectionTitle('💳', 'Paiement')}
        <p style="margin: 0; font-size: 14px; color: ${COLORS.bodyText};">${formatPaymentMethod(order.paymentMethod)}</p>
      </div>

      ${ctaButton('📍 Suivre ma commande', `${APP_URL}/order/${order.id}`)}
    `;

    const subject = `✅ Commande ${order.id} confirmée — GuineeGo`;
    const html = wrapInTemplate(bodyContent);

    // Dual strategy: Firestore 'mail' collection + SendGrid fallback
    await sendEmailWithFallback({ to: email, subject, html });
    console.log(`✅ Email de confirmation envoyé à ${email} pour commande ${order.id}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email pour commande ${order.id}:`, error);
  }
}

/**
 * Send SMS via Orange SMS API (Guinea)
 */
async function sendConfirmationSMS(phone: string, order: OrderData): Promise<void> {
  try {
    // Get Orange API credentials from Firebase Functions config
    const configDoc = await db.collection('config').doc('orange_sms').get();
    const config = configDoc.data();

    if (!config?.clientId || !config?.clientSecret) {
      console.warn('⚠️ Orange SMS API non configurée — SMS non envoyé');
      return;
    }

    // 1. Get OAuth token
    const tokenResponse = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Format phone number (ensure +224 prefix)
    const formattedPhone = formatGuineaPhone(phone);

    // 3. Send SMS
    const trackingLink = `${APP_URL}/order/${order.id}`;
    const smsMessage = 
      `GuineeGo: Commande ${order.id} confirmée! ` +
      `Total: ${order.pricing.total.toLocaleString()} GNF. ` +
      `Suivi: ${trackingLink}`;

    const senderAddress = config.senderAddress || 'tel:+224000000000';
    const encodedSender = encodeURIComponent(senderAddress);

    const smsResponse = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: `tel:${formattedPhone}`,
            senderAddress,
            outboundSMSTextMessage: {
              message: smsMessage,
            },
          },
        }),
      }
    );

    if (!smsResponse.ok) {
      const errorBody = await smsResponse.text();
      throw new Error(`SMS send failed [${smsResponse.status}]: ${errorBody}`);
    }

    console.log(`✅ SMS de confirmation envoyé à ${formattedPhone} pour commande ${order.id}`);
  } catch (error) {
    console.error(`❌ Erreur envoi SMS pour commande ${order.id}:`, error);
  }
}

/**
 * Format phone number for Guinea (+224)
 */
function formatGuineaPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+224')) return cleaned;
  if (cleaned.startsWith('224')) return `+${cleaned}`;
  if (cleaned.startsWith('6') || cleaned.startsWith('3')) return `+224${cleaned}`;
  return `+224${cleaned}`;
}

/**
 * Human-readable payment method
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    'orange_money': 'Orange Money',
    'mtn_money': 'MTN Mobile Money',
    'card': 'Carte bancaire',
    'wallet': 'Portefeuille GuineeGo',
    'cash': 'Paiement à la livraison',
  };
  return methods[method] || method;
}
