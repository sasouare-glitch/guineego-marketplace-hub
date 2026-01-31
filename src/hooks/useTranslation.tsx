import { useMemo } from "react";
import { usePreferences } from "./usePreferences";
import { getTranslations, type TranslationKeys } from "@/i18n";

/**
 * Hook to access translations based on current language preference
 * Returns the translation object directly for easy access like t.nav.home
 */
export function useTranslation() {
  const { preferences } = usePreferences();

  const t: TranslationKeys = useMemo(() => {
    return getTranslations(preferences.language);
  }, [preferences.language]);

  return { t, language: preferences.language };
}
