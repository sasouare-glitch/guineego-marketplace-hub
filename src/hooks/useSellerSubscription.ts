/**
 * Hook to manage seller subscription plan
 * Reads/writes to seller_settings document in Firestore
 * Integrates with Orange Money API via Cloud Function for paid plans
 */

import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { safeOnSnapshot } from '@/lib/firebase/safeSnapshot';
import { useAuth } from '@/contexts/AuthContext';
import { type SellerPlanId, getPlanById, type SellerPlan } from '@/constants/sellerPlans';
import { toast } from 'sonner';

interface SellerSubscriptionData {
  planId: SellerPlanId;
  subscribedAt?: Date;
  expiresAt?: Date;
}

interface OrangePaymentResult {
  success: boolean;
  paymentId: string;
  paymentUrl: string;
  payToken: string;
}

interface MTNPaymentResult {
  success: boolean;
  paymentId: string;
  referenceId: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  autoConfirmed?: boolean;
  reason?: string;
}

export function useSellerSubscription() {
  const { user } = useAuth();
  const [planId, setPlanId] = useState<SellerPlanId>('free');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingPayment, setPendingPayment] = useState<{
    planId: string;
    planName: string;
    amount: number;
    paymentMethod: string;
    createdAt: Date | null;
  } | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsub = safeOnSnapshot(
      doc(db, 'seller_settings', user.uid),
      (snap: any) => {
        const data = snap.data();
        setPlanId((data?.subscription?.planId as SellerPlanId) || 'free');
        const exp = data?.subscription?.expiresAt;
        setExpiresAt(exp?.toDate?.() || null);
        setLoading(false);
      },
      () => setLoading(false),
      'sellerSubscription'
    );

    return () => unsub();
  }, [user?.uid]);

  // Listen for pending payments
  useEffect(() => {
    if (!user?.uid) {
      setPendingPayment(null);
      return;
    }

    const pendingQuery = query(
      collection(db, 'seller_settings', user.uid, 'subscription_payments'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsub = safeOnSnapshot(
      pendingQuery,
      (snap: any) => {
        if (snap.empty) {
          setPendingPayment(null);
        } else {
          const data = snap.docs[0].data();
          setPendingPayment({
            planId: data.planId,
            planName: data.planName,
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            createdAt: data.createdAt?.toDate?.() || null,
          });
        }
      },
      () => setPendingPayment(null),
      'sellerPendingPayment'
    );

    return () => unsub();
  }, [user?.uid]);

  const currentPlan: SellerPlan = getPlanById(planId);

  const upgradePlan = async (newPlanId: SellerPlanId, paymentMethod?: string, phone?: string) => {
    if (!user?.uid) return;
    try {
      const newPlan = getPlanById(newPlanId);
      const isFree = newPlan.price === 0;

      // ── Orange Money: initiate real payment via Cloud Function ──
      if (!isFree && paymentMethod === 'orange_money') {
        if (!phone) {
          toast.error('Veuillez entrer votre numéro Orange Money.');
          return;
        }

        toast.info('Initiation du paiement Orange Money...', { duration: 3000 });

        const initiatePayment = callFunction<
          { planId: string; planName: string; amount: number; phone: string; paymentMethod: string },
          OrangePaymentResult
        >('initiateOrangeMoneyPayment');

        const result = await initiatePayment({
          planId: newPlanId,
          planName: newPlan.name,
          amount: newPlan.price,
          phone,
          paymentMethod: 'orange_money',
        });

        if (result.data.success && result.data.paymentUrl) {
          // Redirect to Orange Money payment page
          toast.success(
            'Redirection vers Orange Money... Complétez le paiement pour activer votre plan.',
            { duration: 6000 }
          );
          window.open(result.data.paymentUrl, '_blank');
        } else {
          toast.info(
            'Paiement en attente — suivez les instructions USSD pour confirmer. Votre plan sera mis à jour après réception du paiement.',
            { duration: 8000 }
          );
        }
        return;
      }

      // ── MTN Money: initiate real payment via Cloud Function ──
      if (!isFree && paymentMethod === 'mtn_money') {
        if (!phone) {
          toast.error('Veuillez entrer votre numéro MTN Money.');
          return;
        }

        toast.info('Initiation du paiement MTN MoMo...', { duration: 3000 });

        const initiatePayment = callFunction<
          { planId: string; planName: string; amount: number; phone: string },
          MTNPaymentResult
        >('initiateMTNMoMoPayment');

        const result = await initiatePayment({
          planId: newPlanId,
          planName: newPlan.name,
          amount: newPlan.price,
          phone,
        });

        if (result.data.autoConfirmed && result.data.status === 'SUCCESSFUL') {
          toast.success(`Paiement confirmé ! Plan ${newPlan.name} activé.`, { duration: 6000 });
        } else if (result.data.status === 'FAILED') {
          toast.error(result.data.reason || 'Le paiement MTN MoMo a échoué. Veuillez réessayer.');
        } else {
          toast.info(
            'Un prompt USSD a été envoyé sur votre téléphone. Confirmez le paiement pour activer votre plan.',
            { duration: 8000 }
          );
        }
        return;
      }

      // ── Free plans or card payments: apply immediately ──
      const newExpiresAt = newPlan.price > 0
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      await updateDoc(doc(db, 'seller_settings', user.uid), {
        subscription: {
          planId: newPlanId,
          planName: newPlan.name,
          subscribedAt: serverTimestamp(),
          ...(newExpiresAt ? { expiresAt: newExpiresAt } : {}),
        },
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'seller_settings', user.uid, 'subscription_payments'), {
        planId: newPlanId,
        planName: newPlan.name,
        amount: newPlan.price,
        paymentMethod: paymentMethod || 'unknown',
        status: 'completed',
        createdAt: serverTimestamp(),
      });

      toast.success(`Abonnement mis à jour : ${newPlan.name}`);
    } catch (err: any) {
      console.error('Error upgrading plan:', err);
      const message = err?.message || "Erreur lors de la mise à jour de l'abonnement";
      toast.error(message);
    }
  };

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return { planId, currentPlan, loading, upgradePlan, expiresAt, daysRemaining, pendingPayment };
}
