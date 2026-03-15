/**
 * Hook to manage seller subscription plan
 * Reads/writes to seller_settings document in Firestore
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { type SellerPlanId, getPlanById, type SellerPlan } from '@/constants/sellerPlans';
import { toast } from 'sonner';

interface SellerSubscriptionData {
  planId: SellerPlanId;
  subscribedAt?: Date;
  expiresAt?: Date;
}

export function useSellerSubscription() {
  const { user } = useAuth();
  const [planId, setPlanId] = useState<SellerPlanId>('free');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'seller_settings', user.uid),
      (snap) => {
        const data = snap.data();
        setPlanId((data?.subscription?.planId as SellerPlanId) || 'free');
        const exp = data?.subscription?.expiresAt;
        setExpiresAt(exp?.toDate?.() || null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user?.uid]);

  const currentPlan: SellerPlan = getPlanById(planId);

  const upgradePlan = async (newPlanId: SellerPlanId, paymentMethod?: string) => {
    if (!user?.uid) return;
    try {
      const newPlan = getPlanById(newPlanId);

      // Calculate expiry: 30 days from now for paid plans
      const expiresAt = newPlan.price > 0
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      await updateDoc(doc(db, 'seller_settings', user.uid), {
        subscription: {
          planId: newPlanId,
          planName: newPlan.name,
          subscribedAt: serverTimestamp(),
          ...(expiresAt ? { expiresAt } : {}),
        },
        updatedAt: serverTimestamp(),
      });

      // Log payment in subscription_payments sub-collection
      await addDoc(collection(db, 'seller_settings', user.uid, 'subscription_payments'), {
        planId: newPlanId,
        planName: newPlan.name,
        amount: newPlan.price,
        paymentMethod: paymentMethod || 'unknown',
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      toast.success(`Abonnement mis à jour : ${newPlan.name}`);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      toast.error("Erreur lors de la mise à jour de l'abonnement");
    }
  };

  return { planId, currentPlan, loading, upgradePlan };
}
