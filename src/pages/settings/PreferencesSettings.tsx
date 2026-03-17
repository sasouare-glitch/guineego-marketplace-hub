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
import { usePreferences, type Language, type Theme, type Currency } from "@/hooks/usePreferences";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/hooks/useCurrency";

const languages = [
  { code: "fr" as Language, label: "Français", flag: "🇫🇷" },
  { code: "en" as Language, label: "English", flag: "🇬🇧" },
  { code: "ar" as Language, label: "العربية", flag: "🇸🇦" },
  { code: "nqo" as Language, label: "ߒߞߏ", flag: "🇬🇳" },
];

const currencies = [
  { code: "GNF" as Currency, label: "Franc Guinéen", symbol: "GNF" },
  { code: "USD" as Currency, label: "Dollar US", symbol: "$" },
  { code: "EUR" as Currency, label: "Euro", symbol: "€" },
  { code: "XOF" as Currency, label: "Franc CFA", symbol: "CFA" },
];

const getThemeLabel = (theme: Theme, t: ReturnType<typeof useTranslation>["t"]) => {
  switch (theme) {
    case "light":
      return t.settings.themeLight;
    case "dark":
      return t.settings.themeDark;
    case "system":
      return t.settings.themeSystem;
  }
};

export default function PreferencesSettings() {
  const { preferences, setLanguage, setTheme, setCurrency, resetPreferences } = usePreferences();
  const { t } = useTranslation();
  const { format } = useCurrency();

  const handleSave = () => {
    toast.success(t.common.save);
  };

  const handleReset = () => {
    resetPreferences();
    toast.info("Préférences réinitialisées");
  };

  const selectedLanguage = languages.find((l) => l.code === preferences.language);
  const selectedCurrency = currencies.find((c) => c.code === preferences.currency);

  // Example price for preview
  const examplePrice = 150000; // 150,000 GNF

  const themes = [
    { id: "light" as Theme, label: t.settings.themeLight, icon: Sun },
    { id: "dark" as Theme, label: t.settings.themeDark, icon: Moon },
    { id: "system" as Theme, label: t.settings.themeSystem, icon: Monitor },
  ];

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
              <h1 className="text-xl font-bold text-foreground">{t.settings.preferences}</h1>
              <p className="text-sm text-muted-foreground">{t.settings.preferencesDesc}</p>
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
                    <CardTitle className="text-lg">{t.settings.language}</CardTitle>
                    <CardDescription>
                      {preferences.language === "fr" && "Choisissez la langue de l'interface"}
                      {preferences.language === "en" && "Choose the interface language"}
                      {preferences.language === "ar" && "اختر لغة الواجهة"}
                      {preferences.language === "nqo" && "ߞߊ߲ ߛߎ߲ߞߎ߲ ߛߏ ߞ"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={preferences.language} onValueChange={(v) => setLanguage(v as Language)}>
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
                    {preferences.theme === "dark" ? (
                      <Moon className="w-5 h-5 text-primary" />
                    ) : preferences.theme === "system" ? (
                      <Monitor className="w-5 h-5 text-primary" />
                    ) : (
                      <Sun className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t.settings.theme}</CardTitle>
                    <CardDescription>
                      {preferences.language === "fr" && "Personnalisez l'apparence de l'application"}
                      {preferences.language === "en" && "Customize the application appearance"}
                      {preferences.language === "ar" && "تخصيص مظهر التطبيق"}
                      {preferences.language === "nqo" && "ߝ "}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={preferences.theme}
                  onValueChange={(v) => setTheme(v as Theme)}
                  className="grid grid-cols-3 gap-3"
                >
                  {themes.map((themeOption) => {
                    const Icon = themeOption.icon;
                    const isSelected = preferences.theme === themeOption.id;
                    return (
                      <Label
                        key={themeOption.id}
                        htmlFor={themeOption.id}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem
                          value={themeOption.id}
                          id={themeOption.id}
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
                        <span className="text-sm font-medium">{themeOption.label}</span>
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
                    <CardTitle className="text-lg">{t.settings.currency}</CardTitle>
                    <CardDescription>
                      {preferences.language === "fr" && "Devise utilisée pour l'affichage des prix"}
                      {preferences.language === "en" && "Currency used for price display"}
                      {preferences.language === "ar" && "العملة المستخدمة لعرض الأسعار"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Select value={preferences.currency} onValueChange={(v) => setCurrency(v as Currency)}>
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
                  {t.settings.currencyNote}
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
              {preferences.language === "fr" ? "Réinitialiser" : preferences.language === "en" ? "Reset" : "إعادة تعيين"}
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              {t.common.save}
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
                <p className="text-sm text-muted-foreground mb-3">
                  {preferences.language === "fr" && "Aperçu de vos préférences"}
                  {preferences.language === "en" && "Preview of your preferences"}
                  {preferences.language === "ar" && "معاينة تفضيلاتك"}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    {selectedLanguage?.flag} {selectedLanguage?.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    {preferences.theme === "dark" ? "🌙" : preferences.theme === "system" ? "💻" : "☀️"}{" "}
                    {getThemeLabel(preferences.theme, t)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    💰 {selectedCurrency?.code}
                  </span>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    {preferences.language === "fr" && "Exemple de prix:"}
                    {preferences.language === "en" && "Price example:"}
                    {preferences.language === "ar" && "مثال على السعر:"}
                  </p>
                  <p className="text-lg font-bold text-primary">{format(examplePrice)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}