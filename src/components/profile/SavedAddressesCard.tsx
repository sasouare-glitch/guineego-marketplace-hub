import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Home, Briefcase, Plus, Pencil, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export interface Address {
  id: string;
  label: string;
  type: "home" | "work" | "other";
  name: string;
  phone: string;
  street: string;
  commune: string;
  city: string;
  landmark?: string;
  isDefault: boolean;
}

interface SavedAddressesCardProps {
  addresses: Address[];
  onAddressesChange: (addresses: Address[]) => void;
}

const communes = [
  "Kaloum",
  "Dixinn",
  "Matam",
  "Ratoma",
  "Matoto",
];

const typeIcons = {
  home: Home,
  work: Briefcase,
  other: MapPin,
};

const typeLabels = {
  home: "Domicile",
  work: "Bureau",
  other: "Autre",
};

export function SavedAddressesCard({ addresses, onAddressesChange }: SavedAddressesCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({});

  const openAddDialog = () => {
    setEditingAddress(null);
    setFormData({
      type: "home",
      city: "Conakry",
      isDefault: addresses.length === 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone || !formData.street || !formData.commune) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (editingAddress) {
      // Update existing
      const updated = addresses.map((a) =>
        a.id === editingAddress.id
          ? { ...a, ...formData }
          : formData.isDefault
          ? { ...a, isDefault: false }
          : a
      );
      onAddressesChange(updated as Address[]);
      toast.success("Adresse mise à jour");
    } else {
      // Add new
      const newAddress: Address = {
        id: Date.now().toString(),
        label: formData.label || typeLabels[formData.type as keyof typeof typeLabels],
        type: formData.type as "home" | "work" | "other",
        name: formData.name!,
        phone: formData.phone!,
        street: formData.street!,
        commune: formData.commune!,
        city: formData.city || "Conakry",
        landmark: formData.landmark,
        isDefault: formData.isDefault || false,
      };
      
      let updated = [...addresses, newAddress];
      if (newAddress.isDefault) {
        updated = updated.map((a) =>
          a.id === newAddress.id ? a : { ...a, isDefault: false }
        );
      }
      onAddressesChange(updated);
      toast.success("Adresse ajoutée");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    onAddressesChange(updated);
    toast.success("Adresse supprimée");
  };

  const setAsDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    onAddressesChange(updated);
    toast.success("Adresse par défaut mise à jour");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Adresses de livraison</CardTitle>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucune adresse enregistrée</p>
              <Button variant="outline" className="mt-4" onClick={openAddDialog}>
                Ajouter une adresse
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {addresses.map((address, index) => {
                  const TypeIcon = typeIcons[address.type];
                  return (
                    <motion.div
                      key={address.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border border-border rounded-lg hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  Par défaut
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{address.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.street}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.commune}, {address.city}
                            </p>
                            {address.landmark && (
                              <p className="text-sm text-muted-foreground italic">
                                📍 {address.landmark}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {address.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setAsDefault(address.id)}
                              title="Définir par défaut"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(address)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'adresse ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(address.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as Address["type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Domicile</SelectItem>
                    <SelectItem value="work">Bureau</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Libellé</Label>
                <Input
                  id="label"
                  placeholder="ex: Maison principale"
                  value={formData.label || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom du destinataire *</Label>
              <Input
                id="name"
                placeholder="Nom complet"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                placeholder="+224 6XX XXX XXX"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Adresse *</Label>
              <Input
                id="street"
                placeholder="Quartier, rue, numéro"
                value={formData.street || ""}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Commune *</Label>
                <Select
                  value={formData.commune}
                  onValueChange={(value) =>
                    setFormData({ ...formData, commune: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city || "Conakry"}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="landmark">Point de repère</Label>
              <Input
                id="landmark"
                placeholder="ex: Près de la pharmacie centrale"
                value={formData.landmark || ""}
                onChange={(e) =>
                  setFormData({ ...formData, landmark: e.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault || false}
                onChange={(e) =>
                  setFormData({ ...formData, isDefault: e.target.checked })
                }
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">
                Définir comme adresse par défaut
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              {editingAddress ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
