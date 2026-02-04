/**
 * useWallet Hook
 * Wallet balance, transactions, and withdrawal management
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  doc, 
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db, callFunction } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Types
export interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  totalEarnings: number;
  totalSales?: number;
  totalCommissions?: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  completedMissions?: number;
  totalInvestmentReturns?: number;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  category: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, any>;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: 'orange_money' | 'mtn_money';
  phone: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface WithdrawalRequest {
  amount: number;
  method: 'orange_money' | 'mtn_money';
  phone: string;
  note?: string;
}

/**
 * Hook for real-time wallet balance
 */
export function useWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    const walletRef = doc(db, 'wallets', user.uid);
    
    const unsubscribe = onSnapshot(
      walletRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setWallet({
            ...data,
            lastTransactionAt: data.lastTransactionAt?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Wallet);
        } else {
          // No wallet yet - will be created on first transaction
          setWallet({
            userId: user.uid,
            balance: 0,
            currency: 'GNF',
            totalEarnings: 0,
            totalWithdrawals: 0,
            pendingWithdrawals: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Wallet subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { wallet, loading, error };
}

/**
 * Hook for transaction history with pagination
 */
export function useTransactions(pageSize = 20) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const fetchTransactions = useCallback(async (reset = false) => {
    if (!user) return;

    setLoading(true);

    try {
      let q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      const newTransactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Transaction[];

      if (reset) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [user, pageSize, lastDoc]);

  useEffect(() => {
    fetchTransactions(true);
  }, [user]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchTransactions(false);
    }
  }, [loading, hasMore, fetchTransactions]);

  const refresh = useCallback(() => {
    setLastDoc(null);
    fetchTransactions(true);
  }, [fetchTransactions]);

  return { transactions, loading, hasMore, loadMore, refresh };
}

/**
 * Hook for withdrawal operations
 */
export function useWithdrawal() {
  const queryClient = useQueryClient();

  const requestWithdrawalFn = callFunction<WithdrawalRequest, any>('requestWithdrawal');

  const requestWithdrawal = useMutation({
    mutationFn: async (data: WithdrawalRequest) => {
      const result = await requestWithdrawalFn(data);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('Demande de retrait soumise', {
        description: `${data.amount.toLocaleString()} GNF seront transférés sous 24h`
      });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
    },
    onError: (error: any) => {
      toast.error('Erreur', {
        description: error.message || 'Impossible de soumettre la demande'
      });
    }
  });

  return {
    requestWithdrawal: requestWithdrawal.mutate,
    isLoading: requestWithdrawal.isPending,
    error: requestWithdrawal.error
  };
}

/**
 * Hook for withdrawal history
 */
export function useWithdrawalHistory() {
  const { user } = useAuth();
  const getHistoryFn = callFunction<{ limit?: number; startAfter?: string }, any>('getWithdrawalHistory');

  return useQuery({
    queryKey: ['withdrawals', user?.uid],
    queryFn: async () => {
      const result = await getHistoryFn({ limit: 50 });
      return result.data.withdrawals as Withdrawal[];
    },
    enabled: !!user,
    staleTime: 30 * 1000 // 30 seconds
  });
}

/**
 * Hook for payment processing
 */
export function usePayment() {
  const queryClient = useQueryClient();
  const processPaymentFn = callFunction<{
    orderId: string;
    paymentId: string;
    method: 'orange_money' | 'mtn_money' | 'wallet';
    phone?: string;
  }, any>('processPayment');

  const processPayment = useMutation({
    mutationFn: async (data: {
      orderId: string;
      paymentId: string;
      method: 'orange_money' | 'mtn_money' | 'wallet';
      phone?: string;
    }) => {
      const result = await processPaymentFn(data);
      return result.data;
    },
    onSuccess: (data) => {
      if (data.status === 'completed') {
        toast.success('Paiement effectué !');
      } else {
        toast.info('Paiement en cours', {
          description: 'Suivez les instructions pour confirmer'
        });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      toast.error('Erreur de paiement', {
        description: error.message
      });
    }
  });

  return {
    processPayment: processPayment.mutate,
    isProcessing: processPayment.isPending,
    error: processPayment.error,
    data: processPayment.data
  };
}

/**
 * Hook for calculating delivery fees
 */
export function useDeliveryFee() {
  const calculateFeeFn = callFunction<{
    originCommune: string;
    destinationCommune: string;
    estimatedWeight?: number;
    isExpress?: boolean;
    itemCount?: number;
  }, any>('calculateDeliveryFee');

  const [fee, setFee] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<{ min: number; max: number; unit: string } | null>(null);

  const calculate = useCallback(async (params: {
    originCommune: string;
    destinationCommune: string;
    estimatedWeight?: number;
    isExpress?: boolean;
    itemCount?: number;
  }) => {
    setLoading(true);
    try {
      const result = await calculateFeeFn(params);
      const data = result.data;
      setFee(data.fee);
      setBreakdown(data.breakdown);
      setEstimatedDelivery(data.estimatedDelivery);
      return data;
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [calculateFeeFn]);

  return { fee, breakdown, estimatedDelivery, loading, calculate };
}

/**
 * Hook for transit quotes (China to Guinea)
 */
export function useTransitQuote() {
  const calculateQuoteFn = callFunction<{
    weight: number;
    serviceType: 'standard' | 'express' | 'economy';
    dimensions?: { length: number; width: number; height: number };
    declaredValue?: number;
  }, any>('calculateTransitFee');

  const calculateQuote = useMutation({
    mutationFn: async (params: {
      weight: number;
      serviceType: 'standard' | 'express' | 'economy';
      dimensions?: { length: number; width: number; height: number };
      declaredValue?: number;
    }) => {
      const result = await calculateQuoteFn(params);
      return result.data;
    }
  });

  return {
    calculate: calculateQuote.mutate,
    quote: calculateQuote.data,
    isLoading: calculateQuote.isPending,
    error: calculateQuote.error
  };
}

/**
 * Format currency in GNF
 */
export function formatGNF(amount: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
