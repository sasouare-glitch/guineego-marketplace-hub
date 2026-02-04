/**
 * PWA Installation & Update Hooks
 * Manages Progressive Web App installation prompts and updates
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isUpdateAvailable: false,
    isOfflineReady: false
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    setState(prev => ({ ...prev, isInstalled: isStandalone }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState(prev => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState(prev => ({ 
        ...prev, 
        isInstallable: false, 
        isInstalled: true 
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setState(prev => ({ ...prev, isOfflineReady: true }));

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setState(prev => ({ ...prev, isInstallable: false }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const update = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  }, []);

  return {
    ...state,
    install,
    update,
    canInstall: state.isInstallable && !state.isInstalled
  };
}

/**
 * Hook for displaying install instructions based on platform
 */
export function useInstallInstructions() {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const instructions = {
    ios: {
      title: 'Installer sur iPhone/iPad',
      steps: [
        'Appuyez sur le bouton Partager (📤)',
        'Faites défiler et appuyez sur "Sur l\'écran d\'accueil"',
        'Appuyez sur "Ajouter" en haut à droite'
      ],
      icon: '📤'
    },
    android: {
      title: 'Installer sur Android',
      steps: [
        'Appuyez sur le menu (⋮) en haut à droite',
        'Appuyez sur "Installer l\'application"',
        'Confirmez l\'installation'
      ],
      icon: '⋮'
    },
    desktop: {
      title: 'Installer sur ordinateur',
      steps: [
        'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
        'Ou utilisez le menu du navigateur',
        'Confirmez l\'installation'
      ],
      icon: '⬇️'
    },
    unknown: {
      title: 'Installer l\'application',
      steps: ['Utilisez le menu de votre navigateur pour installer l\'application'],
      icon: '📲'
    }
  };

  return { platform, instructions: instructions[platform] };
}
