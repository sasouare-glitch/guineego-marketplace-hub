/**
 * PAYMENTS FUNCTION: Calculate Fees
 * Delivery fees, transit fees, service charges
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Zone definitions for Conakry
const DELIVERY_ZONES: Record<string, { baseFee: number; perKm: number }> = {
  kaloum: { baseFee: 10000, perKm: 500 },
  dixinn: { baseFee: 10000, perKm: 500 },
  matam: { baseFee: 12000, perKm: 600 },
  ratoma: { baseFee: 15000, perKm: 700 },
  matoto: { baseFee: 15000, perKm: 700 },
  default: { baseFee: 20000, perKm: 1000 }
};

// Weight surcharges
const WEIGHT_SURCHARGES = [
  { maxKg: 2, surcharge: 0 },
  { maxKg: 5, surcharge: 3000 },
  { maxKg: 10, surcharge: 8000 },
  { maxKg: 20, surcharge: 15000 },
  { maxKg: 50, surcharge: 30000 },
  { maxKg: Infinity, surcharge: 50000 }
];

// Transit pricing (China to Guinea)
const TRANSIT_RATES = {
  standard: {
    perKg: 15000,      // GNF per kg
    minWeight: 1,
    estimatedDays: { min: 30, max: 45 }
  },
  express: {
    perKg: 35000,
    minWeight: 0.5,
    estimatedDays: { min: 15, max: 21 }
  },
  economy: {
    perKg: 8000,
    minWeight: 5,
    estimatedDays: { min: 45, max: 60 }
  }
};

// Courier payment rates
const COURIER_RATES = {
  basePerMission: 5000,        // Base payment per delivery
  perKm: 500,                  // Additional per km
  heavyItemBonus: 2000,        // > 10kg
  expressBonus: 3000,          // Express delivery
  peakHoursBonus: 1500,        // 12h-14h, 18h-20h
  rainBonus: 2000,             // Bad weather bonus
};

interface DeliveryFeeData {
  originCommune: string;
  destinationCommune: string;
  estimatedWeight?: number;
  isExpress?: boolean;
  itemCount?: number;
}

interface TransitQuoteData {
  weight: number;
  serviceType: 'standard' | 'express' | 'economy';
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue?: number;
}

interface CourierPaymentData {
  missionId: string;
}

/**
 * Calculate delivery fee
 * httpsCallable: calculateDeliveryFee
 */
export const calculateDeliveryFee = functions
  .region('europe-west1')
  .https.onCall(async (data: DeliveryFeeData, context) => {
    const { 
      originCommune, 
      destinationCommune, 
      estimatedWeight = 1,
      isExpress = false,
      itemCount = 1
    } = data;

    if (!originCommune || !destinationCommune) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'originCommune et destinationCommune sont requis'
      );
    }

    try {
      // Get zone rates
      const zoneKey = destinationCommune.toLowerCase();
      const zone = DELIVERY_ZONES[zoneKey] || DELIVERY_ZONES.default;

      // Estimate distance (simplified - in production use Maps API)
      const estimatedDistance = estimateDistance(originCommune, destinationCommune);

      // Base fee
      let totalFee = zone.baseFee;

      // Distance fee
      if (estimatedDistance > 3) {
        totalFee += (estimatedDistance - 3) * zone.perKm;
      }

      // Weight surcharge
      const weightSurcharge = WEIGHT_SURCHARGES.find(w => estimatedWeight <= w.maxKg);
      if (weightSurcharge) {
        totalFee += weightSurcharge.surcharge;
      }

      // Express surcharge (50%)
      if (isExpress) {
        totalFee = Math.round(totalFee * 1.5);
      }

      // Multi-item discount (-10% per additional item, max -30%)
      if (itemCount > 1) {
        const discount = Math.min((itemCount - 1) * 0.1, 0.3);
        totalFee = Math.round(totalFee * (1 - discount));
      }

      // Round to nearest 1000 GNF
      totalFee = Math.ceil(totalFee / 1000) * 1000;

      return {
        success: true,
        fee: totalFee,
        breakdown: {
          baseFee: zone.baseFee,
          distanceFee: estimatedDistance > 3 ? (estimatedDistance - 3) * zone.perKm : 0,
          weightSurcharge: weightSurcharge?.surcharge || 0,
          expressMultiplier: isExpress ? 1.5 : 1,
          multiItemDiscount: itemCount > 1 ? Math.min((itemCount - 1) * 0.1, 0.3) : 0
        },
        estimatedDelivery: isExpress 
          ? { min: 1, max: 2, unit: 'heures' }
          : { min: 1, max: 3, unit: 'jours' }
      };

    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du calcul des frais de livraison'
      );
    }
  });

/**
 * Calculate transit quote (China to Guinea)
 * httpsCallable: calculateTransitQuote
 */
export const calculateTransitQuote = functions
  .region('europe-west1')
  .https.onCall(async (data: TransitQuoteData, context) => {
    const { weight, serviceType, dimensions, declaredValue } = data;

    if (!weight || !serviceType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'weight et serviceType sont requis'
      );
    }

    const rates = TRANSIT_RATES[serviceType];
    if (!rates) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Service type invalide'
      );
    }

    if (weight < rates.minWeight) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Poids minimum pour ${serviceType}: ${rates.minWeight} kg`
      );
    }

    try {
      // Calculate volumetric weight if dimensions provided
      let billableWeight = weight;
      if (dimensions) {
        const volumetricWeight = (dimensions.length * dimensions.width * dimensions.height) / 5000;
        billableWeight = Math.max(weight, volumetricWeight);
      }

      // Base shipping cost
      let shippingCost = Math.round(billableWeight * rates.perKg);

      // Insurance (optional, based on declared value)
      let insuranceCost = 0;
      if (declaredValue && declaredValue > 0) {
        insuranceCost = Math.round(declaredValue * 0.02); // 2% of declared value
      }

      // Customs handling fee (flat rate)
      const customsFee = 50000; // 50,000 GNF

      // Total
      const totalCost = shippingCost + insuranceCost + customsFee;

      return {
        success: true,
        quote: {
          shippingCost,
          insuranceCost,
          customsFee,
          totalCost,
          currency: 'GNF'
        },
        details: {
          actualWeight: weight,
          billableWeight,
          volumetricWeight: dimensions 
            ? (dimensions.length * dimensions.width * dimensions.height) / 5000 
            : null,
          ratePerKg: rates.perKg,
          serviceType
        },
        estimatedDelivery: {
          minDays: rates.estimatedDays.min,
          maxDays: rates.estimatedDays.max
        },
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

    } catch (error) {
      console.error('Error calculating transit quote:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du calcul du devis transit'
      );
    }
  });

/**
 * Calculate courier payment for mission
 * httpsCallable: calculateCourierPayment
 */
export const calculateCourierPayment = functions
  .region('europe-west1')
  .https.onCall(async (data: CourierPaymentData, context) => {
    const { missionId } = data;

    if (!missionId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'missionId est requis'
      );
    }

    try {
      const missionDoc = await db.collection('deliveries').doc(missionId).get();

      if (!missionDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Mission non trouvée');
      }

      const mission = missionDoc.data()!;

      // Base payment
      let payment = COURIER_RATES.basePerMission;

      // Distance bonus
      const distance = mission.estimatedDistance || 0;
      if (distance > 2) {
        payment += (distance - 2) * COURIER_RATES.perKm;
      }

      // Heavy item bonus
      if (mission.totalWeight && mission.totalWeight > 10) {
        payment += COURIER_RATES.heavyItemBonus;
      }

      // Express bonus
      if (mission.isExpress) {
        payment += COURIER_RATES.expressBonus;
      }

      // Peak hours bonus (check pickup/delivery time)
      const hour = new Date(mission.scheduledPickup).getHours();
      if ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 20)) {
        payment += COURIER_RATES.peakHoursBonus;
      }

      // Round to nearest 500 GNF
      payment = Math.ceil(payment / 500) * 500;

      return {
        success: true,
        payment,
        breakdown: {
          base: COURIER_RATES.basePerMission,
          distanceBonus: distance > 2 ? (distance - 2) * COURIER_RATES.perKm : 0,
          heavyItemBonus: mission.totalWeight > 10 ? COURIER_RATES.heavyItemBonus : 0,
          expressBonus: mission.isExpress ? COURIER_RATES.expressBonus : 0,
          peakHoursBonus: ((hour >= 12 && hour < 14) || (hour >= 18 && hour < 20)) 
            ? COURIER_RATES.peakHoursBonus : 0
        }
      };

    } catch (error: any) {
      console.error('Error calculating courier payment:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors du calcul du paiement coursier'
      );
    }
  });

/**
 * Estimate distance between communes (simplified)
 * In production, use Google Maps Distance Matrix API
 */
function estimateDistance(origin: string, destination: string): number {
  const distances: Record<string, Record<string, number>> = {
    kaloum: { kaloum: 2, dixinn: 4, matam: 6, ratoma: 10, matoto: 12 },
    dixinn: { kaloum: 4, dixinn: 2, matam: 4, ratoma: 8, matoto: 10 },
    matam: { kaloum: 6, dixinn: 4, matam: 2, ratoma: 6, matoto: 8 },
    ratoma: { kaloum: 10, dixinn: 8, matam: 6, ratoma: 3, matoto: 5 },
    matoto: { kaloum: 12, dixinn: 10, matam: 8, ratoma: 5, matoto: 3 }
  };

  const o = origin.toLowerCase();
  const d = destination.toLowerCase();

  return distances[o]?.[d] || distances[d]?.[o] || 15;
}
