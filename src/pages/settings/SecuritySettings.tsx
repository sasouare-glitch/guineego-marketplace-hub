import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, EyeOff, Lock, Check, AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Faible", color: "bg-red-500" };
  if (score <= 4) return { score: 2, label: "Moyen", color: "bg-yellow-500" };
  return { score: 3, label: "Fort", color: "bg-green-500" };
};

export default function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Mot de passe modifié avec succès");
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.info(
      !twoFactorEnabled
        ? "L'authentification à deux facteurs sera disponible prochainement"
        : "Authentification à deux facteurs désactivée"
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au profil
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Sécurité
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gérez la sécurité de votre compte et vos options d'authentification
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Password Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Entrez votre mot de passe actuel"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Entrez votre nouveau mot de passe"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3].map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  "h-1.5 flex-1 rounded-full transition-colors",
                                  level <= passwordStrength.score
                                    ? passwordStrength.color
                                    : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Force du mot de passe:{" "}
                            <span
                              className={cn(
                                "font-medium",
                                passwordStrength.score === 1 && "text-red-500",
                                passwordStrength.score === 2 && "text-yellow-500",
                                passwordStrength.score === 3 && "text-green-500"
                              )}
                            >
                              {passwordStrength.label}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirmez votre nouveau mot de passe"
                          className={cn(
                            "pr-10",
                            confirmPassword &&
                              (passwordsMatch
                                ? "border-green-500 focus-visible:ring-green-500"
                                : "border-red-500 focus-visible:ring-red-500")
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && (
                        <p
                          className={cn(
                            "text-xs flex items-center gap-1",
                            passwordsMatch ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {passwordsMatch ? (
                            <>
                              <Check className="w-3 h-3" />
                              Les mots de passe correspondent
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Les mots de passe ne correspondent pas
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading || !passwordsMatch || !currentPassword}
                      >
                        {isLoading ? "Modification..." : "Modifier le mot de passe"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Two-Factor Authentication */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Options de sécurité avancées</CardTitle>
                  <CardDescription>
                    Protégez davantage votre compte avec ces options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Authentification à deux facteurs</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajoutez une couche de sécurité supplémentaire
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Alertes de connexion</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevez une notification lors d'une nouvelle connexion
                      </p>
                    </div>
                    <Switch
                      checked={loginAlerts}
                      onCheckedChange={setLoginAlerts}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conseils de sécurité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      Utilisez au moins 12 caractères
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      Combinez lettres, chiffres et symboles
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      N'utilisez pas d'informations personnelles
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">
                      Changez régulièrement votre mot de passe
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sessions actives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">Cet appareil</span>
                      <span className="text-xs text-green-500">Actif</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Conakry, Guinée · Chrome sur Windows
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    Déconnecter les autres appareils
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
