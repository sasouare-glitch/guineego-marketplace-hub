/**
 * GuineeGo LAT - Cloud Functions Entry Point
 * Architecture 100% Firebase-native
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// ============================================
// AUTH FUNCTIONS
// ============================================
export { createUserWithRole } from './auth/createUserWithRole';
export { updateUserRole } from './auth/updateUserRole';
export { getUserClaims } from './auth/getUserClaims';
export { bootstrapAdmin } from './auth/bootstrapAdmin';
export { bootstrapRole } from './auth/bootstrapRole';
export { onUserRoleChanged } from './auth/onRoleChanged';

// ============================================
// PRODUCTS FUNCTIONS
// ============================================
export { listProducts } from './products/listProducts';
export { createProduct } from './products/createProduct';
export { updateStock } from './products/updateStock';
export { onProductCreated, onProductUpdated } from './products/productTriggers';

// ============================================
// ORDERS FUNCTIONS
// ============================================
export { createOrder } from './orders/createOrder';
export { updateOrderStatus } from './orders/updateOrderStatus';
export { cancelOrder } from './orders/cancelOrder';
export { onOrderCreated, onOrderStatusChanged } from './orders/orderTriggers';

// ============================================
// CLOSING FUNCTIONS
// ============================================
export { assignCloser } from './closing/assignCloser';
export { updateCloserMetrics } from './closing/updateCloserMetrics';
export { onClosingCompleted } from './closing/closingTriggers';

// ============================================
// DELIVERY FUNCTIONS
// ============================================
export { createDeliveryMission } from './deliveries/createDeliveryMission';
export { updateDeliveryStatus } from './deliveries/updateDeliveryStatus';
export { updateCourierLocation } from './deliveries/updateCourierLocation';
export { onDeliveryStatusChanged } from './deliveries/deliveryTriggers';
export { onNewDeliveryMission } from './deliveries/onNewMission';
export { onCourierAssigned } from './deliveries/onCourierAssigned';

// ============================================
// TRANSIT FUNCTIONS
// ============================================
export { calculateTransitQuote } from './transit/calculateTransitQuote';
export { createShipment } from './transit/createShipment';
export { updateShipmentStatus } from './transit/updateShipmentStatus';

// ============================================
// ACADEMY FUNCTIONS
// ============================================
export { purchaseCourse } from './academy/purchaseCourse';
export { updateProgress } from './academy/updateProgress';
export { issueCertificate } from './academy/issueCertificate';

// ============================================
// PAYMENTS & WALLET FUNCTIONS
// ============================================
export { processPayment } from './payments/processPayment';
export { processOMWebhook, processMTNWebhook } from './payments/webhooks';
export { createPayout } from './payments/createPayout';
export { onPaymentCompleted } from './payments/paymentTriggers';

// Seller Payouts
export { transferToEcommercant, onDeliveryConfirmed } from './payments/transferToEcommercant';

// Fee Calculations
export { 
  calculateDeliveryFee, 
  calculateTransitQuote as calculateTransitFee,
  calculateCourierPayment 
} from './payments/calculateFees';

// Courier Payments
export { 
  payCourier, 
  onMissionDelivered, 
  batchCourierPayout 
} from './payments/courierPayments';

// Investor Payouts
export { 
  processInvestorReturns, 
  scheduledInvestorReturns,
  processInvestmentMaturity 
} from './payments/investorPayouts';

// Withdrawals
export { 
  requestWithdrawal, 
  approveWithdrawal, 
  rejectWithdrawal,
  getWithdrawalHistory 
} from './payments/withdrawals';

// ============================================
// ANALYTICS FUNCTIONS
// ============================================
export { 
  calculateEcomPerformance,
  dailyRevenueReport,
  calculateCourierPerformance,
  calculateCloserPerformance
} from './analytics/kpiCalculations';

export { 
  logAnalyticsEvent,
  onOrderEvent,
  onDeliveryEvent,
  onProductEvent,
  onUserCreated
} from './analytics/eventTracking';

export { checkRevenueDrops } from './analytics/revenueAlerts';

export { 
  dailyBigQueryExport,
  generateAccountingExport,
  dailyReconciliation
} from './analytics/bigQuerySync';

// ============================================
// SMS FUNCTIONS
// ============================================
export { sendTestSms } from './notifications/sendTestSms';
export { retrySmsScheduled } from './notifications/retrySms';
export { manualRetrySms } from './notifications/manualRetrySms';
export { resendOrderSms } from './notifications/resendOrderSms';

// ============================================
// SPONSORING FUNCTIONS
// ============================================
export { checkExpiringSponsorships } from './sponsoring/checkExpiringSponsorships';

// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================
export { checkExpiringSubscriptions } from './sponsoring/checkExpiringSubscriptions';
export { confirmSubscriptionPayment } from './payments/subscriptionWebhooks';
export { initiateOrangeMoneyPayment } from './payments/initiateOrangeMoneyPayment';
export { initiateMTNMoMoPayment, checkMTNPaymentStatus } from './payments/initiateMTNMoMoPayment';
export { cancelExpiredPayments } from './payments/cancelExpiredPayments';
