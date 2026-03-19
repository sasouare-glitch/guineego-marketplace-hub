"use strict";
/**
 * Scheduled function to detect revenue drops > 20% vs previous month
 * Checks all revenue sources and alerts admins
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRevenueDrops = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
function getMonthRange(monthsAgo) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
    return { start, end };
}
const SOURCE_LABELS = {
    commissions: 'Commissions',
    deliveries: 'Livraisons',
    subscriptions: 'Abonnements',
    sponsoring: 'Sponsoring',
    transit: 'Transit',
    academy: 'Académie',
};
async function getRevenueForMonth(source, range) {
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
            const prices = { pro: 299000, premium: 599000 };
            return snap.docs.reduce((sum, d) => sum + (prices[d.data().plan] || 0), 0);
        }
        case 'sponsoring': {
            const snap = await db.collection('products')
                .where('isSponsored', '==', true)
                .where('sponsoredAt', '>=', startTs)
                .where('sponsoredAt', '<=', endTs)
                .get();
            const planPrices = { '7d': 50000, '14d': 85000, '30d': 150000 };
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
exports.checkRevenueDrops = functions.pubsub
    .schedule('1 of month 08:00')
    .timeZone('Africa/Conakry')
    .onRun(async () => {
    const currentMonth = getMonthRange(1); // last completed month
    const previousMonth = getMonthRange(2);
    const sources = ['commissions', 'deliveries', 'subscriptions', 'sponsoring', 'transit', 'academy'];
    const alerts = [];
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
        await (0, notifications_1.notifyAdmins)({
            type: 'payment_received',
            title: '🚨 Alerte baisse de revenus',
            body: `Chute significative détectée : ${summary}`,
            data: { alertCount: String(alerts.length) },
            sendPush: true,
        });
        functions.logger.warn('Revenue drop alerts:', alerts);
    }
    else {
        functions.logger.info('No significant revenue drops detected');
    }
    return null;
});
//# sourceMappingURL=revenueAlerts.js.map