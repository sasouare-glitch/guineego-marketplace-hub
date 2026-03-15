/**
 * Trigger: Courier Assigned to Delivery Mission
 * Sends in-app notification + SMS with client location
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

export const onCourierAssigned = functions
  .region('europe-west1')
  .firestore.document('deliveries/{missionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const missionId = context.params.missionId;

    // Only trigger when courier is newly assigned
    if (before.assignedCourier || !after.assignedCourier) return;

    const courierId = after.assignedCourier;
    const delivery = after.delivery || after.shippingAddress || {};
    const pickup = after.pickup || {};
    const orderId = after.orderId || '';
    const fee = after.fee || 0;
    const priorityLabel = after.priority === 'express' ? '⚡ EXPRESS' : '📦 Standard';

    const deliveryAddress = [delivery.address, delivery.commune].filter(Boolean).join(', ');
    const pickupAddress = [pickup.address, pickup.commune].filter(Boolean).join(', ');
    const clientPhone = delivery.phone || '';

    // Build Google Maps link from GPS coordinates or address
    const deliveryLat = delivery.latitude || delivery.lat;
    const deliveryLng = delivery.longitude || delivery.lng;
    const pickupLat = pickup.latitude || pickup.lat;
    const pickupLng = pickup.longitude || pickup.lng;

    const deliveryMapsLink = deliveryLat && deliveryLng
      ? `https://www.google.com/maps?q=${deliveryLat},${deliveryLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(deliveryAddress || delivery.commune || 'Conakry')}`;

    const pickupMapsLink = pickupLat && pickupLng
      ? `https://www.google.com/maps?q=${pickupLat},${pickupLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress || pickup.commune || 'Conakry')}`;

    try {
      // 1. Send in-app + push notification
      await sendNotification({
        userId: courierId,
        type: 'order_assigned',
        title: `${priorityLabel} Mission assignée !`,
        body: `Livraison vers ${delivery.commune || 'N/A'} • ${fee.toLocaleString()} GNF`,
        data: {
          missionId,
          orderId,
          pickupAddress,
          deliveryAddress,
          clientPhone,
          deliveryMapsLink,
          pickupMapsLink,
          fee: fee.toString(),
          priority: after.priority || 'normal',
        },
      });

      // 2. Send SMS to courier with client location + Maps link
      await sendCourierSMS(courierId, missionId, {
        pickupAddress,
        deliveryAddress,
        clientPhone,
        fee,
        priorityLabel,
        deliveryMapsLink,
        pickupMapsLink,
      });

      console.log(`✅ Courier ${courierId} notified for mission ${missionId}`);
    } catch (error) {
      console.error(`❌ Error notifying courier ${courierId}:`, error);
    }
  });

/**
 * Send SMS to courier with mission details + client location
 */
async function sendCourierSMS(
  courierId: string,
  missionId: string,
  details: {
    pickupAddress: string;
    deliveryAddress: string;
    clientPhone: string;
    fee: number;
    priorityLabel: string;
  }
): Promise<void> {
  // Get courier phone number
  const courierDoc = await db.collection('users').doc(courierId).get();
  const courierData = courierDoc.data();
  const courierPhone = courierData?.phone || courierData?.phoneNumber;

  if (!courierPhone) {
    console.warn(`⚠️ Pas de numéro de téléphone pour le coursier ${courierId}`);
    return;
  }

  const formattedPhone = formatGuineaPhone(courierPhone);

  const smsMessage =
    `GuineeGo ${details.priorityLabel}\n` +
    `Mission: ${missionId}\n` +
    `Pickup: ${details.pickupAddress || 'Voir app'}\n` +
    `Livraison: ${details.deliveryAddress || 'Voir app'}\n` +
    `Client: ${details.clientPhone || 'N/A'}\n` +
    `Gain: ${details.fee.toLocaleString()} GNF`;

  const logRef = db.collection('sms_logs').doc();
  const logBase = {
    type: 'courier_mission_assigned',
    to: formattedPhone,
    message: smsMessage,
    missionId,
    courierId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    const configDoc = await db.collection('config').doc('orange_sms').get();
    const config = configDoc.data();

    if (!config?.clientId || !config?.clientSecret || !config?.enabled) {
      await logRef.set({
        ...logBase,
        status: 'failed',
        error: 'Orange SMS API non configurée ou désactivée',
      });
      console.warn('⚠️ Orange SMS non configuré — SMS coursier non envoyé');
      return;
    }

    // 1. Get OAuth token
    const tokenResponse = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      await logRef.set({ ...logBase, status: 'failed', error: `Token OAuth échoué [${tokenResponse.status}]: ${err}` });
      return;
    }

    const { access_token } = await tokenResponse.json();

    // 2. Send SMS
    const senderAddress = config.senderAddress || 'tel:+224000000000';
    const encodedSender = encodeURIComponent(senderAddress);

    const smsResponse = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
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
      return;
    }

    const responseBody = await smsResponse.text();
    await logRef.set({ ...logBase, status: 'sent', response: responseBody });
    console.log(`✅ SMS mission envoyé au coursier ${formattedPhone}`);
  } catch (error: any) {
    const existingLog = await logRef.get();
    if (!existingLog.exists) {
      await logRef.set({ ...logBase, status: 'failed', error: error?.message || String(error) });
    }
    console.error(`❌ Erreur SMS coursier:`, error);
  }
}

/**
 * Format phone for Guinea (+224)
 */
function formatGuineaPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+224')) return cleaned;
  if (cleaned.startsWith('224')) return `+${cleaned}`;
  if (cleaned.startsWith('6') || cleaned.startsWith('3')) return `+224${cleaned}`;
  return `+224${cleaned}`;
}
