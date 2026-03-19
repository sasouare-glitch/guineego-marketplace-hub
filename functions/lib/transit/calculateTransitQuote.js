"use strict";
/**
 * TRANSIT FUNCTION: Calculate Transit Quote
 * Auto-calculate China-Guinea shipping costs
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
exports.calculateTransitQuote = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Pricing constants (GNF)
const PRICING = {
    air: {
        perKg: 16000,
        minWeight: 0.5,
        estimatedDays: { min: 7, max: 15 },
    },
    sea: {
        perKg: 3500,
        perM3: 2500000,
        minWeight: 1,
        estimatedDays: { min: 45, max: 60 },
    },
    insurance: 0.02, // 2% of cargo value
    expressFee: 0.15, // 15% surcharge
};
/**
 * Calculate transit quote
 * httpsCallable: calculateTransitQuote
 */
exports.calculateTransitQuote = functions
    .region("europe-west1")
    .https.onCall(async (data) => {
    const { weightKg, volumeM3, method, insurance = false, expressHandling = false } = data;
    if (!weightKg || weightKg <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Poids requis et doit être positif");
    }
    const quotes = [];
    // Air freight quote
    if (!method || method === "air") {
        const effectiveWeight = Math.max(weightKg, PRICING.air.minWeight);
        const baseCost = Math.ceil(effectiveWeight * PRICING.air.perKg);
        const insuranceCost = insurance ? Math.ceil(baseCost * PRICING.insurance) : 0;
        const expressFee = expressHandling ? Math.ceil(baseCost * PRICING.expressFee) : 0;
        quotes.push({
            method: "Fret Aérien",
            weightCost: baseCost,
            volumeCost: 0,
            baseCost,
            insurance: insuranceCost,
            expressFee,
            totalCost: baseCost + insuranceCost + expressFee,
            estimatedDays: expressHandling ? { min: 5, max: 7 } : PRICING.air.estimatedDays,
            currency: "GNF",
        });
    }
    // Sea freight quote
    if (!method || method === "sea") {
        const effectiveWeight = Math.max(weightKg, PRICING.sea.minWeight);
        const weightCost = Math.ceil(effectiveWeight * PRICING.sea.perKg);
        const volumeCost = volumeM3 ? Math.ceil(volumeM3 * PRICING.sea.perM3) : 0;
        // Use higher of weight or volume cost
        const baseCost = Math.max(weightCost, volumeCost);
        const insuranceCost = insurance ? Math.ceil(baseCost * PRICING.insurance) : 0;
        const expressFee = expressHandling ? Math.ceil(baseCost * PRICING.expressFee) : 0;
        quotes.push({
            method: "Fret Maritime",
            weightCost,
            volumeCost,
            baseCost,
            insurance: insuranceCost,
            expressFee,
            totalCost: baseCost + insuranceCost + expressFee,
            estimatedDays: PRICING.sea.estimatedDays,
            currency: "GNF",
        });
    }
    return { quotes };
});
//# sourceMappingURL=calculateTransitQuote.js.map