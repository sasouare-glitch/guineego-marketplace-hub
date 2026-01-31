import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Moon,
  Sun,
  Monitor,
  Coins,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

const currencies = [
  { code: "GNF", label: "Franc Guinéen", symbol: "GNF" },
  { code: "USD", label: "Dollar US", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "XOF", label: "Franc CFA", symbol: "CFA" },
];

const themes = [
  { id: "light", label: "Clair", icon: Sun, description: "Thème lumineux" },
  { id: "dark", label: "Sombre", icon: Moon, description: "Thème sombre" },
  { id: "system", label: "Système", icon: Monitor, description: "Suit les paramètres système" },
];

export default function PreferencesSettings() {
  const [language, setLanguage] = useState("fr");
  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("GNF");
  const [hasChanges, setHasChanges] = useState(false);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    setHasChanges(true);
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    setHasChanges(true);
    // In a real app, this would update the theme
    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else if (value === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    toast.success("Préférences enregistrées");
    setHasChanges(false);
  };

  const handleReset = () => {
    setLanguage("fr");
    setTheme("light");
    setCurrency("GNF");
    document.documentElement.classList.remove("dark");
    setHasChanges(false);
    toast.info("Préférences réinitialisées");
  };

  const selectedLanguage = languages.find((l) => l.code === language);
  const selectedCurrency = currencies.find((c) => c.code === currency);

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
              <h1 className="text-xl font-bold text-foreground">Préférences</h1>
              <p className="text-sm text-muted-foreground">Personnalisez votre expérience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Language */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Langue</CardTitle>
                    <CardDescription>
                      Choisissez la langue de l'interface
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedLanguage && (
                        <span className="flex items-center gap-2">
                          <span>{selectedLanguage.flag}</span>
                          <span>{selectedLanguage.label}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>

          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {theme === "dark" ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : theme === "system" ? (
                      <Monitor className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">Apparence</CardTitle>
                    <CardDescription>
                      Personnalisez l'apparence de l'application
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={theme}
                  onValueChange={handleThemeChange}
                  className="grid grid-cols-3 gap-3"
                >
                  {themes.map((t) => {
                    const Icon = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <Label
                        key={t.id}
                        htmlFor={t.id}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem
                          value={t.id}
                          id={t.id}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium">{t.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                        )}
                      </Label>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          {/* Currency */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Devise</CardTitle>
                    <CardDescription>
                      Devise utilisée pour l'affichage des prix
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedCurrency && (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">
                            {selectedCurrency.symbol}
                          </span>
                          <span>{selectedCurrency.label}</span>
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground w-8">
                            {curr.symbol}
                          </span>
                          <span>{curr.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Les prix seront convertis approximativement. La devise de paiement reste le GNF.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!hasChanges}
            >
              {hasChanges ? "Enregistrer" : "Enregistré"}
            </Button>
          </div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-secondary/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">Aperçu de vos préférences</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    {selectedLanguage?.flag} {selectedLanguage?.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    {theme === "dark" ? "🌙" : theme === "system" ? "💻" : "☀️"}{" "}
                    {themes.find((t) => t.id === theme)?.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    💰 {selectedCurrency?.code}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
