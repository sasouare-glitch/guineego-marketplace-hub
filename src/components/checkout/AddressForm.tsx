import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Home, Building, Edit, Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { UserAddress } from "@/hooks/useUserAddresses";

interface AddressFormProps {
  selectedAddress: string | null;
  onSelectAddress: (addressId: string) => void;
  addresses: UserAddress[];
  loading: boolean;
  onAddAddress: (address: Omit<UserAddress, 'id'>) => Promise<UserAddress>;
}

const communes = [
  "Kaloum", "Dixinn", "Ratoma", "Matam", "Matoto"
];

export const AddressForm = ({ selectedAddress, onSelectAddress, addresses, loading, onAddAddress }: AddressFormProps) => {
  const { t } = useTranslation();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<UserAddress>>({
    type: "home",
    city: "Conakry"
  });

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
            setNewAddress(prev => ({
              ...prev,
              address: road ? `${road}${suburb ? ', ' + suburb : ''}` : data.display_name.split(',').slice(0, 2).join(','),
              city,
              commune: prev?.commune || suburb || '',
            }));
          }
        } catch {
          setNewAddress(prev => ({
            ...prev,
            address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }));
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const getAddressLabel = (type: "home" | "work" | "other") => {
    if (type === "home") return t.checkout.homeAddress;
    if (type === "work") return t.checkout.workAddress;
    return t.checkout.otherAddress;
  };

  const handleAddAddress = async () => {
    if (newAddress.fullName && newAddress.phone && newAddress.address && newAddress.commune) {
      setSaving(true);
      try {
        const addr = await onAddAddress({
          label: getAddressLabel(newAddress.type || "home"),
          type: newAddress.type || "home",
          fullName: newAddress.fullName,
          phone: newAddress.phone,
          address: newAddress.address,
          commune: newAddress.commune,
          city: newAddress.city || "Conakry",
          instructions: newAddress.instructions,
          isDefault: addresses.length === 0
        });
        onSelectAddress(addr.id);
        setIsAddingNew(false);
        setNewAddress({ type: "home", city: "Conakry" });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
          {t.checkout.selectAddressOrNew}
        </p>
      </div>

      {/* Saved Addresses */}
      {addresses.length > 0 ? (
        <RadioGroup value={selectedAddress || ""} onValueChange={onSelectAddress}>
          <div className="space-y-3">
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative border rounded-2xl p-4 cursor-pointer transition-all",
                  selectedAddress === address.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => onSelectAddress(address.id)}
              >
                <div className="flex items-start gap-4">
                  <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {address.type === "home" ? (
                        <Home className="w-4 h-4 text-primary" />
                      ) : (
                        <Building className="w-4 h-4 text-primary" />
                      )}
                      <span className="font-semibold text-foreground">{address.label}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t.checkout.default}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-foreground">{address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.address}, {address.commune}, {address.city}
                    </p>
                    {address.instructions && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        📍 {address.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </RadioGroup>
      ) : (
        <div className="text-center py-8 bg-secondary/30 rounded-2xl border border-border">
          <p className="text-muted-foreground mb-2">Aucune adresse enregistrée</p>
          <p className="text-sm text-muted-foreground">Ajoutez une adresse de livraison pour continuer</p>
        </div>
      )}

      {/* Add New Address */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            {t.checkout.addNewAddress}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.checkout.newAddress}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Address Type */}
            <div className="flex gap-2">
              {[
                { value: "home", label: t.checkout.homeAddress, icon: Home },
                { value: "work", label: t.checkout.workAddress, icon: Building }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setNewAddress({ ...newAddress, type: type.value as "home" | "work" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all",
                    newAddress.type === type.value 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <type.icon className="w-4 h-4" />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Use Current Location */}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">{t.checkout.fullName}</Label>
                <Input 
                  id="fullName"
                  placeholder="Mamadou Diallo"
                  value={newAddress.fullName || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">{t.checkout.phone}</Label>
                <Input 
                  id="phone"
                  placeholder="+224 6XX XXX XXX"
                  value={newAddress.phone || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">{t.checkout.address}</Label>
                <Input 
                  id="address"
                  placeholder="Quartier, Rue, N°"
                  value={newAddress.address || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="commune">{t.checkout.commune}</Label>
                <Select 
                  value={newAddress.commune} 
                  onValueChange={(value) => setNewAddress({ ...newAddress, commune: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.checkout.select} />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">{t.checkout.city}</Label>
                <Input 
                  id="city"
                  value={newAddress.city || "Conakry"}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="instructions">{t.checkout.instructions}</Label>
                <Textarea 
                  id="instructions"
                  placeholder={t.checkout.instructionsPlaceholder}
                  value={newAddress.instructions || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <Button onClick={handleAddAddress} className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {t.checkout.saveAddress}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
