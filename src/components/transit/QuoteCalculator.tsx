import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plane, Ship, Truck, Calculator, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface QuoteCalculatorProps {
  onQuoteGenerated?: (quote: QuoteResult) => void;
}

interface QuoteResult {
  method: "air" | "sea";
  weight: number;
  volume: number;
  pricePerKg: number;
  pricePerCbm: number;
  totalByWeight: number;
  totalByVolume: number;
  recommended: "weight" | "volume";
  finalPrice: number;
  estimatedDays: string;
}

const origins = [
  { value: "guangzhou", label: "Guangzhou (Canton)" },
  { value: "yiwu", label: "Yiwu" },
  { value: "shenzhen", label: "Shenzhen" },
  { value: "shanghai", label: "Shanghai" },
];

const categories = [
  { value: "general", label: "Marchandises générales" },
  { value: "electronics", label: "Électronique" },
  { value: "textile", label: "Textile / Mode" },
  { value: "cosmetics", label: "Cosmétiques" },
  { value: "machinery", label: "Machines / Équipements" },
];

// Prix par kg et par m³ selon le mode de transport
const RATES = {
  air: { perKg: 12000, perCbm: 0, days: "7-10 jours" }, // Par avion
  sea: { perKg: 3500, perCbm: 2500000, days: "35-45 jours" }, // Par bateau
};

export const QuoteCalculator = ({ onQuoteGenerated }: QuoteCalculatorProps) => {
  const [method, setMethod] = useState<"air" | "sea">("sea");
  const [origin, setOrigin] = useState("guangzhou");
  const [category, setCategory] = useState("general");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  const calculateQuote = () => {
    const w = parseFloat(weight) || 0;
    const l = parseFloat(length) || 0;
    const wi = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    
    // Volume en m³
    const volumeM3 = (l * wi * h) / 1000000; // cm³ to m³
    
    // Poids volumétrique (pour avion: L*W*H / 6000)
    const volumetricWeight = (l * wi * h) / 6000;
    
    const rates = RATES[method];
    const totalByWeight = w * rates.perKg;
    const totalByVolume = method === "sea" ? volumeM3 * rates.perCbm : volumetricWeight * rates.perKg;
    
    // Recommandation: le plus avantageux pour le client
    const recommended = totalByWeight <= totalByVolume ? "weight" : "volume";
    const finalPrice = Math.max(totalByWeight, totalByVolume);
    
    const result: QuoteResult = {
      method,
      weight: w,
      volume: volumeM3,
      pricePerKg: rates.perKg,
      pricePerCbm: rates.perCbm,
      totalByWeight,
      totalByVolume,
      recommended,
      finalPrice,
      estimatedDays: rates.days,
    };
    
    setQuote(result);
    onQuoteGenerated?.(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-guinea-red/10 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-guinea-red" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">Calculateur de devis</h2>
            <p className="text-sm text-muted-foreground">Estimez le coût de votre expédition</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Transport Method */}
        <div>
          <Label className="mb-3 block">Mode de transport</Label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "air", label: "Par avion", icon: Plane, desc: "7-10 jours", price: "12 000 GNF/kg" },
              { value: "sea", label: "Par bateau", icon: Ship, desc: "35-45 jours", price: "3 500 GNF/kg" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMethod(option.value as "air" | "sea")}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  method === option.value 
                    ? "border-guinea-red bg-guinea-red/5" 
                    : "border-border hover:border-guinea-red/50"
                )}
              >
                <option.icon className={cn(
                  "w-8 h-8 mb-2",
                  method === option.value ? "text-guinea-red" : "text-muted-foreground"
                )} />
                <p className="font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.desc}</p>
                <p className="text-sm font-medium text-guinea-red mt-1">{option.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Origin & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="origin">Ville d'origine</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {origins.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Type de marchandise</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Weight & Dimensions */}
        <div>
          <Label className="mb-3 block">Poids et dimensions</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="weight" className="text-xs text-muted-foreground">Poids (kg)</Label>
              <Input 
                id="weight"
                type="number"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="length" className="text-xs text-muted-foreground">Longueur (cm)</Label>
              <Input 
                id="length"
                type="number"
                placeholder="0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-xs text-muted-foreground">Largeur (cm)</Label>
              <Input 
                id="width"
                type="number"
                placeholder="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-xs text-muted-foreground">Hauteur (cm)</Label>
              <Input 
                id="height"
                type="number"
                placeholder="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Button onClick={calculateQuote} className="w-full bg-guinea-red hover:bg-guinea-red/90" size="lg">
          <Calculator className="w-5 h-5 mr-2" />
          Calculer le devis
        </Button>

        {/* Quote Result */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-guinea-green/10 border border-guinea-green/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-guinea-green" />
              <h3 className="font-display font-semibold text-foreground">Votre devis estimatif</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-background rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Calcul au poids</p>
                <p className="text-lg font-bold text-foreground">{quote.totalByWeight.toLocaleString()} GNF</p>
                <p className="text-xs text-muted-foreground">{quote.weight} kg × {quote.pricePerKg.toLocaleString()} GNF</p>
              </div>
              <div className="bg-background rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Calcul au volume</p>
                <p className="text-lg font-bold text-foreground">{quote.totalByVolume.toLocaleString()} GNF</p>
                <p className="text-xs text-muted-foreground">{quote.volume.toFixed(3)} m³</p>
              </div>
            </div>

            <div className="bg-guinea-green rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Prix final (base {quote.recommended === "weight" ? "poids" : "volume"})</p>
                  <p className="text-2xl font-bold">{quote.finalPrice.toLocaleString()} GNF</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Délai estimé</p>
                  <p className="font-semibold">{quote.estimatedDays}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4 text-sm text-muted-foreground">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Ce devis est estimatif. Le prix final sera confirmé après réception et pesée de vos marchandises.</p>
            </div>

            <Button className="w-full mt-4" variant="outline">
              Demander un devis personnalisé
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
