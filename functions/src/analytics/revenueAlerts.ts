/**
 * Scheduled function to detect revenue drops > 20% vs previous month
 * Checks all revenue sources and alerts admins
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { notifyAdmins } from '../utils/notifications';

const db = admin.firestore();

interface MonthRange {
  start: Date;
  end: Date;
}

function getMonthRange(monthsAgo: number): MonthRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

type RevenueSource = 'commissions' | 'deliveries' | 'subscriptions' | 'sponsoring' | 'transit' | 'academy';

const SOURCE_LABELS: Record<RevenueSource, string> = {
  commissions: 'Commissions',
  deliveries: 'Livraisons',
  subscriptions: 'Abonnements',
  sponsoring: 'Sponsoring',
  transit: 'Transit',
  academy: 'Académie',
};

async function getRevenueForMonth(source: RevenueSource, range: MonthRange): Promise<number> {
  const { start, end } = range;
  const startTs = admin.firestore.Timestamp.fromDate(start);
  const endTs = admin.firestore.Timestamp.fromDate(end);

  switch (source) {
    case 'commissions': {
      const snap = await db.collection('orders')
        .where('status', 'in', ['delivered', 'completed'])
        .where('createdAt', '>=', startTs)
        .where('createdAt', '<=', endTs)
        .get();
      return snap.docs.reduce((sum, d) => {
        const data = d.data();
        const rate = data.commissionRate || 0.05;
        return sum + (data.totalAmount || 0) * rate;
      }, 0);
    }
    case 'deliveries': {
      const snap = await db.collection('deliveries')
        .where('status', '==', 'delivered')
        .where('completedAt', '>=', startTs)
        .where('completedAt', '<=', endTs)
        .get();
      return snap.docs.reduce((sum, d) => {
        const fee = d.data().deliveryFee || 0;
        return sum + fee * 0.3;
      }, 0);
    }
    case 'subscriptions': {
      const snap = await db.collection('seller_settings')
        .where('plan', 'in', ['pro', 'premium'])
        .where('subscribedAt', '<=', endTs)
        .get();
      const prices: Record<string, number> = { pro: 299000, premium: 599000 };
      return snap.docs.reduce((sum, d) => sum + (prices[d.data().plan] || 0), 0);
    }
    case 'sponsoring': {
      const snap = await db.collection('products')
        .where('isSponsored', '==', true)
        .where('sponsoredAt', '>=', startTs)
        .where('sponsoredAt', '<=', endTs)
        .get();
      const planPrices: Record<string, number> = { '7d': 50000, '14d': 85000, '30d': 150000 };
      return snap.docs.reduce((sum, d) => sum + (planPrices[d.data().sponsorPlan] || 50000), 0);
    }
    case 'transit': {
      const snap = await db.collection('transit')
        .where('status', '==', 'delivered')
        .where('completedAt', '>=', startTs)
        .where('completedAt', '<=', endTs)
        .get();
      return snap.docs.reduce((sum, d) => sum + (d.data().totalFee || 0), 0);
    }
    case 'academy': {
      const snap = await db.collection('course_purchases')
        .where('purchasedAt', '>=', startTs)
        .where('purchasedAt', '<=', endTs)
        .get();
      return snap.docs.reduce((sum, d) => sum + (d.data().price || 0), 0);
    }
    default:
      return 0;
  }
}

export const checkRevenueDrops = functions.pubsub
  .schedule('1 of month 08:00')
  .timeZone('Africa/Conakry')
  .onRun(async () => {
    const currentMonth = getMonthRange(1); // last completed month
    const previousMonth = getMonthRange(2);

    const sources: RevenueSource[] = ['commissions', 'deliveries', 'subscriptions', 'sponsoring', 'transit', 'academy'];
    const alerts: { source: string; current: number; previous: number; drop: number }[] = [];

    for (const source of sources) {
      const [current, previous] = await Promise.all([
        getRevenueForMonth(source, currentMonth),
        getRevenueForMonth(source, previousMonth),
      ]);

      if (previous > 0) {
        const dropPercent = ((previous - current) / previous) * 100;
        if (dropPercent > 20) {
          alerts.push({
            source: SOURCE_LABELS[source],
            current: Math.round(current),
            previous: Math.round(previous),
            drop: Math.round(dropPercent),
          });
        }
      }
    }

    if (alerts.length > 0) {
      // Save alert record
      await db.collection('alerts').add({
        type: 'revenue_drop',
        alerts,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        acknowledged: false,
      });

      // Notify all admins
      const summary = alerts.map(a => `${a.source} -${a.drop}%`).join(', ');
      await notifyAdmins({
        type: 'payment_received' as any,
        title: '🚨 Alerte baisse de revenus',
        body: `Chute significative détectée : ${summary}`,
        data: { alertCount: String(alerts.length) },
        sendPush: true,
      });

      functions.logger.warn('Revenue drop alerts:', alerts);
    } else {
      functions.logger.info('No significant revenue drops detected');
    }

    return null;
  });
