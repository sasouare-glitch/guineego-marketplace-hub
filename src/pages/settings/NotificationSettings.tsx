import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Package,
  Truck,
  Tag,
  MessageSquare,
  Shield,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

export default function NotificationSettings() {
  const { permissionStatus, requestPermission } = useNotifications();
  
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "order_updates",
      label: "Mises à jour de commande",
      description: "Confirmation, préparation, expédition et livraison",
      icon: Package,
      email: true,
      push: true,
    },
    {
      id: "delivery",
      label: "Suivi de livraison",
      description: "Notifications en temps réel sur la position du livreur",
      icon: Truck,
      email: false,
      push: true,
    },
    {
      id: "promotions",
      label: "Promotions et offres",
      description: "Ventes flash, codes promo et offres exclusives",
      icon: Tag,
      email: true,
      push: false,
    },
    {
      id: "messages",
      label: "Messages",
      description: "Messages des vendeurs et du support client",
      icon: MessageSquare,
      email: true,
      push: true,
    },
    {
      id: "security",
      label: "Alertes de sécurité",
      description: "Connexions suspectes et changements de mot de passe",
      icon: Shield,
      email: true,
      push: true,
    },
  ]);

  const [globalEmail, setGlobalEmail] = useState(true);
  const [globalPush, setGlobalPush] = useState(true);

  const handlePreferenceChange = (id: string, type: "email" | "push", value: boolean) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, [type]: value } : pref
      )
    );
  };

  const handleGlobalChange = (type: "email" | "push", value: boolean) => {
    if (type === "email") {
      setGlobalEmail(value);
      setPreferences(prev => prev.map(pref => ({ ...pref, email: value })));
    } else {
      setGlobalPush(value);
      setPreferences(prev => prev.map(pref => ({ ...pref, push: value })));
    }
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast.success("Préférences de notification enregistrées");
  };

  const handleEnablePush = async () => {
    const granted = await requestPermission();
    if (granted) {
      setGlobalPush(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/profile" className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">Gérez vos préférences de notification</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Push Notification Banner */}
          {permissionStatus !== "granted" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">Activer les notifications push</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recevez des alertes instantanées sur vos commandes et livraisons
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-3"
                        onClick={handleEnablePush}
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Activer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Global Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Canaux de notification</CardTitle>
              <CardDescription>
                Activez ou désactivez tous les canaux d'un coup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Label htmlFor="global-email" className="font-medium">
                      Notifications par email
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des emails pour les mises à jour importantes
                    </p>
                  </div>
                </div>
                <Switch
                  id="global-email"
                  checked={globalEmail}
                  onCheckedChange={(value) => handleGlobalChange("email", value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Label htmlFor="global-push" className="font-medium">
                      Notifications push
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Alertes instantanées sur votre appareil
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {permissionStatus === "granted" && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Activé
                    </Badge>
                  )}
                  {permissionStatus === "denied" && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      Bloqué
                    </Badge>
                  )}
                  <Switch
                    id="global-push"
                    checked={globalPush && permissionStatus === "granted"}
                    onCheckedChange={(value) => handleGlobalChange("push", value)}
                    disabled={permissionStatus !== "granted"}
                  />
                </div>
              </div>

              {permissionStatus === "denied" && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
                  <Info className="w-4 h-4 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">
                    Les notifications push sont bloquées. Modifiez les paramètres de votre navigateur pour les activer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Préférences par catégorie</CardTitle>
              <CardDescription>
                Choisissez comment recevoir chaque type de notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-end gap-4 pb-2 border-b border-border">
                  <div className="w-16 text-center">
                    <span className="text-xs font-medium text-muted-foreground">Email</span>
                  </div>
                  <div className="w-16 text-center">
                    <span className="text-xs font-medium text-muted-foreground">Push</span>
                  </div>
                </div>

                {/* Preference Rows */}
                {preferences.map((pref) => {
                  const Icon = pref.icon;
                  return (
                    <motion.div
                      key={pref.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground">{pref.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {pref.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 flex justify-center">
                          <Switch
                            checked={pref.email && globalEmail}
                            onCheckedChange={(value) => handlePreferenceChange(pref.id, "email", value)}
                            disabled={!globalEmail}
                          />
                        </div>
                        <div className="w-16 flex justify-center">
                          <Switch
                            checked={pref.push && globalPush && permissionStatus === "granted"}
                            onCheckedChange={(value) => handlePreferenceChange(pref.id, "push", value)}
                            disabled={!globalPush || permissionStatus !== "granted"}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Enregistrer les préférences
          </Button>

          {/* Info Note */}
          <p className="text-xs text-center text-muted-foreground">
            Les alertes de sécurité par email ne peuvent pas être désactivées pour des raisons de sécurité.
          </p>
        </div>
      </main>
    </div>
  );
}
