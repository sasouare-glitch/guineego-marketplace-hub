import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Home, Building, Edit, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { Address as UserAddress } from "@/types/auth";

interface CheckoutAddress {
  id: string;
  label: string;
  type: "home" | "work" | "other";
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  instructions?: string;
  isDefault: boolean;
}

interface AddressFormProps {
  selectedAddress: string | null;
  onSelectAddress: (addressId: string) => void;
}

const communes = [
  "Kaloum", "Dixinn", "Ratoma", "Matam", "Matoto"
];

/**
 * Convert user profile addresses to checkout format
 */
function profileToCheckoutAddresses(
  profileAddresses: UserAddress[] | undefined,
  userName: string,
  userPhone: string
): CheckoutAddress[] {
  if (!profileAddresses || profileAddresses.length === 0) return [];
  return profileAddresses.map((addr, index) => ({
    id: addr.id || `profile-${index}`,
    label: addr.label || "Adresse",
    type: "home" as const,
    fullName: addr.fullName || userName,
    phone: addr.phone || userPhone,
    address: `${addr.quartier ? addr.quartier + ', ' : ''}${addr.address}`,
    commune: addr.commune,
    city: "Conakry",
    instructions: undefined,
    isDefault: addr.isDefault || index === 0,
  }));
}

export const AddressForm = ({ selectedAddress, onSelectAddress }: AddressFormProps) => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  // Build addresses from user profile
  const userName = profile?.displayName || user?.displayName || "";
  const userPhone = profile?.phone || user?.phoneNumber || "";
  const profileAddresses = profileToCheckoutAddresses(profile?.addresses, userName, userPhone);

  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Sync addresses from profile on load
  useEffect(() => {
    if (!initialized && profile) {
      const converted = profileToCheckoutAddresses(profile.addresses, userName, userPhone);
      if (converted.length > 0) {
        setAddresses(converted);
        // Auto-select default address
        const defaultAddr = converted.find(a => a.isDefault) || converted[0];
        if (defaultAddr && !selectedAddress) {
          onSelectAddress(defaultAddr.id);
        }
      }
      setInitialized(true);
    }
  }, [profile, initialized, userName, userPhone, selectedAddress, onSelectAddress]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<CheckoutAddress>>({
    type: "home",
    city: "Conakry",
    fullName: userName,
    phone: userPhone,
  });

  const getAddressLabel = (type: "home" | "work" | "other") => {
    if (type === "home") return t.checkout.homeAddress;
    if (type === "work") return t.checkout.workAddress;
    return t.checkout.otherAddress;
  };

  const handleAddAddress = () => {
    if (newAddress.fullName && newAddress.phone && newAddress.address && newAddress.commune) {
      const address: CheckoutAddress = {
        id: Date.now().toString(),
        label: getAddressLabel(newAddress.type || "home"),
        type: newAddress.type || "home",
        fullName: newAddress.fullName,
        phone: newAddress.phone,
        address: newAddress.address,
        commune: newAddress.commune,
        city: newAddress.city || "Conakry",
        instructions: newAddress.instructions,
        isDefault: addresses.length === 0
      };
      setAddresses([...addresses, address]);
      onSelectAddress(address.id);
      setIsAddingNew(false);
      setNewAddress({ type: "home", city: "Conakry", fullName: userName, phone: userPhone });
    }
  };

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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RadioGroup>

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

            <Button onClick={handleAddAddress} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              {t.checkout.saveAddress}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
