"use strict";
/**
 * Scheduled function to check for expiring product sponsorships
 * Sends push + in-app notifications to sellers 3 days and 1 day before expiry
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
exports.checkExpiringSponsorships = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
exports.checkExpiringSponsorships = functions.pubsub
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
        if (snapshot.empty)
            continue;
        const promises = snapshot.docs.map(async (doc) => {
            const product = doc.data();
            const sellerId = product.sellerId || product.userId;
            if (!sellerId)
                return;
            // Avoid duplicate notifications
            const alreadySent = await db
                .collection('notifications')
                .where('userId', '==', sellerId)
                .where('type', '==', 'sponsoring_expiring')
                .where('data.productId', '==', doc.id)
                .where('data.window', '==', String(window.days))
                .limit(1)
                .get();
            if (!alreadySent.empty)
                return;
            await (0, notifications_1.sendNotification)({
                userId: sellerId,
                type: 'sponsoring_expiring',
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
            if (!sellerId)
                return;
            await (0, notifications_1.sendNotification)({
                userId: sellerId,
                type: 'sponsoring_expiring',
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
//# sourceMappingURL=checkExpiringSponsorships.js.map