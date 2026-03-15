import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Shield, Smartphone, Loader2, Save, Volume2, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAlertSound, ALERT_SOUND_OPTIONS, type AlertSoundType } from "@/hooks/useAlertSound";

interface CourierSettings {
  pushNotifications: boolean;
  soundAlerts: boolean;
  missionAlerts: boolean;
  darkMode: boolean;
  language: string;
  autoAccept: boolean;
  alertVolume: number;
  alertSoundType: AlertSoundType;
  vibrationEnabled: boolean;
}

const defaults: CourierSettings = {
  pushNotifications: true,
  soundAlerts: true,
  missionAlerts: true,
  darkMode: false,
  language: "fr",
  autoAccept: false,
  alertVolume: 0.5,
  alertSoundType: "classic",
  vibrationEnabled: true,
};

export default function CourierSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CourierSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { previewSound } = useAlertSound();

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

        {/* Sound & Vibration Settings */}
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" /> Son & Vibration
          </h3>

          {/* Sound type selector */}
          <div className="space-y-2">
            <Label>Type de son d'alerte</Label>
            <div className="flex items-center gap-3">
              <Select
                value={settings.alertSoundType}
                onValueChange={(v) => setSettings((s) => ({ ...s, alertSoundType: v as AlertSoundType }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_SOUND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => previewSound(settings.alertSoundType, settings.alertVolume)}
                title="Écouter"
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Volume slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {Math.round(settings.alertVolume * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.alertVolume * 100]}
              onValueChange={([v]) => setSettings((s) => ({ ...s, alertVolume: v / 100 }))}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Vibration toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Vibration</Label>
              <p className="text-xs text-muted-foreground">Vibrer pour les missions express</p>
            </div>
            <Switch checked={settings.vibrationEnabled} onCheckedChange={() => toggle("vibrationEnabled")} />
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
