/**
 * useVisitorTracking — logs real visits via Firebase Analytics + Firestore counters
 * 
 * Writes to `seller_visits` collection with daily granularity per seller.
 * Document ID: `{sellerId}_{YYYY-MM-DD}`
 */
import { useEffect, useRef } from 'react';
import { logEvent } from 'firebase/analytics';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db, analytics } from '@/lib/firebase/config';

interface TrackVisitOptions {
  sellerId: string;
  productId?: string;
  productName?: string;
  page: 'product_detail' | 'seller_store' | 'marketplace';
}

export function useVisitorTracking(options: TrackVisitOptions | null) {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!options || !options.sellerId) return;

    // Deduplicate per session — don't track the same product/page twice
    const key = `${options.page}_${options.sellerId}_${options.productId || ''}`;
    if (tracked.current === key) return;
    tracked.current = key;

    // 1. Firebase Analytics event
    if (analytics) {
      try {
        logEvent(analytics, options.page === 'product_detail' ? 'view_item' : 'page_view', {
          page_title: options.page,
          seller_id: options.sellerId,
          ...(options.productId && { item_id: options.productId }),
          ...(options.productName && { item_name: options.productName }),
        });
      } catch (e) {
        console.warn('Analytics logEvent error:', e);
      }
    }

    // 2. Firestore daily counter per seller
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const counterDocId = `${options.sellerId}_${today}`;

    setDoc(
      doc(db, 'seller_visits', counterDocId),
      {
        sellerId: options.sellerId,
        date: today,
        views: increment(1),
        ...(options.page === 'product_detail' ? { productViews: increment(1) } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => {
      // Silently fail — visitor tracking should never block UX
      console.warn('Visitor tracking write failed:', err.message);
    });
  }, [options?.sellerId, options?.productId, options?.page]);
}
