/**
 * Capacitor Native Features Hooks
 * Provides access to native device capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// ============================================
// PLATFORM DETECTION
// ============================================

export function useCapacitorPlatform() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isWeb = platform === 'web';

  return { isNative, platform, isIOS, isAndroid, isWeb };
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

interface PushNotificationState {
  token: string | null;
  isRegistered: boolean;
  hasPermission: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isRegistered: false,
    hasPermission: false
  });
  const { isNative } = useCapacitorPlatform();

  const register = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications not available on web');
      return null;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return null;
      }

      // Register with APNs / FCM
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success:', token.value);
        setState(prev => ({
          ...prev,
          token: token.value,
          isRegistered: true,
          hasPermission: true
        }));
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received:', notification);
      });

      // Listen for push notification action performed
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed:', notification);
      });

      return state.token;
    } catch (error) {
      console.error('Failed to register push notifications:', error);
      return null;
    }
  }, [isNative, state.token]);

  return { ...state, register };
}

// ============================================
// GEOLOCATION
// ============================================

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isTracking: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    isTracking: false,
    error: null
  });
  const { isNative } = useCapacitorPlatform();

  const getCurrentPosition = useCallback(async () => {
    try {
      if (isNative) {
        const { Geolocation } = await import('@capacitor/geolocation');
        
        // Check permissions
        const permissions = await Geolocation.checkPermissions();
        if (permissions.location !== 'granted') {
          const request = await Geolocation.requestPermissions();
          if (request.location !== 'granted') {
            throw new Error('Location permission denied');
          }
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isTracking: false,
          error: null
        });

        return position.coords;
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setState({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                isTracking: false,
                error: null
              });
              resolve(position.coords);
            },
            (error) => {
              setState(prev => ({ ...prev, error: error.message }));
              reject(error);
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [isNative]);

  const startTracking = useCallback(async (onUpdate: (coords: GeolocationCoordinates) => void) => {
    setState(prev => ({ ...prev, isTracking: true }));

    if (isNative) {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (position, err) => {
          if (position) {
            setState({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              isTracking: true,
              error: null
            });
            onUpdate(position.coords as GeolocationCoordinates);
          }
          if (err) {
            setState(prev => ({ ...prev, error: err.message }));
          }
        }
      );

      return () => {
        Geolocation.clearWatch({ id: watchId });
        setState(prev => ({ ...prev, isTracking: false }));
      };
    } else {
      // Web fallback
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            isTracking: true,
            error: null
          });
          onUpdate(position.coords);
        },
        (error) => {
          setState(prev => ({ ...prev, error: error.message }));
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        setState(prev => ({ ...prev, isTracking: false }));
      };
    }
  }, [isNative]);

  return { ...state, getCurrentPosition, startTracking };
}

// ============================================
// CAMERA & BARCODE SCANNER
// ============================================

interface CameraResult {
  base64?: string;
  dataUrl?: string;
  path?: string;
}

export function useCamera() {
  const { isNative } = useCapacitorPlatform();

  const takePhoto = useCallback(async (): Promise<CameraResult | null> => {
    try {
      if (isNative) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
          saveToGallery: false,
          width: 1200,
          height: 1200
        });

        return {
          base64: image.base64String,
          dataUrl: `data:image/${image.format};base64,${image.base64String}`
        };
      } else {
        // Web fallback - use file input
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: reader.result as string,
                  base64: (reader.result as string).split(',')[1]
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          
          input.click();
        });
      }
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  }, [isNative]);

  const pickFromGallery = useCallback(async (): Promise<CameraResult | null> => {
    try {
      if (isNative) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
          width: 1200,
          height: 1200
        });

        return {
          base64: image.base64String,
          dataUrl: `data:image/${image.format};base64,${image.base64String}`
        };
      } else {
        // Web fallback
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: reader.result as string,
                  base64: (reader.result as string).split(',')[1]
                });
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          
          input.click();
        });
      }
    } catch (error) {
      console.error('Gallery error:', error);
      return null;
    }
  }, [isNative]);

  return { takePhoto, pickFromGallery };
}

// ============================================
// BARCODE SCANNER (QR Codes)
// ============================================

export function useBarcodeScanner() {
  const { isNative } = useCapacitorPlatform();
  const [isScanning, setIsScanning] = useState(false);

  const scan = useCallback(async (): Promise<string | null> => {
    if (!isNative) {
      console.warn('Barcode scanner not available on web');
      return null;
    }

    try {
      setIsScanning(true);
      const barcodeModule = await import('@capacitor/barcode-scanner');
      const CapacitorBarcodeScanner = barcodeModule.CapacitorBarcodeScanner;
      
      // Use the CapacitorBarcodeScanner API
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: barcodeModule.CapacitorBarcodeScannerTypeHint.QR_CODE
      });

      if (result.ScanResult) {
        return result.ScanResult;
      }
      return null;
    } catch (error) {
      console.error('Barcode scanner error:', error);
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [isNative]);

  const stopScan = useCallback(async () => {
    // The new API handles this automatically
    setIsScanning(false);
  }, []);

  return { scan, stopScan, isScanning, isAvailable: isNative };
}

// ============================================
// HAPTIC FEEDBACK
// ============================================

export function useHaptics() {
  const { isNative } = useCapacitorPlatform();

  const impact = useCallback(async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isNative) {
      // Web fallback using Vibration API
      if ('vibrate' in navigator) {
        const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30;
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      }[style];
      
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Haptics error:', error);
    }
  }, [isNative]);

  const notification = useCallback(async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isNative) {
      if ('vibrate' in navigator) {
        const pattern = type === 'success' ? [10, 50, 10] : type === 'warning' ? [20, 100, 20] : [30, 50, 30, 50, 30];
        navigator.vibrate(pattern);
      }
      return;
    }

    try {
      const { Haptics, NotificationType } = await import('@capacitor/haptics');
      const notificationType = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error
      }[type];
      
      await Haptics.notification({ type: notificationType });
    } catch (error) {
      console.error('Haptics notification error:', error);
    }
  }, [isNative]);

  return { impact, notification };
}

// ============================================
// NETWORK STATUS
// ============================================

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionType(connection.effectiveType || 'unknown');
      connection.addEventListener('change', () => {
        setConnectionType(connection.effectiveType || 'unknown');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}
