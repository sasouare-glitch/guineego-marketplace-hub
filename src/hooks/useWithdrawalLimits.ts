/**
 * useWithdrawalLimits Hook
 * Fetch and manage configurable withdrawal limits from Firestore
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

export interface WithdrawalLimits {
  minAmount: number;       // Minimum withdrawal amount (GNF)
  maxAmount: number;       // Maximum per transaction (GNF)
  dailyLimit: number;      // Maximum per day (GNF)
  feePercent: number;      // Fee percentage (e.g. 1 = 1%)
  minFee: number;          // Minimum fee (GNF)
  sellerMinAmount?: number;  // Override for sellers
  sellerMaxAmount?: number;  // Override for sellers
  courierMinAmount?: number; // Override for couriers
  courierMaxAmount?: number; // Override for couriers
  updatedAt?: Date;
  updatedBy?: string;
}

const DEFAULT_LIMITS: WithdrawalLimits = {
  minAmount: 10000,
  maxAmount: 5000000,
  dailyLimit: 10000000,
  feePercent: 1,
  minFee: 500,
};

const CONFIG_DOC = 'withdrawal_limits';
const CONFIG_COLLECTION = 'platform_config';

export function useWithdrawalLimits() {
  const [limits, setLimits] = useState<WithdrawalLimits>(DEFAULT_LIMITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setLimits({
            ...DEFAULT_LIMITS,
            ...data,
            updatedAt: data.updatedAt?.toDate?.() || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching withdrawal limits:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLimits();
  }, []);

  const saveLimits = async (newLimits: Partial<WithdrawalLimits>) => {
    try {
      const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
      const merged = { ...limits, ...newLimits, updatedAt: new Date() };
      await setDoc(docRef, merged, { merge: true });
      setLimits(merged);
      toast.success('Plafonds de retrait mis à jour');
      return true;
    } catch (error) {
      console.error('Error saving withdrawal limits:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  // Get effective limits for a role
  const getEffectiveLimits = (role: 'seller' | 'courier') => {
    if (role === 'seller') {
      return {
        minAmount: limits.sellerMinAmount || limits.minAmount,
        maxAmount: limits.sellerMaxAmount || limits.maxAmount,
        dailyLimit: limits.dailyLimit,
        feePercent: limits.feePercent,
        minFee: limits.minFee,
      };
    }
    return {
      minAmount: limits.courierMinAmount || limits.minAmount,
      maxAmount: limits.courierMaxAmount || limits.maxAmount,
      dailyLimit: limits.dailyLimit,
      feePercent: limits.feePercent,
      minFee: limits.minFee,
    };
  };

  return { limits, loading, saveLimits, getEffectiveLimits, DEFAULT_LIMITS };
}
