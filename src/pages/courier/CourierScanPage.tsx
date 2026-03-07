import QRScanner from '@/components/courier/QRScanner';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function CourierScanPage() {
  const navigate = useNavigate();

  return (
    <QRScanner
      mode="scan"
      onScan={(result) => {
        toast.success(`Code scanné : ${result.id}`);
        if (result.type === 'delivery' && result.id.startsWith('MIS-')) {
          navigate(`/courier/mission/${result.id}`);
        }
      }}
      onClose={() => navigate('/courier')}
    />
  );
}
