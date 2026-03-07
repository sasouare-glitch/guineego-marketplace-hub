import { CourierLayout } from "@/components/courier/CourierLayout";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Globe, Moon, Shield, Smartphone, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CourierSettingsPage() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    soundAlerts: true,
    missionAlerts: true,
    darkMode: false,
    language: "fr",
    autoAccept: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const handleSave = () => toast.success("Paramètres enregistrés !");

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

        <Button onClick={handleSave} className="w-full">Enregistrer</Button>
      </div>
    </CourierLayout>
  );
}
