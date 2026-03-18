import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2, User, Phone, AlertCircle } from "lucide-react";
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

/** Strip all non-digit chars except leading + */
function cleanPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, "");
}

/** Validate Guinean phone: 6XX or 3XX, 9 digits total (with or without +224) */
export function validateGuineaPhone(raw: string): { valid: boolean; error?: string } {
  const cleaned = cleanPhone(raw);
  if (!cleaned) return { valid: false, error: "Le numéro de téléphone est requis" };

  // Strip country code if present
  let local = cleaned;
  if (local.startsWith("+224")) local = local.slice(4);
  else if (local.startsWith("00224")) local = local.slice(5);
  else if (local.startsWith("224") && local.length > 9) local = local.slice(3);

  if (!/^\d+$/.test(local)) return { valid: false, error: "Le numéro ne doit contenir que des chiffres" };
  if (local.length !== 9) return { valid: false, error: "Le numéro doit contenir 9 chiffres (ex: 620 00 00 00)" };
  if (!/^[63]/.test(local)) return { valid: false, error: "Le numéro doit commencer par 6 ou 3 (ex: 620, 622, 311)" };

  return { valid: true };
}

export const GuestAddressForm = ({ address, onChange }: GuestAddressFormProps) => {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = (field: keyof GuestAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Validation
  const phoneValidation = useMemo(() => validateGuineaPhone(address.phone), [address.phone]);
  const nameError = useMemo(() => {
    if (!address.fullName.trim()) return "Le nom complet est requis";
    if (address.fullName.trim().length < 2) return "Le nom doit contenir au moins 2 caractères";
    return undefined;
  }, [address.fullName]);

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

  const FieldError = ({ message }: { message?: string }) =>
    message ? (
      <p className="flex items-center gap-1 text-xs text-destructive mt-1">
        <AlertCircle className="w-3 h-3 shrink-0" />
        {message}
      </p>
    ) : null;

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
              onBlur={() => markTouched("fullName")}
              className={`mt-1.5 ${touched.fullName && nameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              maxLength={100}
            />
            {touched.fullName && <FieldError message={nameError} />}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="guest-phone" className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Téléphone *
            </Label>
            <Input
              id="guest-phone"
              type="tel"
              placeholder="620 00 00 00"
              value={address.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => markTouched("phone")}
              className={`mt-1.5 ${touched.phone && !phoneValidation.valid ? "border-destructive focus-visible:ring-destructive" : ""}`}
              maxLength={20}
            />
            {touched.phone && !phoneValidation.valid && <FieldError message={phoneValidation.error} />}
            {touched.phone && phoneValidation.valid && (
              <p className="text-xs text-green-600 mt-1">✓ Numéro valide</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Format : 6XX XX XX XX ou 3XX XX XX XX
            </p>
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
              onBlur={() => markTouched("address")}
              className={`mt-1.5 ${touched.address && !address.address.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
              maxLength={200}
            />
            {touched.address && !address.address.trim() && <FieldError message="L'adresse est requise" />}
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
              maxLength={50}
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
              maxLength={500}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
