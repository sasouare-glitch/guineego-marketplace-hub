/**
 * TRANSIT FUNCTION: Calculate Transit Quote
 * Auto-calculate China-Guinea shipping costs
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface QuoteData {
  weightKg: number;
  volumeM3?: number;
  method: 'air' | 'sea';
  insurance?: boolean;
  expressHandling?: boolean;
}

interface QuoteResult {
  method: string;
  weightCost: number;
  volumeCost: number;
  baseCost: number;
  insurance: number;
  expressFee: number;
  totalCost: number;
  estimatedDays: { min: number; max: number };
  currency: string;
}

// Pricing constants (GNF)
const PRICING = {
  air: {
    perKg: 12000,
    minWeight: 0.5,
    estimatedDays: { min: 7, max: 10 }
  },
  sea: {
    perKg: 3500,
    perM3: 2500000,
    minWeight: 1,
    estimatedDays: { min: 35, max: 45 }
  },
  insurance: 0.02, // 2% of cargo value
  expressFee: 0.15 // 15% surcharge
};

/**
 * Calculate transit quote
 * httpsCallable: calculateTransitQuote
 */
export const calculateTransitQuote = functions
  .region('europe-west1')
  .https.onCall(async (data: QuoteData): Promise<{ quotes: QuoteResult[] }> => {
    const { weightKg, volumeM3, method, insurance = false, expressHandling = false } = data;

    if (!weightKg || weightKg <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Poids requis et doit être positif'
      );
    }

    const quotes: QuoteResult[] = [];

    // Air freight quote
    if (!method || method === 'air') {
      const effectiveWeight = Math.max(weightKg, PRICING.air.minWeight);
      const baseCost = Math.ceil(effectiveWeight * PRICING.air.perKg);
      const insuranceCost = insurance ? Math.ceil(baseCost * PRICING.insurance) : 0;
      const expressFee = expressHandling ? Math.ceil(baseCost * PRICING.expressFee) : 0;

      quotes.push({
        method: 'Fret Aérien',
        weightCost: baseCost,
        volumeCost: 0,
        baseCost,
        insurance: insuranceCost,
        expressFee,
        totalCost: baseCost + insuranceCost + expressFee,
        estimatedDays: expressHandling 
          ? { min: 5, max: 7 }
          : PRICING.air.estimatedDays,
        currency: 'GNF'
      });
    }

    // Sea freight quote
    if (!method || method === 'sea') {
      const effectiveWeight = Math.max(weightKg, PRICING.sea.minWeight);
      const weightCost = Math.ceil(effectiveWeight * PRICING.sea.perKg);
      const volumeCost = volumeM3 ? Math.ceil(volumeM3 * PRICING.sea.perM3) : 0;
      
      // Use higher of weight or volume cost
      const baseCost = Math.max(weightCost, volumeCost);
      const insuranceCost = insurance ? Math.ceil(baseCost * PRICING.insurance) : 0;
      const expressFee = expressHandling ? Math.ceil(baseCost * PRICING.expressFee) : 0;

      quotes.push({
        method: 'Fret Maritime',
        weightCost,
        volumeCost,
        baseCost,
        insurance: insuranceCost,
        expressFee,
        totalCost: baseCost + insuranceCost + expressFee,
        estimatedDays: PRICING.sea.estimatedDays,
        currency: 'GNF'
      });
    }

    return { quotes };
  });
