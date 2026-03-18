import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { safeOnSnapshot } from '@/lib/firebase/safeSnapshot';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export function useProductReviews(productId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [productId]);

  const submitReview = useCallback(async (rating: number, comment: string) => {
    if (!user || !productId) throw new Error('Non authentifié');

    const userName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Utilisateur';

    await addDoc(collection(db, 'reviews'), {
      productId,
      userId: user.uid,
      userName,
      rating,
      comment: comment.trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }, [user, profile, productId]);

  const userHasReviewed = reviews.some(r => r.userId === user?.uid);

  return { reviews, loading, submitReview, userHasReviewed };
}
