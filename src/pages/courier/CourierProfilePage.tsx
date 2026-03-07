import { useState, useEffect, useRef } from "react";
import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadAvatar } from "@/lib/firebase/storage";
import { toast } from "sonner";
import {
  User, Phone, MapPin, Bike, Shield, Loader2, Save, Camera,
} from "lucide-react";

interface CourierProfile {
  displayName?: string;
  phone?: string;
  zones?: string[];
  vehicleType?: string;
  isOnline?: boolean;
  status?: string;
  photoURL?: string;
}

const COMMUNES = ["Kaloum", "Dixinn", "Matam", "Ratoma", "Matoto"];

export default function CourierProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CourierProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const courierSnap = await getDoc(doc(db, "couriers", user.uid));
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const courierData = courierSnap.exists() ? courierSnap.data() : {};
        const userData = userSnap.exists() ? userSnap.data() : {};
        const merged = {
          displayName: userData.displayName || user.displayName || "",
          phone: userData.phone || courierData.phone || "",
          zones: courierData.zones || [],
          vehicleType: courierData.vehicleType || "moto",
          isOnline: courierData.isOnline || false,
          status: courierData.status || "active",
        };
        setProfile(merged);
        setSelectedZones(merged.zones || []);
      } catch (err) {
        console.error("Error fetching courier profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const toggleZone = (zone: string) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "couriers", user.uid), {
        zones: selectedZones,
        vehicleType: profile.vehicleType,
        isOnline: profile.isOnline,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, "users", user.uid), {
        displayName: profile.displayName,
        phone: profile.phone,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Profil mis à jour !");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CourierLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </CourierLayout>
    );
  }

  const initials = (profile.displayName || "C")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations de coursier</p>
        </div>

        {/* Avatar + status */}
        <Card className="p-6 flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{profile.displayName || "Coursier"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile.isOnline ? "default" : "secondary"}>
                {profile.isOnline ? "En ligne" : "Hors ligne"}
              </Badge>
              <Badge variant="outline">{profile.status === "active" ? "Actif" : "Inactif"}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="online-toggle" className="text-sm">En ligne</Label>
            <Switch
              id="online-toggle"
              checked={profile.isOnline}
              onCheckedChange={(v) => setProfile((p) => ({ ...p, isOnline: v }))}
            />
          </div>
        </Card>

        {/* Personal info */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informations personnelles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={profile.displayName || ""}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+224 XXX XX XX XX"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Vehicle */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Bike className="w-5 h-5 text-primary" />
            Véhicule
          </h3>
          <div className="flex gap-3">
            {["moto", "vélo", "voiture"].map((v) => (
              <Button
                key={v}
                variant={profile.vehicleType === v ? "default" : "outline"}
                size="sm"
                onClick={() => setProfile((p) => ({ ...p, vehicleType: v }))}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
        </Card>

        {/* Zones */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Zones de livraison
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez les communes où vous souhaitez recevoir des missions
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMUNES.map((zone) => (
              <Badge
                key={zone}
                variant={selectedZones.includes(zone) ? "default" : "outline"}
                className="cursor-pointer text-sm py-1.5 px-3"
                onClick={() => toggleZone(zone)}
              >
                {zone}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Sécurité
          </h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer les modifications
        </Button>
      </div>
    </CourierLayout>
  );
}
