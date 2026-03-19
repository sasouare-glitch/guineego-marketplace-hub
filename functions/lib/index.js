"use strict";
/**
 * GuineeGo LAT - Cloud Functions Entry Point
 * Architecture 100% Firebase-native
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
exports.processInvestorReturns = exports.batchCourierPayout = exports.onMissionDelivered = exports.payCourier = exports.calculateCourierPayment = exports.calculateTransitFee = exports.calculateDeliveryFee = exports.onDeliveryConfirmed = exports.transferToEcommercant = exports.stripeRefund = exports.createStripeSubscriptionCheckout = exports.stripeWebhook = exports.createStripeCheckout = exports.onPaymentCompleted = exports.createPayout = exports.processMTNWebhook = exports.processOMWebhook = exports.processPayment = exports.issueCertificate = exports.updateProgress = exports.purchaseCourse = exports.updateShipmentStatus = exports.createShipment = exports.calculateTransitQuote = exports.onCourierAssigned = exports.onNewDeliveryMission = exports.onDeliveryStatusChanged = exports.updateCourierLocation = exports.updateDeliveryStatus = exports.createDeliveryMission = exports.onClosingCompleted = exports.updateCloserMetrics = exports.assignCloser = exports.onOrderStatusChanged = exports.onOrderCreated = exports.cancelOrder = exports.updateOrderStatus = exports.createGuestOrder = exports.createOrder = exports.onProductUpdated = exports.onProductCreated = exports.updateStock = exports.createProduct = exports.listProducts = exports.onUserRoleChanged = exports.bootstrapRole = exports.bootstrapAdmin = exports.getUserClaims = exports.updateUserRole = exports.createUserWithRole = void 0;
exports.cancelExpiredPayments = exports.checkMTNPaymentStatus = exports.initiateMTNMoMoPayment = exports.initiateOrangeMoneyPayment = exports.confirmSubscriptionPayment = exports.checkExpiringSubscriptions = exports.checkExpiringSponsorships = exports.resendOrderSms = exports.manualRetrySms = exports.retrySmsScheduled = exports.sendTestSms = exports.dailyReconciliation = exports.generateAccountingExport = exports.dailyBigQueryExport = exports.checkRevenueDrops = exports.onUserCreated = exports.onProductEvent = exports.onDeliveryEvent = exports.onOrderEvent = exports.logAnalyticsEvent = exports.calculateCloserPerformance = exports.calculateCourierPerformance = exports.dailyRevenueReport = exports.calculateEcomPerformance = exports.getWithdrawalHistory = exports.rejectWithdrawal = exports.approveWithdrawal = exports.requestWithdrawal = exports.processInvestmentMaturity = exports.scheduledInvestorReturns = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// ============================================
// AUTH FUNCTIONS
// ============================================
var createUserWithRole_1 = require("./auth/createUserWithRole");
Object.defineProperty(exports, "createUserWithRole", { enumerable: true, get: function () { return createUserWithRole_1.createUserWithRole; } });
var updateUserRole_1 = require("./auth/updateUserRole");
Object.defineProperty(exports, "updateUserRole", { enumerable: true, get: function () { return updateUserRole_1.updateUserRole; } });
var getUserClaims_1 = require("./auth/getUserClaims");
Object.defineProperty(exports, "getUserClaims", { enumerable: true, get: function () { return getUserClaims_1.getUserClaims; } });
var bootstrapAdmin_1 = require("./auth/bootstrapAdmin");
Object.defineProperty(exports, "bootstrapAdmin", { enumerable: true, get: function () { return bootstrapAdmin_1.bootstrapAdmin; } });
var bootstrapRole_1 = require("./auth/bootstrapRole");
Object.defineProperty(exports, "bootstrapRole", { enumerable: true, get: function () { return bootstrapRole_1.bootstrapRole; } });
var onRoleChanged_1 = require("./auth/onRoleChanged");
Object.defineProperty(exports, "onUserRoleChanged", { enumerable: true, get: function () { return onRoleChanged_1.onUserRoleChanged; } });
// ============================================
// PRODUCTS FUNCTIONS
// ============================================
var listProducts_1 = require("./products/listProducts");
Object.defineProperty(exports, "listProducts", { enumerable: true, get: function () { return listProducts_1.listProducts; } });
var createProduct_1 = require("./products/createProduct");
Object.defineProperty(exports, "createProduct", { enumerable: true, get: function () { return createProduct_1.createProduct; } });
var updateStock_1 = require("./products/updateStock");
Object.defineProperty(exports, "updateStock", { enumerable: true, get: function () { return updateStock_1.updateStock; } });
var productTriggers_1 = require("./products/productTriggers");
Object.defineProperty(exports, "onProductCreated", { enumerable: true, get: function () { return productTriggers_1.onProductCreated; } });
Object.defineProperty(exports, "onProductUpdated", { enumerable: true, get: function () { return productTriggers_1.onProductUpdated; } });
// ============================================
// ORDERS FUNCTIONS
// ============================================
var createOrder_1 = require("./orders/createOrder");
Object.defineProperty(exports, "createOrder", { enumerable: true, get: function () { return createOrder_1.createOrder; } });
var createGuestOrder_1 = require("./orders/createGuestOrder");
Object.defineProperty(exports, "createGuestOrder", { enumerable: true, get: function () { return createGuestOrder_1.createGuestOrder; } });
var updateOrderStatus_1 = require("./orders/updateOrderStatus");
Object.defineProperty(exports, "updateOrderStatus", { enumerable: true, get: function () { return updateOrderStatus_1.updateOrderStatus; } });
var cancelOrder_1 = require("./orders/cancelOrder");
Object.defineProperty(exports, "cancelOrder", { enumerable: true, get: function () { return cancelOrder_1.cancelOrder; } });
var orderTriggers_1 = require("./orders/orderTriggers");
Object.defineProperty(exports, "onOrderCreated", { enumerable: true, get: function () { return orderTriggers_1.onOrderCreated; } });
Object.defineProperty(exports, "onOrderStatusChanged", { enumerable: true, get: function () { return orderTriggers_1.onOrderStatusChanged; } });
// ============================================
// CLOSING FUNCTIONS
// ============================================
var assignCloser_1 = require("./closing/assignCloser");
Object.defineProperty(exports, "assignCloser", { enumerable: true, get: function () { return assignCloser_1.assignCloser; } });
var updateCloserMetrics_1 = require("./closing/updateCloserMetrics");
Object.defineProperty(exports, "updateCloserMetrics", { enumerable: true, get: function () { return updateCloserMetrics_1.updateCloserMetrics; } });
var closingTriggers_1 = require("./closing/closingTriggers");
Object.defineProperty(exports, "onClosingCompleted", { enumerable: true, get: function () { return closingTriggers_1.onClosingCompleted; } });
// ============================================
// DELIVERY FUNCTIONS
// ============================================
var createDeliveryMission_1 = require("./deliveries/createDeliveryMission");
Object.defineProperty(exports, "createDeliveryMission", { enumerable: true, get: function () { return createDeliveryMission_1.createDeliveryMission; } });
var updateDeliveryStatus_1 = require("./deliveries/updateDeliveryStatus");
Object.defineProperty(exports, "updateDeliveryStatus", { enumerable: true, get: function () { return updateDeliveryStatus_1.updateDeliveryStatus; } });
var updateCourierLocation_1 = require("./deliveries/updateCourierLocation");
Object.defineProperty(exports, "updateCourierLocation", { enumerable: true, get: function () { return updateCourierLocation_1.updateCourierLocation; } });
var deliveryTriggers_1 = require("./deliveries/deliveryTriggers");
Object.defineProperty(exports, "onDeliveryStatusChanged", { enumerable: true, get: function () { return deliveryTriggers_1.onDeliveryStatusChanged; } });
var onNewMission_1 = require("./deliveries/onNewMission");
Object.defineProperty(exports, "onNewDeliveryMission", { enumerable: true, get: function () { return onNewMission_1.onNewDeliveryMission; } });
var onCourierAssigned_1 = require("./deliveries/onCourierAssigned");
Object.defineProperty(exports, "onCourierAssigned", { enumerable: true, get: function () { return onCourierAssigned_1.onCourierAssigned; } });
// ============================================
// TRANSIT FUNCTIONS
// ============================================
var calculateTransitQuote_1 = require("./transit/calculateTransitQuote");
Object.defineProperty(exports, "calculateTransitQuote", { enumerable: true, get: function () { return calculateTransitQuote_1.calculateTransitQuote; } });
var createShipment_1 = require("./transit/createShipment");
Object.defineProperty(exports, "createShipment", { enumerable: true, get: function () { return createShipment_1.createShipment; } });
var updateShipmentStatus_1 = require("./transit/updateShipmentStatus");
Object.defineProperty(exports, "updateShipmentStatus", { enumerable: true, get: function () { return updateShipmentStatus_1.updateShipmentStatus; } });
// ============================================
// ACADEMY FUNCTIONS
// ============================================
var purchaseCourse_1 = require("./academy/purchaseCourse");
Object.defineProperty(exports, "purchaseCourse", { enumerable: true, get: function () { return purchaseCourse_1.purchaseCourse; } });
var updateProgress_1 = require("./academy/updateProgress");
Object.defineProperty(exports, "updateProgress", { enumerable: true, get: function () { return updateProgress_1.updateProgress; } });
var issueCertificate_1 = require("./academy/issueCertificate");
Object.defineProperty(exports, "issueCertificate", { enumerable: true, get: function () { return issueCertificate_1.issueCertificate; } });
// ============================================
// PAYMENTS & WALLET FUNCTIONS
// ============================================
var processPayment_1 = require("./payments/processPayment");
Object.defineProperty(exports, "processPayment", { enumerable: true, get: function () { return processPayment_1.processPayment; } });
var webhooks_1 = require("./payments/webhooks");
Object.defineProperty(exports, "processOMWebhook", { enumerable: true, get: function () { return webhooks_1.processOMWebhook; } });
Object.defineProperty(exports, "processMTNWebhook", { enumerable: true, get: function () { return webhooks_1.processMTNWebhook; } });
var createPayout_1 = require("./payments/createPayout");
Object.defineProperty(exports, "createPayout", { enumerable: true, get: function () { return createPayout_1.createPayout; } });
var paymentTriggers_1 = require("./payments/paymentTriggers");
Object.defineProperty(exports, "onPaymentCompleted", { enumerable: true, get: function () { return paymentTriggers_1.onPaymentCompleted; } });
// Stripe Payments
var stripeCheckout_1 = require("./payments/stripeCheckout");
Object.defineProperty(exports, "createStripeCheckout", { enumerable: true, get: function () { return stripeCheckout_1.createStripeCheckout; } });
var stripeWebhook_1 = require("./payments/stripeWebhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripeWebhook_1.stripeWebhook; } });
var stripeSubscription_1 = require("./payments/stripeSubscription");
Object.defineProperty(exports, "createStripeSubscriptionCheckout", { enumerable: true, get: function () { return stripeSubscription_1.createStripeSubscriptionCheckout; } });
var stripeRefund_1 = require("./payments/stripeRefund");
Object.defineProperty(exports, "stripeRefund", { enumerable: true, get: function () { return stripeRefund_1.stripeRefund; } });
// Seller Payouts
var transferToEcommercant_1 = require("./payments/transferToEcommercant");
Object.defineProperty(exports, "transferToEcommercant", { enumerable: true, get: function () { return transferToEcommercant_1.transferToEcommercant; } });
Object.defineProperty(exports, "onDeliveryConfirmed", { enumerable: true, get: function () { return transferToEcommercant_1.onDeliveryConfirmed; } });
// Fee Calculations
var calculateFees_1 = require("./payments/calculateFees");
Object.defineProperty(exports, "calculateDeliveryFee", { enumerable: true, get: function () { return calculateFees_1.calculateDeliveryFee; } });
Object.defineProperty(exports, "calculateTransitFee", { enumerable: true, get: function () { return calculateFees_1.calculateTransitQuote; } });
Object.defineProperty(exports, "calculateCourierPayment", { enumerable: true, get: function () { return calculateFees_1.calculateCourierPayment; } });
// Courier Payments
var courierPayments_1 = require("./payments/courierPayments");
Object.defineProperty(exports, "payCourier", { enumerable: true, get: function () { return courierPayments_1.payCourier; } });
Object.defineProperty(exports, "onMissionDelivered", { enumerable: true, get: function () { return courierPayments_1.onMissionDelivered; } });
Object.defineProperty(exports, "batchCourierPayout", { enumerable: true, get: function () { return courierPayments_1.batchCourierPayout; } });
// Investor Payouts
var investorPayouts_1 = require("./payments/investorPayouts");
Object.defineProperty(exports, "processInvestorReturns", { enumerable: true, get: function () { return investorPayouts_1.processInvestorReturns; } });
Object.defineProperty(exports, "scheduledInvestorReturns", { enumerable: true, get: function () { return investorPayouts_1.scheduledInvestorReturns; } });
Object.defineProperty(exports, "processInvestmentMaturity", { enumerable: true, get: function () { return investorPayouts_1.processInvestmentMaturity; } });
// Withdrawals
var withdrawals_1 = require("./payments/withdrawals");
Object.defineProperty(exports, "requestWithdrawal", { enumerable: true, get: function () { return withdrawals_1.requestWithdrawal; } });
Object.defineProperty(exports, "approveWithdrawal", { enumerable: true, get: function () { return withdrawals_1.approveWithdrawal; } });
Object.defineProperty(exports, "rejectWithdrawal", { enumerable: true, get: function () { return withdrawals_1.rejectWithdrawal; } });
Object.defineProperty(exports, "getWithdrawalHistory", { enumerable: true, get: function () { return withdrawals_1.getWithdrawalHistory; } });
// ============================================
// ANALYTICS FUNCTIONS
// ============================================
var kpiCalculations_1 = require("./analytics/kpiCalculations");
Object.defineProperty(exports, "calculateEcomPerformance", { enumerable: true, get: function () { return kpiCalculations_1.calculateEcomPerformance; } });
Object.defineProperty(exports, "dailyRevenueReport", { enumerable: true, get: function () { return kpiCalculations_1.dailyRevenueReport; } });
Object.defineProperty(exports, "calculateCourierPerformance", { enumerable: true, get: function () { return kpiCalculations_1.calculateCourierPerformance; } });
Object.defineProperty(exports, "calculateCloserPerformance", { enumerable: true, get: function () { return kpiCalculations_1.calculateCloserPerformance; } });
var eventTracking_1 = require("./analytics/eventTracking");
Object.defineProperty(exports, "logAnalyticsEvent", { enumerable: true, get: function () { return eventTracking_1.logAnalyticsEvent; } });
Object.defineProperty(exports, "onOrderEvent", { enumerable: true, get: function () { return eventTracking_1.onOrderEvent; } });
Object.defineProperty(exports, "onDeliveryEvent", { enumerable: true, get: function () { return eventTracking_1.onDeliveryEvent; } });
Object.defineProperty(exports, "onProductEvent", { enumerable: true, get: function () { return eventTracking_1.onProductEvent; } });
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return eventTracking_1.onUserCreated; } });
var revenueAlerts_1 = require("./analytics/revenueAlerts");
Object.defineProperty(exports, "checkRevenueDrops", { enumerable: true, get: function () { return revenueAlerts_1.checkRevenueDrops; } });
var bigQuerySync_1 = require("./analytics/bigQuerySync");
Object.defineProperty(exports, "dailyBigQueryExport", { enumerable: true, get: function () { return bigQuerySync_1.dailyBigQueryExport; } });
Object.defineProperty(exports, "generateAccountingExport", { enumerable: true, get: function () { return bigQuerySync_1.generateAccountingExport; } });
Object.defineProperty(exports, "dailyReconciliation", { enumerable: true, get: function () { return bigQuerySync_1.dailyReconciliation; } });
// ============================================
// SMS FUNCTIONS
// ============================================
var sendTestSms_1 = require("./notifications/sendTestSms");
Object.defineProperty(exports, "sendTestSms", { enumerable: true, get: function () { return sendTestSms_1.sendTestSms; } });
var retrySms_1 = require("./notifications/retrySms");
Object.defineProperty(exports, "retrySmsScheduled", { enumerable: true, get: function () { return retrySms_1.retrySmsScheduled; } });
var manualRetrySms_1 = require("./notifications/manualRetrySms");
Object.defineProperty(exports, "manualRetrySms", { enumerable: true, get: function () { return manualRetrySms_1.manualRetrySms; } });
var resendOrderSms_1 = require("./notifications/resendOrderSms");
Object.defineProperty(exports, "resendOrderSms", { enumerable: true, get: function () { return resendOrderSms_1.resendOrderSms; } });
// ============================================
// SPONSORING FUNCTIONS
// ============================================
var checkExpiringSponsorships_1 = require("./sponsoring/checkExpiringSponsorships");
Object.defineProperty(exports, "checkExpiringSponsorships", { enumerable: true, get: function () { return checkExpiringSponsorships_1.checkExpiringSponsorships; } });
// ============================================
// SUBSCRIPTION FUNCTIONS
// ============================================
var checkExpiringSubscriptions_1 = require("./sponsoring/checkExpiringSubscriptions");
Object.defineProperty(exports, "checkExpiringSubscriptions", { enumerable: true, get: function () { return checkExpiringSubscriptions_1.checkExpiringSubscriptions; } });
var subscriptionWebhooks_1 = require("./payments/subscriptionWebhooks");
Object.defineProperty(exports, "confirmSubscriptionPayment", { enumerable: true, get: function () { return subscriptionWebhooks_1.confirmSubscriptionPayment; } });
var initiateOrangeMoneyPayment_1 = require("./payments/initiateOrangeMoneyPayment");
Object.defineProperty(exports, "initiateOrangeMoneyPayment", { enumerable: true, get: function () { return initiateOrangeMoneyPayment_1.initiateOrangeMoneyPayment; } });
var initiateMTNMoMoPayment_1 = require("./payments/initiateMTNMoMoPayment");
Object.defineProperty(exports, "initiateMTNMoMoPayment", { enumerable: true, get: function () { return initiateMTNMoMoPayment_1.initiateMTNMoMoPayment; } });
Object.defineProperty(exports, "checkMTNPaymentStatus", { enumerable: true, get: function () { return initiateMTNMoMoPayment_1.checkMTNPaymentStatus; } });
var cancelExpiredPayments_1 = require("./payments/cancelExpiredPayments");
Object.defineProperty(exports, "cancelExpiredPayments", { enumerable: true, get: function () { return cancelExpiredPayments_1.cancelExpiredPayments; } });
//# sourceMappingURL=index.js.map