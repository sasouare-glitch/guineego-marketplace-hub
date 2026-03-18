/**
 * Safe onSnapshot wrapper
 * Prevents Firestore SDK internal assertion crashes (ID: b815/ca9)
 * by wrapping listener setup in try-catch and ensuring safe cleanup.
 */

import {
  onSnapshot,
  type Query,
  type DocumentReference,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
  type SnapshotListenOptions,
} from 'firebase/firestore';

type Unsubscribe = () => void;

/**
 * Safely subscribe to a Firestore query with error handling.
 * Returns an unsubscribe function that is always safe to call.
 */
export function safeOnSnapshot<T extends DocumentData>(
  ref: Query<T> | DocumentReference<T>,
  onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void,
  onError?: (error: Error) => void,
  label?: string
): Unsubscribe {
  let unsub: Unsubscribe | undefined;
  try {
    unsub = onSnapshot(
      ref as any,
      (snapshot: any) => onNext(snapshot),
      (error: Error) => {
        if (onError) {
          onError(error);
        } else {
          console.error(`[safeOnSnapshot${label ? ` ${label}` : ''}] Error:`, error);
        }
      }
    );
  } catch (e) {
    console.error(`[safeOnSnapshot${label ? ` ${label}` : ''}] Failed to attach listener:`, e);
    if (onError) onError(e as Error);
  }

  // Return a safe unsubscribe function
  return () => {
    try {
      unsub?.();
    } catch (e) {
      // Ignore cleanup errors - SDK may already be in a bad state
    }
  };
}
