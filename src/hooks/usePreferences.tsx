import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Language = "fr" | "en" | "ar" | "zh";
export type Theme = "light" | "dark" | "system";
export type Currency = "GNF" | "USD" | "EUR" | "XOF";

interface Preferences {
  language: Language;
  theme: Theme;
  currency: Currency;
}

interface PreferencesContextType {
  preferences: Preferences;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setCurrency: (currency: Currency) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Preferences = {
  language: "fr",
  theme: "light",
  currency: "GNF",
};

const STORAGE_KEY = "gogo-preferences";

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function getStoredPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Error reading preferences from localStorage:", error);
  }
  return defaultPreferences;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(getStoredPreferences);

  // Apply theme and language on mount and when they change
  useEffect(() => {
    applyTheme(preferences.theme);
  }, [preferences.theme]);

  useEffect(() => {
    applyLanguage(preferences.language);
  }, [preferences.language]);

  // Listen for system theme changes
  useEffect(() => {
    if (preferences.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences.theme]);

  // Persist preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving preferences to localStorage:", error);
    }
  }, [preferences]);

  const setLanguage = useCallback((language: Language) => {
    setPreferences((prev) => ({ ...prev, language }));
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    setPreferences((prev) => ({ ...prev, currency }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setLanguage,
        setTheme,
        setCurrency,
        resetPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
