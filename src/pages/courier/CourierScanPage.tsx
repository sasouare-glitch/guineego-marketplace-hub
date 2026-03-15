import { useState } from 'react';
import QRScanner from '@/components/courier/QRScanner';
import { useNavigate } from 'react-router-dom';
import { useCourierMissions } from '@/hooks/useCourierMissions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CourierScanPage() {
  const navigate = useNavigate();
  const { myMissions, updateMissionStatus } = useCourierMissions();
  const [processing, setProcessing] = useState(false);

  const handleScan = async (result: any) => {
    // Check if it's a GuineeGo OrderQRCode payload
    if (result.data?.app === 'guineego' && result.data?.orderId && result.data?.purpose) {
      const { orderId, purpose, token } = result.data;

      // Verify token
      const expectedToken = btoa(`${orderId}:${purpose}:guineego`).replace(/=/g, '');
      if (token !== expectedToken) {
        toast.error('QR code invalide ou falsifié');
        return;
      }

      // Find the matching mission
      const mission = myMissions.find((m) => m.orderId === orderId);
      if (!mission) {
        toast.error('Aucune mission trouvée pour cette commande');
        return;
      }

      // Determine new status based on purpose
      const newStatus = purpose === 'pickup' ? 'picked_up' : 'delivered';

      // Validate status transition
      if (purpose === 'pickup' && !['accepted', 'pickup_started'].includes(mission.status)) {
        toast.error(`Impossible : la mission est au statut "${mission.status}"`);
        return;
      }
      if (purpose === 'delivery' && !['picked_up', 'in_transit', 'arrived'].includes(mission.status)) {
        toast.error(`Impossible : la mission est au statut "${mission.status}"`);
        return;
      }

      setProcessing(true);
      try {
        const note = purpose === 'pickup'
          ? 'Colis récupéré (confirmé par scan QR)'
          : 'Colis livré (confirmé par scan QR)';
        
        await updateMissionStatus(mission.id, newStatus, note);

        toast.success(
          purpose === 'pickup'
            ? '📦 Colis récupéré avec succès !'
            : '✅ Livraison confirmée avec succès !',
          { duration: 5000 }
        );

        // Navigate to mission detail
        navigate(`/courier/mission/${mission.id}`);
      } catch (err) {
        toast.error('Erreur lors de la mise à jour du statut');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Fallback: old behavior
    toast.success(`Code scanné : ${result.id}`);
    if (result.type === 'delivery' && result.id.startsWith('MIS-')) {
      navigate(`/courier/mission/${result.id}`);
    }
  };

  if (processing) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Mise à jour du statut...</p>
        </div>
      </div>
    );
  }

  return (
    <QRScanner
      mode="scan"
      onScan={handleScan}
      onClose={() => navigate('/courier')}
    />
  );
}
