/**
 * NOTIFICATIONS: Send Order Confirmation
 * Sends SMS (Orange API) + Email (Firebase Trigger Email Extension)
 * after a successful order creation
 */

import * as admin from 'firebase-admin';

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

    await db.collection('mail').add({
      to: email,
      message: {
        subject: `✅ Commande ${order.id} confirmée — GuineeGo`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Commande confirmée !</h2>
            <p>Bonjour <strong>${order.shippingAddress.fullName}</strong>,</p>
            <p>Votre commande <strong>${order.id}</strong> a été créée avec succès.</p>
            
            <h3>📦 Articles</h3>
            <p>${itemsList}</p>
            
            <hr style="border: 1px solid #e5e7eb;" />
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td>Sous-total</td><td style="text-align: right;">${order.pricing.subtotal.toLocaleString()} GNF</td></tr>
              <tr><td>Livraison</td><td style="text-align: right;">${order.pricing.shippingFee.toLocaleString()} GNF</td></tr>
              ${order.pricing.discount > 0 ? `<tr><td>Réduction</td><td style="text-align: right;">-${order.pricing.discount.toLocaleString()} GNF</td></tr>` : ''}
              <tr style="font-weight: bold; font-size: 1.1em;">
                <td>Total</td><td style="text-align: right;">${order.pricing.total.toLocaleString()} GNF</td>
              </tr>
            </table>
            
            <hr style="border: 1px solid #e5e7eb;" />
            
            <p>📍 <strong>Livraison :</strong> ${order.shippingAddress.address}, ${order.shippingAddress.commune}</p>
            <p>💳 <strong>Paiement :</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
            
            <p style="margin-top: 24px; color: #6b7280; font-size: 0.9em;">
              Merci pour votre confiance !<br/>
              L'équipe GuineeGo
            </p>
          </div>
        `,
      },
    });
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
    const smsMessage = 
      `GuineeGo: Commande ${order.id} confirmée! ` +
      `Total: ${order.pricing.total.toLocaleString()} GNF. ` +
      `Livraison à ${order.shippingAddress.commune}. Merci!`;

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
