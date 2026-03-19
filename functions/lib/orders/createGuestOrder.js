"use strict";
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
exports.createGuestOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const orderCreation_1 = require("./orderCreation");
function isValidGuineaPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 8 || digits.length === 11 || digits.length === 12;
}
function generateGuestCustomerId() {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
exports.createGuestOrder = functions
    .region('europe-west1')
    .https.onCall(async (data) => {
    try {
        if (!data?.shippingAddress?.fullName?.trim()) {
            throw new functions.https.HttpsError('invalid-argument', 'Le nom complet est requis');
        }
        if (!data?.shippingAddress?.phone || !isValidGuineaPhone(data.shippingAddress.phone)) {
            throw new functions.https.HttpsError('invalid-argument', 'Numéro de téléphone invalide');
        }
        (0, orderCreation_1.assertGuestCheckoutAllowed)(data.paymentMethod);
        return await (0, orderCreation_1.createOrderRecord)({
            ...data,
            customerId: generateGuestCustomerId(),
            isGuest: true,
        });
    }
    catch (error) {
        console.error('Error creating guest order:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création de la commande invitée');
    }
});
//# sourceMappingURL=createGuestOrder.js.map