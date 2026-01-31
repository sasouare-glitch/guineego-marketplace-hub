import { TransitLayout } from "@/components/transit/TransitLayout";
import { QuoteCalculator } from "@/components/transit/QuoteCalculator";

export default function TransitQuote() {
  return (
    <TransitLayout 
      title="Calculer un devis" 
      subtitle="Estimez le coût de votre expédition"
    >
      <div className="max-w-2xl">
        <QuoteCalculator />
      </div>
    </TransitLayout>
  );
}
