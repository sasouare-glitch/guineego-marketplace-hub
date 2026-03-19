"use strict";
/**
 * BIGQUERY SYNC: Export Firestore data to BigQuery for heavy analysis
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
exports.dailyReconciliation = exports.generateAccountingExport = exports.dailyBigQueryExport = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// import { BigQuery } from '@google-cloud/bigquery';
const db = admin.firestore();
/**
 * Daily sync to BigQuery (simplified - actual BigQuery integration requires setup)
 * This creates an export-ready format in Firestore that can be synced to BigQuery
 */
exports.dailyBigQueryExport = functions
    .region('europe-west1')
    .pubsub.schedule('0 2 * * *') // Every day at 2 AM
    .timeZone('Africa/Conakry')
    .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = yesterday.toISOString().split('T')[0];
    try {
        // Export orders
        const ordersExport = await exportOrders(yesterday, today);
        // Export deliveries
        const deliveriesExport = await exportDeliveries(yesterday, today);
        // Export analytics events
        const eventsExport = await exportAnalyticsEvents(yesterday, today);
        // Store export metadata
        await db.collection('bigquery_exports').doc(dateStr).set({
            date: dateStr,
            ordersCount: ordersExport.count,
            deliveriesCount: deliveriesExport.count,
            eventsCount: eventsExport.count,
            exportedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
        });
        console.log(`BigQuery export completed for ${dateStr}`);
        return {
            orders: ordersExport.count,
            deliveries: deliveriesExport.count,
            events: eventsExport.count
        };
    }
    catch (error) {
        console.error('Error in BigQuery export:', error);
        await db.collection('bigquery_exports').doc(dateStr).set({
            date: dateStr,
            error: error.message,
            exportedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed'
        });
        throw error;
    }
});
async function exportOrders(start, end) {
    const ordersSnap = await db.collection('orders')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(end))
        .get();
    const orders = ordersSnap.docs.map(doc => {
        const data = doc.data();
        return {
            order_id: doc.id,
            customer_id: data.customerId,
            seller_id: data.sellerId,
            status: data.status,
            total: data.total,
            platform_fee: data.platformFee,
            delivery_fee: data.deliveryFee,
            payment_method: data.paymentMethod,
            payment_status: data.paymentStatus,
            delivery_commune: data.delivery?.commune,
            item_count: data.items?.length || 0,
            created_at: data.createdAt?.toDate().toISOString(),
            updated_at: data.updatedAt?.toDate().toISOString()
        };
    });
    // Store in export collection for BigQuery import
    const batch = db.batch();
    const dateStr = start.toISOString().split('T')[0];
    for (const order of orders) {
        const ref = db.collection('bq_orders').doc(`${dateStr}_${order.order_id}`);
        batch.set(ref, order);
    }
    await batch.commit();
    return { count: orders.length, data: orders };
}
async function exportDeliveries(start, end) {
    const deliveriesSnap = await db.collection('deliveries')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(end))
        .get();
    const deliveries = deliveriesSnap.docs.map(doc => {
        const data = doc.data();
        let deliveryTimeMinutes = null;
        if (data.deliveredAt && data.acceptedAt) {
            deliveryTimeMinutes = (data.deliveredAt.toMillis() - data.acceptedAt.toMillis()) / 60000;
        }
        return {
            delivery_id: doc.id,
            order_id: data.orderId,
            courier_id: data.assignedCourierId,
            status: data.status,
            fee: data.fee,
            courier_fee: data.courierFee,
            priority: data.priority,
            pickup_commune: data.pickup?.commune,
            delivery_commune: data.delivery?.commune,
            delivery_time_minutes: deliveryTimeMinutes,
            created_at: data.createdAt?.toDate().toISOString(),
            accepted_at: data.acceptedAt?.toDate().toISOString(),
            delivered_at: data.deliveredAt?.toDate().toISOString()
        };
    });
    const batch = db.batch();
    const dateStr = start.toISOString().split('T')[0];
    for (const delivery of deliveries) {
        const ref = db.collection('bq_deliveries').doc(`${dateStr}_${delivery.delivery_id}`);
        batch.set(ref, delivery);
    }
    await batch.commit();
    return { count: deliveries.length, data: deliveries };
}
async function exportAnalyticsEvents(start, end) {
    const eventsSnap = await db.collection('analytics_events')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('timestamp', '<', admin.firestore.Timestamp.fromDate(end))
        .get();
    const events = eventsSnap.docs.map(doc => {
        const data = doc.data();
        return {
            event_id: doc.id,
            event_name: data.event,
            user_id: data.userId,
            session_id: data.sessionId,
            properties: JSON.stringify(data.properties || {}),
            platform: data.platform,
            timestamp: data.timestamp?.toDate().toISOString()
        };
    });
    // Events can be many, so we batch in groups of 500
    const dateStr = start.toISOString().split('T')[0];
    const batchSize = 500;
    for (let i = 0; i < events.length; i += batchSize) {
        const batch = db.batch();
        const chunk = events.slice(i, i + batchSize);
        for (const event of chunk) {
            const ref = db.collection('bq_events').doc(`${dateStr}_${event.event_id}`);
            batch.set(ref, event);
        }
        await batch.commit();
    }
    return { count: events.length };
}
/**
 * Generate CSV export for accounting
 */
exports.generateAccountingExport = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    }
    const claims = context.auth.token;
    if (claims.role !== 'admin' && claims.role !== 'accountant') {
        throw new functions.https.HttpsError('permission-denied', 'Admin/accountant access required');
    }
    const { startDate, endDate, type } = data;
    if (!startDate || !endDate) {
        throw new functions.https.HttpsError('invalid-argument', 'Start and end dates required');
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    try {
        let csvContent = '';
        switch (type) {
            case 'orders':
                csvContent = await generateOrdersCSV(start, end);
                break;
            case 'payouts':
                csvContent = await generatePayoutsCSV(start, end);
                break;
            case 'commissions':
                csvContent = await generateCommissionsCSV(start, end);
                break;
            default:
                throw new functions.https.HttpsError('invalid-argument', 'Invalid export type');
        }
        // Store in Cloud Storage (simplified - returns content directly)
        const exportId = `${type}_${startDate}_${endDate}_${Date.now()}`;
        await db.collection('accounting_exports').doc(exportId).set({
            type,
            startDate,
            endDate,
            generatedBy: context.auth.uid,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            rowCount: csvContent.split('\n').length - 1
        });
        return {
            exportId,
            content: csvContent,
            rowCount: csvContent.split('\n').length - 1
        };
    }
    catch (error) {
        console.error('Error generating export:', error);
        throw new functions.https.HttpsError('internal', 'Export generation failed');
    }
});
async function generateOrdersCSV(start, end) {
    const ordersSnap = await db.collection('orders')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .where('status', '==', 'delivered')
        .orderBy('createdAt', 'asc')
        .get();
    const headers = [
        'Order ID',
        'Date',
        'Customer ID',
        'Seller ID',
        'Total (GNF)',
        'Platform Fee (GNF)',
        'Delivery Fee (GNF)',
        'Net Seller Amount (GNF)',
        'Payment Method',
        'Delivery Commune'
    ];
    const rows = ordersSnap.docs.map(doc => {
        const d = doc.data();
        return [
            doc.id,
            d.createdAt?.toDate().toISOString().split('T')[0],
            d.customerId,
            d.sellerId,
            d.total,
            d.platformFee || 0,
            d.deliveryFee || 0,
            (d.total || 0) - (d.platformFee || 0) - (d.deliveryFee || 0),
            d.paymentMethod,
            d.delivery?.commune
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}
async function generatePayoutsCSV(start, end) {
    const payoutsSnap = await db.collection('payouts')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .orderBy('createdAt', 'asc')
        .get();
    const headers = [
        'Payout ID',
        'Date',
        'Recipient ID',
        'Recipient Type',
        'Amount (GNF)',
        'Method',
        'Status',
        'Reference'
    ];
    const rows = payoutsSnap.docs.map(doc => {
        const d = doc.data();
        return [
            doc.id,
            d.createdAt?.toDate().toISOString().split('T')[0],
            d.recipientId,
            d.recipientType,
            d.amount,
            d.method,
            d.status,
            d.reference || ''
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}
async function generateCommissionsCSV(start, end) {
    const transactionsSnap = await db.collection('transactions')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .where('type', '==', 'platform_commission')
        .orderBy('createdAt', 'asc')
        .get();
    const headers = [
        'Transaction ID',
        'Date',
        'Order ID',
        'Seller ID',
        'Order Total (GNF)',
        'Commission Rate (%)',
        'Commission Amount (GNF)'
    ];
    const rows = transactionsSnap.docs.map(doc => {
        const d = doc.data();
        return [
            doc.id,
            d.createdAt?.toDate().toISOString().split('T')[0],
            d.orderId,
            d.sellerId,
            d.orderTotal || 0,
            d.commissionRate || 5,
            d.amount
        ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}
/**
 * Daily reconciliation check
 */
exports.dailyReconciliation = functions
    .region('europe-west1')
    .pubsub.schedule('0 3 * * *') // Every day at 3 AM
    .timeZone('Africa/Conakry')
    .onRun(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateStr = yesterday.toISOString().split('T')[0];
    try {
        // Get all completed orders
        const ordersSnap = await db.collection('orders')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
            .where('status', '==', 'delivered')
            .get();
        const ordersTotal = ordersSnap.docs.reduce((s, d) => s + (d.data().total || 0), 0);
        const platformFees = ordersSnap.docs.reduce((s, d) => s + (d.data().platformFee || 0), 0);
        // Get all payouts
        const payoutsSnap = await db.collection('payouts')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
            .where('status', '==', 'completed')
            .get();
        const payoutsTotal = payoutsSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
        // Get wallet transactions
        const txSnap = await db.collection('transactions')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
            .get();
        const credits = txSnap.docs
            .filter(d => d.data().type === 'credit')
            .reduce((s, d) => s + (d.data().amount || 0), 0);
        const debits = txSnap.docs
            .filter(d => d.data().type === 'debit')
            .reduce((s, d) => s + (d.data().amount || 0), 0);
        // Check for discrepancies
        const expectedPlatformRevenue = platformFees;
        const expectedSellerPayouts = ordersTotal - platformFees;
        const discrepancies = [];
        if (Math.abs(credits - ordersTotal) > 100) {
            discrepancies.push(`Credit mismatch: expected ${ordersTotal}, got ${credits}`);
        }
        // Store reconciliation report
        await db.collection('reconciliation_reports').doc(dateStr).set({
            date: dateStr,
            ordersCount: ordersSnap.size,
            ordersTotal,
            platformFees,
            payoutsCount: payoutsSnap.size,
            payoutsTotal,
            walletCredits: credits,
            walletDebits: debits,
            expectedSellerPayouts,
            discrepancies,
            status: discrepancies.length === 0 ? 'balanced' : 'discrepancy',
            generatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Alert if discrepancies found
        if (discrepancies.length > 0) {
            console.warn(`Reconciliation discrepancies for ${dateStr}:`, discrepancies);
            // TODO: Send alert to admins
        }
        console.log(`Reconciliation completed for ${dateStr}:`, {
            ordersTotal,
            platformFees,
            payoutsTotal,
            status: discrepancies.length === 0 ? 'balanced' : 'discrepancy'
        });
    }
    catch (error) {
        console.error('Error in reconciliation:', error);
        throw error;
    }
});
//# sourceMappingURL=bigQuerySync.js.map