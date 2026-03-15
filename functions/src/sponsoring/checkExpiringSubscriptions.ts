/**
 * Scheduled function to check for expiring seller subscriptions
 * Sends notifications 7 days, 3 days and 1 day before expiry
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

export const checkExpiringSubscriptions = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('Africa/Conakry')
  .onRun(async () => {
    const now = new Date();

    const windows = [
      { days: 7, label: '7 jours' },
      { days: 3, label: '3 jours' },
      { days: 1, label: '24 heures' },
    ];

    for (const window of windows) {
      const targetStart = new Date(now);
      targetStart.setDate(targetStart.getDate() + window.days);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetStart);
      targetEnd.setHours(23, 59, 59, 999);

      // Query seller_settings where subscription.expiresAt falls in the target window
      const snapshot = await db
        .collection('seller_settings')
        .where('subscription.expiresAt', '>=', admin.firestore.Timestamp.fromDate(targetStart))
        .where('subscription.expiresAt', '<=', admin.firestore.Timestamp.fromDate(targetEnd))
        .get();

      functions.logger.info(
        `Found ${snapshot.size} subscriptions expiring in ${window.label}`
      );

      for (const doc of snapshot.docs) {
        const sellerId = doc.id;
        const data = doc.data();
        const planName = data.subscription?.planName || data.subscription?.planId || 'Pro';

        // Avoid duplicate notifications: check if already sent today for this window
        const todayKey = `sub_expiry_${window.days}d_${now.toISOString().slice(0, 10)}`;
        const existing = await db
          .collection('notifications')
          .where('userId', '==', sellerId)
          .where('data.dedupeKey', '==', todayKey)
          .limit(1)
          .get();

        if (!existing.empty) continue;

        await sendNotification({
          type: 'subscription_expiring' as any,
          userId: sellerId,
          title: `Abonnement ${planName} expire dans ${window.label}`,
          body:
            window.days === 1
              ? `Votre abonnement ${planName} expire demain. Renouvelez maintenant pour ne pas perdre vos avantages.`
              : `Votre abonnement ${planName} expire dans ${window.label}. Pensez à le renouveler pour conserver vos avantages.`,
          data: {
            dedupeKey: todayKey,
            link: '/seller/subscription',
            planId: data.subscription?.planId || '',
          },
          sendPush: true,
        });

        functions.logger.info(`Sent ${window.label} expiry reminder to seller ${sellerId}`);
      }
    }

    return null;
  });
