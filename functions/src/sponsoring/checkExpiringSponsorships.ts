/**
 * Scheduled function to check for expiring product sponsorships
 * Sends push + in-app notifications to sellers 3 days and 1 day before expiry
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

export const checkExpiringSponsorships = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Africa/Conakry')
  .onRun(async () => {
    const now = new Date();

    // Check 3-day and 1-day windows
    const windows = [
      { days: 3, label: '3 jours' },
      { days: 1, label: '24 heures' },
    ];

    for (const window of windows) {
      const targetStart = new Date(now);
      targetStart.setDate(targetStart.getDate() + window.days);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(targetStart);
      targetEnd.setHours(23, 59, 59, 999);

      const snapshot = await db
        .collection('products')
        .where('isSponsored', '==', true)
        .where('sponsoredUntil', '>=', admin.firestore.Timestamp.fromDate(targetStart))
        .where('sponsoredUntil', '<=', admin.firestore.Timestamp.fromDate(targetEnd))
        .get();

      if (snapshot.empty) continue;

      const promises = snapshot.docs.map(async (doc) => {
        const product = doc.data();
        const sellerId = product.sellerId || product.userId;
        if (!sellerId) return;

        // Avoid duplicate notifications
        const alreadySent = await db
          .collection('notifications')
          .where('userId', '==', sellerId)
          .where('type', '==', 'sponsoring_expiring')
          .where('data.productId', '==', doc.id)
          .where('data.window', '==', String(window.days))
          .limit(1)
          .get();

        if (!alreadySent.empty) return;

        await sendNotification({
          userId: sellerId,
          type: 'sponsoring_expiring' as any,
          title: `⏰ Sponsoring expire dans ${window.label}`,
          body: `Le sponsoring de "${product.name}" expire bientôt. Renouvelez-le pour rester visible !`,
          data: {
            productId: doc.id,
            productName: product.name || '',
            window: String(window.days),
          },
          sendPush: true,
        });
      });

      await Promise.all(promises);
      functions.logger.info(`Checked ${snapshot.size} products expiring in ${window.days} day(s)`);
    }

    // Auto-expire past sponsorships
    const expiredSnapshot = await db
      .collection('products')
      .where('isSponsored', '==', true)
      .where('sponsoredUntil', '<', admin.firestore.Timestamp.fromDate(now))
      .get();

    if (!expiredSnapshot.empty) {
      const batch = db.batch();
      expiredSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isSponsored: false });
      });
      await batch.commit();

      // Notify sellers of expired sponsorships
      const expiredPromises = expiredSnapshot.docs.map(async (doc) => {
        const product = doc.data();
        const sellerId = product.sellerId || product.userId;
        if (!sellerId) return;

        await sendNotification({
          userId: sellerId,
          type: 'sponsoring_expiring' as any,
          title: '📢 Sponsoring expiré',
          body: `Le sponsoring de "${product.name}" a expiré. Renouvelez-le pour booster votre visibilité.`,
          data: { productId: doc.id, productName: product.name || '', window: '0' },
          sendPush: true,
        });
      });
      await Promise.all(expiredPromises);
      functions.logger.info(`Auto-expired ${expiredSnapshot.size} sponsorships`);
    }

    return null;
  });
