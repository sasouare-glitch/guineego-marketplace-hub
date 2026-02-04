/**
 * KPI CALCULATIONS: Real-time Business Metrics
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface EcomPerformance {
  ecomId: string;
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{ productId: string; name: string; sales: number; revenue: number }>;
  returnRate: number;
  customerSatisfaction: number;
  abandonedCarts: number;
  newCustomers: number;
  returningCustomers: number;
}

interface DailyReport {
  date: string;
  gmv: number;
  netRevenue: number;
  platformCommission: number;
  totalOrders: number;
  averageOrderValue: number;
  deliveriesCompleted: number;
  averageDeliveryTime: number;
  newUsers: number;
  activeUsers: number;
  topCategories: Array<{ category: string; revenue: number; orders: number }>;
  topCommunes: Array<{ commune: string; orders: number; revenue: number }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
  closerPerformance: { totalCalls: number; conversions: number; conversionRate: number };
}

/**
 * Calculate e-commerce performance metrics
 */
export const calculateEcomPerformance = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    const { ecomId, startDate, endDate } = data;

    if (!ecomId) {
      throw new functions.https.HttpsError('invalid-argument', 'ecomId requis');
    }

    // Verify access (own data or admin)
    const claims = context.auth.token;
    if (claims.role !== 'admin' && claims.ecomId !== ecomId) {
      throw new functions.https.HttpsError('permission-denied', 'Accès non autorisé');
    }

    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get orders for this ecom
      const ordersSnap = await db.collection('orders')
        .where('sellerId', '==', ecomId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate metrics
      const completedOrders = orders.filter((o: any) => o.status === 'delivered');
      const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled');
      
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const totalOrders = completedOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Product performance
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      for (const order of completedOrders as any[]) {
        for (const item of order.items || []) {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, sales: 0, revenue: 0 };
          }
          productSales[item.productId].sales += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        }
      }

      const topProducts = Object.entries(productSales)
        .map(([productId, data]) => ({ productId, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Get abandoned carts
      const cartsSnap = await db.collection('carts')
        .where('sellerId', '==', ecomId)
        .where('updatedAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('status', '==', 'abandoned')
        .get();

      // Customer analytics
      const customerIds = new Set(completedOrders.map((o: any) => o.customerId));
      const previousOrdersSnap = await db.collection('orders')
        .where('sellerId', '==', ecomId)
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(start))
        .where('status', '==', 'delivered')
        .get();

      const previousCustomers = new Set(previousOrdersSnap.docs.map(d => d.data().customerId));
      const newCustomers = [...customerIds].filter(id => !previousCustomers.has(id)).length;
      const returningCustomers = [...customerIds].filter(id => previousCustomers.has(id)).length;

      // Conversion rate (views to orders)
      const viewsSnap = await db.collection('analytics_events')
        .where('sellerId', '==', ecomId)
        .where('event', '==', 'product_view')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .get();

      const conversionRate = viewsSnap.size > 0 ? (totalOrders / viewsSnap.size) * 100 : 0;

      // Return rate
      const returnRate = orders.length > 0 ? (cancelledOrders.length / orders.length) * 100 : 0;

      // Customer satisfaction (average rating)
      const reviewsSnap = await db.collection('reviews')
        .where('sellerId', '==', ecomId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .get();

      const ratings = reviewsSnap.docs.map(d => d.data().rating || 0);
      const customerSatisfaction = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      const performance: EcomPerformance = {
        ecomId,
        period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        topProducts,
        returnRate,
        customerSatisfaction,
        abandonedCarts: cartsSnap.size,
        newCustomers,
        returningCustomers
      };

      // Cache the result
      await db.collection('ecom_performance_cache').doc(`${ecomId}_${start.toISOString().split('T')[0]}`).set({
        ...performance,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return performance;

    } catch (error) {
      console.error('Error calculating ecom performance:', error);
      throw new functions.https.HttpsError('internal', 'Erreur calcul performance');
    }
  });

/**
 * Generate daily revenue report (scheduled)
 */
export const dailyRevenueReport = functions
  .region('europe-west1')
  .pubsub.schedule('0 1 * * *') // Every day at 1 AM
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

      const orders = ordersSnap.docs.map(doc => doc.data());

      // Calculate GMV and revenue
      const gmv = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const platformCommission = orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
      const netRevenue = gmv - platformCommission;
      const averageOrderValue = orders.length > 0 ? gmv / orders.length : 0;

      // Deliveries
      const deliveriesSnap = await db.collection('deliveries')
        .where('deliveredAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('deliveredAt', '<', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'delivered')
        .get();

      const deliveries = deliveriesSnap.docs.map(doc => doc.data());
      const deliveryTimes = deliveries
        .filter(d => d.deliveredAt && d.acceptedAt)
        .map(d => (d.deliveredAt.toMillis() - d.acceptedAt.toMillis()) / 60000);
      const averageDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
        : 0;

      // Users
      const newUsersSnap = await db.collection('users')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
        .get();

      const activeUsersSnap = await db.collection('analytics_events')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(today))
        .get();

      const activeUserIds = new Set(activeUsersSnap.docs.map(d => d.data().userId));

      // Top categories
      const categoryRevenue: Record<string, { revenue: number; orders: number }> = {};
      for (const order of orders) {
        for (const item of order.items || []) {
          const cat = item.category || 'Autre';
          if (!categoryRevenue[cat]) {
            categoryRevenue[cat] = { revenue: 0, orders: 0 };
          }
          categoryRevenue[cat].revenue += item.price * item.quantity;
          categoryRevenue[cat].orders += 1;
        }
      }

      const topCategories = Object.entries(categoryRevenue)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top communes
      const communeData: Record<string, { orders: number; revenue: number }> = {};
      for (const order of orders) {
        const commune = order.delivery?.commune || 'Inconnu';
        if (!communeData[commune]) {
          communeData[commune] = { orders: 0, revenue: 0 };
        }
        communeData[commune].orders += 1;
        communeData[commune].revenue += order.total || 0;
      }

      const topCommunes = Object.entries(communeData)
        .map(([commune, data]) => ({ commune, ...data }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 5);

      // Payment methods
      const paymentMethodBreakdown: Record<string, { count: number; amount: number }> = {};
      for (const order of orders) {
        const method = order.paymentMethod || 'unknown';
        if (!paymentMethodBreakdown[method]) {
          paymentMethodBreakdown[method] = { count: 0, amount: 0 };
        }
        paymentMethodBreakdown[method].count += 1;
        paymentMethodBreakdown[method].amount += order.total || 0;
      }

      // Closer performance
      const closingSnap = await db.collection('closing_tasks')
        .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .where('completedAt', '<', admin.firestore.Timestamp.fromDate(today))
        .where('status', '==', 'completed')
        .get();

      const closingTasks = closingSnap.docs.map(d => d.data());
      const conversions = closingTasks.filter(t => t.outcome === 'converted').length;

      const report: DailyReport = {
        date: dateStr,
        gmv,
        netRevenue,
        platformCommission,
        totalOrders: orders.length,
        averageOrderValue,
        deliveriesCompleted: deliveries.length,
        averageDeliveryTime,
        newUsers: newUsersSnap.size,
        activeUsers: activeUserIds.size,
        topCategories,
        topCommunes,
        paymentMethodBreakdown,
        closerPerformance: {
          totalCalls: closingTasks.length,
          conversions,
          conversionRate: closingTasks.length > 0 ? (conversions / closingTasks.length) * 100 : 0
        }
      };

      // Save report
      await db.collection('daily_reports').doc(dateStr).set({
        ...report,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update rolling metrics
      await updateRollingMetrics(report);

      console.log(`Daily report generated for ${dateStr}:`, report);
      return report;

    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  });

/**
 * Update rolling 7/30 day metrics
 */
async function updateRollingMetrics(todayReport: DailyReport) {
  const now = new Date();
  
  // Get last 30 days reports
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const reportsSnap = await db.collection('daily_reports')
    .where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
    .orderBy('date', 'desc')
    .get();

  const reports = reportsSnap.docs.map(d => d.data() as DailyReport);

  // Calculate rolling metrics
  const last7 = reports.slice(0, 7);
  const last30 = reports;

  const rolling7 = {
    gmv: last7.reduce((s, r) => s + r.gmv, 0),
    orders: last7.reduce((s, r) => s + r.totalOrders, 0),
    avgOrderValue: last7.length > 0 
      ? last7.reduce((s, r) => s + r.averageOrderValue, 0) / last7.length 
      : 0,
    deliveries: last7.reduce((s, r) => s + r.deliveriesCompleted, 0),
    newUsers: last7.reduce((s, r) => s + r.newUsers, 0)
  };

  const rolling30 = {
    gmv: last30.reduce((s, r) => s + r.gmv, 0),
    orders: last30.reduce((s, r) => s + r.totalOrders, 0),
    avgOrderValue: last30.length > 0 
      ? last30.reduce((s, r) => s + r.averageOrderValue, 0) / last30.length 
      : 0,
    deliveries: last30.reduce((s, r) => s + r.deliveriesCompleted, 0),
    newUsers: last30.reduce((s, r) => s + r.newUsers, 0)
  };

  await db.collection('rolling_metrics').doc('current').set({
    rolling7,
    rolling30,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Calculate courier performance
 */
export const calculateCourierPerformance = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    const { courierId, startDate, endDate } = data;
    const claims = context.auth.token;

    if (claims.role !== 'admin' && claims.courierId !== courierId) {
      throw new functions.https.HttpsError('permission-denied', 'Accès non autorisé');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    try {
      const deliveriesSnap = await db.collection('deliveries')
        .where('assignedCourierId', '==', courierId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

      const deliveries = deliveriesSnap.docs.map(d => d.data());
      const completed = deliveries.filter(d => d.status === 'delivered');
      const cancelled = deliveries.filter(d => d.status === 'cancelled');

      // Zone distribution
      const zoneDistribution: Record<string, number> = {};
      for (const d of completed) {
        const zone = d.delivery?.commune || 'Inconnu';
        zoneDistribution[zone] = (zoneDistribution[zone] || 0) + 1;
      }

      // Delivery times
      const deliveryTimes = completed
        .filter(d => d.deliveredAt && d.acceptedAt)
        .map(d => ({
          time: (d.deliveredAt.toMillis() - d.acceptedAt.toMillis()) / 60000,
          zone: d.delivery?.commune
        }));

      const avgDeliveryTime = deliveryTimes.length > 0
        ? deliveryTimes.reduce((s, t) => s + t.time, 0) / deliveryTimes.length
        : 0;

      // Earnings
      const totalEarnings = completed.reduce((s, d) => s + (d.courierFee || 0), 0);

      // Hourly distribution
      const hourlyDistribution: Record<number, number> = {};
      for (const d of completed) {
        if (d.deliveredAt) {
          const hour = new Date(d.deliveredAt.toMillis()).getHours();
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
      }

      // Rating
      const ratingsSnap = await db.collection('delivery_ratings')
        .where('courierId', '==', courierId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .get();

      const ratings = ratingsSnap.docs.map(d => d.data().rating);
      const avgRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        courierId,
        period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
        totalDeliveries: completed.length,
        cancelledDeliveries: cancelled.length,
        completionRate: deliveries.length > 0 
          ? (completed.length / deliveries.length) * 100 
          : 0,
        totalEarnings,
        averageDeliveryTime: avgDeliveryTime,
        zoneDistribution,
        hourlyDistribution,
        averageRating: avgRating,
        totalRatings: ratings.length
      };

    } catch (error) {
      console.error('Error calculating courier performance:', error);
      throw new functions.https.HttpsError('internal', 'Erreur calcul performance');
    }
  });

/**
 * Calculate closer performance
 */
export const calculateCloserPerformance = functions
  .region('europe-west1')
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentification requise');
    }

    const { closerId, startDate, endDate } = data;
    const claims = context.auth.token;

    if (claims.role !== 'admin' && claims.closerId !== closerId) {
      throw new functions.https.HttpsError('permission-denied', 'Accès non autorisé');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    try {
      const tasksSnap = await db.collection('closing_tasks')
        .where('closerId', '==', closerId)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('createdAt', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

      const tasks = tasksSnap.docs.map(d => d.data());
      const completed = tasks.filter(t => t.status === 'completed');
      const converted = completed.filter(t => t.outcome === 'converted');

      // Call duration analysis
      const callDurations = completed
        .filter(t => t.callDuration)
        .map(t => t.callDuration);
      
      const avgCallDuration = callDurations.length > 0
        ? callDurations.reduce((a, b) => a + b, 0) / callDurations.length
        : 0;

      // Revenue generated
      const revenueGenerated = converted.reduce((s, t) => s + (t.orderTotal || 0), 0);
      const commissionEarned = converted.reduce((s, t) => s + (t.orderTotal || 0) * 0.02, 0);

      // Daily breakdown
      const dailyBreakdown: Record<string, { calls: number; conversions: number }> = {};
      for (const task of completed) {
        const date = task.completedAt?.toDate().toISOString().split('T')[0] || 'unknown';
        if (!dailyBreakdown[date]) {
          dailyBreakdown[date] = { calls: 0, conversions: 0 };
        }
        dailyBreakdown[date].calls += 1;
        if (task.outcome === 'converted') {
          dailyBreakdown[date].conversions += 1;
        }
      }

      // Objection handling
      const objections: Record<string, number> = {};
      for (const task of completed) {
        if (task.objection) {
          objections[task.objection] = (objections[task.objection] || 0) + 1;
        }
      }

      return {
        closerId,
        period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`,
        totalTasks: tasks.length,
        completedTasks: completed.length,
        conversions: converted.length,
        conversionRate: completed.length > 0 
          ? (converted.length / completed.length) * 100 
          : 0,
        averageCallDuration: avgCallDuration,
        revenueGenerated,
        commissionEarned,
        dailyBreakdown,
        topObjections: Object.entries(objections)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([objection, count]) => ({ objection, count }))
      };

    } catch (error) {
      console.error('Error calculating closer performance:', error);
      throw new functions.https.HttpsError('internal', 'Erreur calcul performance');
    }
  });
