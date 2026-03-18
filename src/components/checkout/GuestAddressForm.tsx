import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

export interface GuestAddress {
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  instructions?: string;
}

interface GuestAddressFormProps {
  address: GuestAddress;
  onChange: (address: GuestAddress) => void;
}

const communes = ["Kaloum", "Dixinn", "Ratoma", "Matam", "Matoto"];

export const GuestAddressForm = ({ address, onChange }: GuestAddressFormProps) => {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);

  const update = (field: keyof GuestAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
          );
          const data = await res.json();
          if (data?.display_name) {
            const road = data.address?.road || data.address?.neighbourhood || '';
            const suburb = data.address?.suburb || data.address?.city_district || '';
            const city = data.address?.city || data.address?.town || 'Conakry';
            onChange({
              ...address,
              address: road ? `${road}${suburb ? ', ' + suburb : ''}` : data.display_name.split(',').slice(0, 2).join(','),
              city,
              commune: address.commune || suburb || '',
            });
          }
        } catch {
          onChange({
            ...address,
            address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [address, onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {t.checkout.deliveryAddress}
        </h2>
        <p className="text-muted-foreground">
          Renseignez vos informations pour la livraison
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        {/* Geolocation */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={handleUseCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-primary" />
          )}
          {locating ? "Localisation en cours..." : "📍 Utiliser ma position actuelle"}
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="guest-fullName" className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t.checkout.fullName} *
            </Label>
            <Input
              id="guest-fullName"
              placeholder="Mamadou Diallo"
              value={address.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="guest-phone" className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Téléphone *
            </Label>
            <Input
              id="guest-phone"
              placeholder="+224 6XX XXX XXX"
              value={address.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="guest-address" className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {t.checkout.address} *
            </Label>
            <Input
              id="guest-address"
              placeholder="Quartier, Rue, N°"
              value={address.address}
              onChange={(e) => update("address", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="guest-commune">{t.checkout.commune} *</Label>
            <Select
              value={address.commune}
              onValueChange={(v) => update("commune", v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t.checkout.select} />
              </SelectTrigger>
              <SelectContent>
                {communes.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="guest-city">{t.checkout.city}</Label>
            <Input
              id="guest-city"
              value={address.city}
              onChange={(e) => update("city", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="guest-instructions">{t.checkout.instructions}</Label>
            <Textarea
              id="guest-instructions"
              placeholder={t.checkout.instructionsPlaceholder}
              value={address.instructions || ""}
              onChange={(e) => update("instructions", e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
