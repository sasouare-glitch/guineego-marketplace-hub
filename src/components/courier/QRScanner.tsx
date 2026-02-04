/**
 * QR Code Scanner Component for Couriers
 * Uses Capacitor Barcode Scanner on native, camera on web
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Package,
  MapPin,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBarcodeScanner, useCamera, useHaptics, useCapacitorPlatform } from '@/hooks/useCapacitor';
import { cn } from '@/lib/utils';

interface ScanResult {
  type: 'delivery' | 'package' | 'unknown';
  id: string;
  data?: {
    orderId?: string;
    customerName?: string;
    address?: string;
    status?: string;
  };
}

interface QRScannerProps {
  onScan: (result: ScanResult) => void;
  onClose?: () => void;
  mode?: 'pickup' | 'delivery' | 'scan';
}

export default function QRScanner({ onScan, onClose, mode = 'scan' }: QRScannerProps) {
  const { scan, stopScan, isScanning, isAvailable } = useBarcodeScanner();
  const { takePhoto } = useCamera();
  const { notification } = useHaptics();
  const { isNative } = useCapacitorPlatform();
  
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse QR code content
  const parseQRContent = useCallback((content: string): ScanResult => {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(content);
      
      if (data.missionId || data.deliveryId) {
        return {
          type: 'delivery',
          id: data.missionId || data.deliveryId,
          data: {
            orderId: data.orderId,
            customerName: data.customerName,
            address: data.address,
            status: data.status
          }
        };
      }
      
      if (data.packageId || data.trackingCode) {
        return {
          type: 'package',
          id: data.packageId || data.trackingCode,
          data: {
            orderId: data.orderId
          }
        };
      }
      
      return { type: 'unknown', id: content };
    } catch {
      // Not JSON, try to parse as GuineeGo format
      // Format: GGO-XXXXX or MIS-XXXXX
      if (content.startsWith('GGO-')) {
        return { type: 'package', id: content };
      }
      if (content.startsWith('MIS-')) {
        return { type: 'delivery', id: content };
      }
      
      return { type: 'unknown', id: content };
    }
  }, []);

  const handleScan = useCallback(async () => {
    setError(null);
    setIsProcessing(true);

    try {
      if (isAvailable) {
        // Use native barcode scanner
        const content = await scan();
        
        if (content) {
          const parsed = parseQRContent(content);
          setResult(parsed);
          notification('success');
          onScan(parsed);
        } else {
          setError('Aucun code QR détecté');
          notification('error');
        }
      } else {
        // Web fallback - use camera to take photo
        // In production, you'd use a JS QR library to decode
        setError('Scanner QR non disponible sur ce navigateur. Utilisez l\'application mobile.');
        notification('error');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Erreur lors du scan');
      notification('error');
    } finally {
      setIsProcessing(false);
    }
  }, [isAvailable, scan, parseQRContent, notification, onScan]);

  const handleCancel = useCallback(() => {
    stopScan();
    onClose?.();
  }, [stopScan, onClose]);

  const modeLabels = {
    pickup: 'Scanner pour récupérer',
    delivery: 'Scanner pour livrer',
    scan: 'Scanner le code QR'
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{modeLabels[mode]}</h2>
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] p-6">
        <AnimatePresence mode="wait">
          {!result && !error && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              {/* Scanner frame visualization */}
              <div className="relative w-64 h-64 mx-auto mb-8">
                <div className="absolute inset-0 border-2 border-dashed border-muted-foreground/30 rounded-xl" />
                
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Scanning animation */}
                {isScanning && (
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-primary"
                    animate={{ top: ['10%', '90%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <QrCode className={cn(
                    "w-16 h-16 text-muted-foreground/50",
                    isScanning && "animate-pulse text-primary"
                  )} />
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {isScanning 
                  ? 'Recherche d\'un code QR...'
                  : 'Placez le code QR dans le cadre'
                }
              </p>

              <Button 
                size="lg" 
                onClick={handleScan}
                disabled={isProcessing || isScanning}
                className="gap-2"
              >
                <Camera className="w-5 h-5" />
                {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
              </Button>

              {!isNative && (
                <p className="text-xs text-muted-foreground mt-4">
                  💡 Pour un scan optimal, utilisez l'app mobile
                </p>
              )}
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold">Code scanné !</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Package className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">ID</p>
                        <p className="font-mono font-medium">{result.id}</p>
                      </div>
                    </div>

                    {result.data?.customerName && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Client</p>
                          <p className="font-medium">{result.data.customerName}</p>
                        </div>
                      </div>
                    )}

                    {result.data?.address && (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Adresse</p>
                          <p className="font-medium text-sm">{result.data.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setResult(null)}
                      className="flex-1"
                    >
                      Nouveau scan
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      Confirmer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Erreur de scan</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
                <Button onClick={() => { setError(null); handleScan(); }}>
                  Réessayer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-muted/50">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <QrCode className="w-4 h-4" />
          <span>
            {mode === 'pickup' && 'Scannez le colis pour confirmer la récupération'}
            {mode === 'delivery' && 'Scannez le colis pour confirmer la livraison'}
            {mode === 'scan' && 'Scannez le code QR du colis ou de la mission'}
          </span>
        </div>
      </div>
    </div>
  );
}
