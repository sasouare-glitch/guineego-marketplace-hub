import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Plus, Check, Home, Building, Edit, Trash2 } from "lucide-react";
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

interface Address {
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

const savedAddresses: Address[] = [
  {
    id: "1",
    label: "Domicile",
    type: "home",
    fullName: "Mamadou Diallo",
    phone: "+224 622 123 456",
    address: "Quartier Cosa, Rue KA-012",
    commune: "Ratoma",
    city: "Conakry",
    instructions: "Près de la pharmacie centrale",
    isDefault: true
  },
  {
    id: "2",
    label: "Bureau",
    type: "work",
    fullName: "Mamadou Diallo",
    phone: "+224 622 123 456",
    address: "Immeuble Kaloum Center, 3ème étage",
    commune: "Kaloum",
    city: "Conakry",
    isDefault: false
  }
];

const communes = [
  "Kaloum", "Dixinn", "Ratoma", "Matam", "Matoto"
];

export const AddressForm = ({ selectedAddress, onSelectAddress }: AddressFormProps) => {
  const [addresses, setAddresses] = useState<Address[]>(savedAddresses);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    type: "home",
    city: "Conakry"
  });

  const handleAddAddress = () => {
    if (newAddress.fullName && newAddress.phone && newAddress.address && newAddress.commune) {
      const address: Address = {
        id: Date.now().toString(),
        label: newAddress.type === "home" ? "Domicile" : newAddress.type === "work" ? "Bureau" : "Autre",
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
      setNewAddress({ type: "home", city: "Conakry" });
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
          Adresse de livraison
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez une adresse existante ou ajoutez-en une nouvelle
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
                        Par défaut
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
            Ajouter une nouvelle adresse
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle adresse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Address Type */}
            <div className="flex gap-2">
              {[
                { value: "home", label: "Domicile", icon: Home },
                { value: "work", label: "Bureau", icon: Building }
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
                <Label htmlFor="fullName">Nom complet</Label>
                <Input 
                  id="fullName"
                  placeholder="Mamadou Diallo"
                  value={newAddress.fullName || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input 
                  id="phone"
                  placeholder="+224 6XX XXX XXX"
                  value={newAddress.phone || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Input 
                  id="address"
                  placeholder="Quartier, Rue, N°"
                  value={newAddress.address || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Select 
                  value={newAddress.commune} 
                  onValueChange={(value) => setNewAddress({ ...newAddress, commune: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input 
                  id="city"
                  value={newAddress.city || "Conakry"}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="instructions">Instructions (optionnel)</Label>
                <Textarea 
                  id="instructions"
                  placeholder="Point de repère, indications..."
                  value={newAddress.instructions || ""}
                  onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <Button onClick={handleAddAddress} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Enregistrer l'adresse
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
