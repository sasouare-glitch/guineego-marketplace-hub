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
