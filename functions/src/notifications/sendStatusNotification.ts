/**
 * NOTIFICATIONS: Send Order Status Change Notification
 * Sends SMS (Orange API) + Email (Firebase Trigger Email Extension)
 * when an order status changes (confirmed, in_delivery, delivered)
 */

import * as admin from 'firebase-admin';
import { wrapInTemplate, ctaButton, APP_URL, COLORS } from '../utils/emailTemplate';
import { sendEmailWithFallback } from '../utils/sendgrid';
import { sendWhatsApp } from '../utils/whatsapp';

const db = admin.firestore();

type NotifiableStatus = 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'in_delivery' | 'delivered' | 'cancelled';

interface StatusNotificationData {
  orderId: string;
  customerId: string;
  status: NotifiableStatus;
  customerName?: string;
  commune?: string;
  total?: number;
  phone?: string;
}

const statusMessages: Record<NotifiableStatus, { emoji: string; title: string; body: string; sms: string }> = {
  confirmed: {
    emoji: '✅',
    title: 'Commande confirmée',
    body: 'Votre commande a été confirmée par le vendeur et est en cours de préparation.',
    sms: 'Commande confirmée! Le vendeur prépare votre colis.',
  },
  preparing: {
    emoji: '📦',
    title: 'Commande en préparation',
    body: 'Votre commande est en cours de préparation par le vendeur.',
    sms: 'Votre commande est en cours de préparation.',
  },
  ready: {
    emoji: '🏪',
    title: 'Commande prête',
    body: 'Votre commande est prête et en attente d\'un coursier pour la livraison.',
    sms: 'Votre commande est prête! Un coursier sera assigné sous peu.',
  },
  shipped: {
    emoji: '🚚',
    title: 'Commande expédiée',
    body: 'Votre commande a été confiée à un coursier.',
    sms: 'Votre commande a été expédiée!',
  },
  in_delivery: {
    emoji: '🛵',
    title: 'Commande en livraison',
    body: 'Votre coursier est en route ! Votre commande arrive bientôt.',
    sms: 'Votre coursier est en route! Livraison imminente.',
  },
  delivered: {
    emoji: '🎉',
    title: 'Commande livrée',
    body: 'Votre commande a été livrée avec succès. Merci pour votre confiance !',
    sms: 'Commande livrée avec succès! Merci pour votre confiance.',
  },
  cancelled: {
    emoji: '❌',
    title: 'Commande annulée',
    body: 'Votre commande a été annulée. Contactez-nous pour plus d\'informations.',
    sms: 'Votre commande a été annulée.',
  },
};

/**
 * Send status change notification via Email + SMS
 */
export async function sendStatusNotification(data: StatusNotificationData): Promise<void> {
  const { orderId, customerId, status } = data;
  const msgConfig = statusMessages[status];
  if (!msgConfig) return;

  const customerDoc = await db.collection('users').doc(customerId).get();
  const customer = customerDoc.data();
  if (!customer) return;

  const customerName = data.customerName || customer.displayName || 'Client';
  const promises: Promise<void>[] = [];

  // 1. Email
  if (customer.email) {
    promises.push(sendStatusEmail(customer.email, orderId, status, msgConfig, customerName));
  }

  // 2. SMS — priorité: phone passé en paramètre > shippingAddress > profil utilisateur
  const phone = data.phone || customer.phone || customer.phoneNumber;
  if (phone) {
    promises.push(sendStatusSMS(phone, orderId, status, msgConfig));
  } else {
    console.warn(`⚠️ Pas de numéro de téléphone trouvé pour le client ${customerId} — SMS non envoyé`);
  }

  await Promise.allSettled(promises);
}

async function sendStatusEmail(
  email: string,
  orderId: string,
  status: string,
  msg: { emoji: string; title: string; body: string },
  customerName: string
): Promise<void> {
  try {
    const statusColor = status === 'cancelled' ? COLORS.red : status === 'delivered' ? COLORS.green : COLORS.green;
    const buttonLabel = status === 'delivered' ? '⭐ Laisser un avis' : '📍 Suivre ma commande';

    const bodyContent = `
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${statusColor};">${msg.emoji} ${msg.title}</h2>
      <p style="margin: 0 0 20px; font-size: 15px; color: ${COLORS.bodyText};">
        Bonjour <strong>${customerName}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: ${COLORS.bodyText};">${msg.body}</p>

      <div style="background-color: ${COLORS.lightBg}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: ${COLORS.mutedText};">Numéro de commande</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: ${COLORS.darkText}; letter-spacing: 0.5px;">${orderId}</p>
      </div>

      ${ctaButton(buttonLabel, `${APP_URL}/order/${orderId}`, statusColor)}
    `;

    const subject = `${msg.emoji} ${msg.title} — Commande ${orderId}`;
    const html = wrapInTemplate(bodyContent);

    // Dual strategy: Firestore 'mail' collection + SendGrid fallback
    await sendEmailWithFallback({ to: email, subject, html });
    console.log(`✅ Email statut "${status}" envoyé à ${email} pour commande ${orderId}`);
  } catch (error) {
    console.error(`❌ Erreur envoi email statut pour commande ${orderId}:`, error);
  }
}

async function sendStatusSMS(
  phone: string,
  orderId: string,
  status: string,
  msg: { sms: string }
): Promise<void> {
  const formattedPhone = formatGuineaPhone(phone);
  const smsMessage = `GuineeGo: ${msg.sms} Commande ${orderId}. Suivi: ${APP_URL}/order/${orderId}`;
  const logRef = db.collection('sms_logs').doc();
  const logBase = {
    type: `status_${status}`,
    to: formattedPhone,
    message: smsMessage,
    orderId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  let smsSent = false;

  try {
    const configDoc = await db.collection('config').doc('orange_sms').get();
    const config = configDoc.data();

    if (!config?.clientId || !config?.clientSecret) {
      await logRef.set({ ...logBase, status: 'failed', error: 'Orange SMS API non configurée' });
    } else if (!config?.enabled) {
      await logRef.set({ ...logBase, status: 'failed', error: 'SMS désactivé' });
    } else {
      let access_token: string;
      try {
        access_token = await getOrangeToken(config.clientId, config.clientSecret);
      } catch (tokenErr: any) {
        await logRef.set({ ...logBase, status: 'failed', error: `Token OAuth échoué: ${tokenErr.message}` });
        access_token = '';
      }

      if (!access_token) {
        // Already logged above
      } else {
        const senderAddress = config.senderAddress || 'tel:+224000000000';
        const encodedSender = encodeURIComponent(senderAddress);

        const smsResponse = await fetch(
          `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              outboundSMSMessageRequest: {
                address: `tel:${formattedPhone}`,
                senderAddress,
                outboundSMSTextMessage: { message: smsMessage },
              },
            }),
          }
        );

        if (!smsResponse.ok) {
          const errorBody = await smsResponse.text();
          await logRef.set({ ...logBase, status: 'failed', error: `SMS échoué [${smsResponse.status}]: ${errorBody}` });
        } else {
          const responseBody = await smsResponse.text();
          await logRef.set({ ...logBase, status: 'sent', response: responseBody });
          console.log(`✅ SMS statut "${status}" envoyé à ${formattedPhone} pour commande ${orderId}`);
          smsSent = true;
        }
      }
    }
  } catch (error: any) {
    const existingLog = await logRef.get();
    if (!existingLog.exists) {
      await logRef.set({ ...logBase, status: 'failed', error: error?.message || String(error) });
    }
    console.error(`❌ Erreur envoi SMS statut pour commande ${orderId}:`, error);
  }

  // 🔄 Fallback WhatsApp si SMS échoué
  if (!smsSent) {
    console.log(`🔄 SMS échoué → tentative WhatsApp pour commande ${orderId}`);
    const whatsappSent = await sendWhatsApp({
      to: formattedPhone,
      body: smsMessage,
      orderId,
      type: `status_${status}`,
    });
    if (whatsappSent) {
      console.log(`✅ WhatsApp fallback réussi pour commande ${orderId}`);
    } else {
      console.error(`❌ WhatsApp fallback échoué pour commande ${orderId} — aucun canal de notification disponible`);
    }
  }
}

function formatGuineaPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+224')) return cleaned;
  if (cleaned.startsWith('224')) return `+${cleaned}`;
  if (cleaned.startsWith('6') || cleaned.startsWith('3')) return `+224${cleaned}`;
  return `+224${cleaned}`;
}
