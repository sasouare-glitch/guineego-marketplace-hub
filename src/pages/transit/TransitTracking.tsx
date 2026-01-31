import { TransitLayout } from "@/components/transit/TransitLayout";
import { ShipmentTracker } from "@/components/transit/ShipmentTracker";

export default function TransitTracking() {
  return (
    <TransitLayout 
      title="Suivi de colis" 
      subtitle="Suivez vos expéditions en temps réel"
    >
      <div className="max-w-3xl">
        <ShipmentTracker />
      </div>
    </TransitLayout>
  );
}
