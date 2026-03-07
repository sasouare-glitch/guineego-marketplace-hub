/**
 * Hook to manage FCM push notification registration
 * Requests permission, gets token, and saves to Firestore
 */

import { useEffect, useCallback, useState } from 'react';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [token, setToken] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  // Check if FCM is supported
  useEffect(() => {
    isSupported().then(setSupported).catch(() => setSupported(false));
  }, []);

  // Save token to Firestore
  const saveToken = useCallback(async (fcmToken: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmTokens: arrayUnion(fcmToken),
      });
      setToken(fcmToken);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }, [user]);

  // Remove token from Firestore
  const removeToken = useCallback(async (fcmToken: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmTokens: arrayRemove(fcmToken),
      });
      setToken(null);
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }, [user]);

  // Request permission and register token
  const requestPermission = useCallback(async () => {
    if (!supported || !user) {
      toast.error('Les notifications push ne sont pas supportées sur ce navigateur');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const messaging = getMessaging(app);
        const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (fcmToken) {
          await saveToken(fcmToken);
          toast.success('Notifications push activées !');
          return true;
        }
      } else {
        toast.error('Permission refusée pour les notifications');
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return false;
    }
  }, [supported, user, saveToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (!supported || permission !== 'granted') return;

    let unsubscribe: (() => void) | undefined;

    isSupported().then((yes) => {
      if (!yes) return;
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        if (title) {
          toast(title, { description: body });
        }
      });
    });

    return () => unsubscribe?.();
  }, [supported, permission]);

  return {
    supported,
    permission,
    token,
    requestPermission,
    removeToken: token ? () => removeToken(token) : undefined,
  };
}
