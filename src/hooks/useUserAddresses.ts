/**
 * useUserAddresses Hook
 * Load/save user addresses from Firestore (users/{uid}.addresses array)
 */

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface UserAddress {
  id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  instructions?: string;
  isDefault: boolean;
}

export function useUserAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to user document for addresses
  useEffect(() => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setAddresses(data.addresses || []);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [user]);

  // Save addresses to Firestore
  const saveAddresses = useCallback(async (newAddresses: UserAddress[]) => {
    if (!user) return;
    setAddresses(newAddresses);
    await updateDoc(doc(db, 'users', user.uid), {
      addresses: newAddresses,
      'metadata.updatedAt': serverTimestamp()
    });
  }, [user]);

  // Add a new address
  const addAddress = useCallback(async (address: Omit<UserAddress, 'id'>) => {
    const newAddr: UserAddress = { ...address, id: Date.now().toString() };
    let updated = [...addresses, newAddr];
    if (newAddr.isDefault) {
      updated = updated.map(a => a.id === newAddr.id ? a : { ...a, isDefault: false });
    }
    await saveAddresses(updated);
    return newAddr;
  }, [addresses, saveAddresses]);

  // Delete an address
  const deleteAddress = useCallback(async (id: string) => {
    await saveAddresses(addresses.filter(a => a.id !== id));
  }, [addresses, saveAddresses]);

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

  return { addresses, loading, saveAddresses, addAddress, deleteAddress, defaultAddress };
}
