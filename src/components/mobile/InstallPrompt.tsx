/**
 * Install Prompt Banner
 * Shows a prompt to install the PWA
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export default function InstallPrompt() {
  const { canInstall, install, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Delay showing the prompt
    const timer = setTimeout(() => {
      if (canInstall && !isInstalled) {
        setIsVisible(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!canInstall || isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:bottom-6 md:w-80"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Installer GuineeGo
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Ajoutez l'app sur votre écran d'accueil pour un accès rapide
              </p>
              
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                Installer
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Compact install banner for header
 */
export function InstallBanner() {
  const { canInstall, install, isInstalled } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('install-banner-dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('install-banner-dismissed', 'true');
  };

  if (!canInstall || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <Download className="w-4 h-4" />
        <span>Installez l'app pour une meilleure expérience</span>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={install}
          className="ml-2 h-6 text-xs"
        >
          Installer
        </Button>
        <button 
          onClick={handleDismiss}
          className="ml-2 p-1 hover:bg-primary-foreground/20 rounded"
          aria-label="Fermer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/**
 * Update available banner
 */
export function UpdateBanner() {
  const { isUpdateAvailable, update } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-3 text-center"
    >
      <div className="flex items-center justify-center gap-3">
        <span className="text-sm">
          Une nouvelle version est disponible
        </span>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={update}
          className="h-7 text-xs"
        >
          Mettre à jour
        </Button>
      </div>
    </motion.div>
  );
}
