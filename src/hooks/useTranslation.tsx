import { useMemo } from "react";
import { usePreferences } from "./usePreferences";
import { createTranslator } from "@/i18n";

/**
 * Hook to access translations based on current language preference
 */
export function useTranslation() {
  const { preferences } = usePreferences();

  const t = useMemo(() => {
    return createTranslator(preferences.language);
  }, [preferences.language]);

  return { t, language: preferences.language };
}
