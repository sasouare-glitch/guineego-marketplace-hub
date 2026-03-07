import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Smartphone, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface CourierSettings {
  pushNotifications: boolean;
  soundAlerts: boolean;
  missionAlerts: boolean;
  darkMode: boolean;
  language: string;
  autoAccept: boolean;
}

const defaults: CourierSettings = {
  pushNotifications: true,
  soundAlerts: true,
  missionAlerts: true,
  darkMode: false,
  language: "fr",
  autoAccept: false,
};

export default function CourierSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CourierSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "courier_settings", user.uid));
        if (snap.exists()) {
          setSettings({ ...defaults, ...snap.data() as Partial<CourierSettings> });
        }
      } catch (err) {
        console.error("Error loading courier settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggle = (key: keyof CourierSettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "courier_settings", user.uid), {
        ...settings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Paramètres enregistrés !");
    } catch (err: any) {
      console.error("Error saving courier settings:", err);
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

  return (
    <CourierLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Configurez votre application coursier</p>
        </div>

        <Card className="p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notifications
          </h3>
          <div className="flex items-center justify-between">
            <Label>Notifications push</Label>
            <Switch checked={settings.pushNotifications} onCheckedChange={() => toggle("pushNotifications")} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Alertes sonores</Label>
            <Switch checked={settings.soundAlerts} onCheckedChange={() => toggle("soundAlerts")} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Alertes nouvelles missions</Label>
            <Switch checked={settings.missionAlerts} onCheckedChange={() => toggle("missionAlerts")} />
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-primary" /> Application
          </h3>
          <div className="flex items-center justify-between">
            <Label>Mode sombre</Label>
            <Switch checked={settings.darkMode} onCheckedChange={() => toggle("darkMode")} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Langue</Label>
            <Select value={settings.language} onValueChange={(v) => setSettings((s) => ({ ...s, language: v }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Missions
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Label>Acceptation automatique</Label>
              <p className="text-xs text-muted-foreground">Accepter automatiquement les missions dans vos zones</p>
            </div>
            <Switch checked={settings.autoAccept} onCheckedChange={() => toggle("autoAccept")} />
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>
    </CourierLayout>
  );
}
