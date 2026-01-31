import { fr, TranslationKeys } from "./translations/fr";
import { en } from "./translations/en";
import { ar } from "./translations/ar";
import type { Language } from "@/hooks/usePreferences";

const translations: Record<Language, TranslationKeys> = {
  fr,
  en,
  ar,
};

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}` | K
          : K
        : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

/**
 * Get a translation value by dot-notation key
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key if not found
    }
  }

  return typeof current === "string" ? current : path;
}

/**
 * Replace placeholders like {count} in translation strings
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, text);
}

/**
 * Create a translation function for a specific language
 */
export function createTranslator(language: Language) {
  const translation = translations[language];

  const t = function (key: string, params?: Record<string, string | number>): string {
    const value = getNestedValue(translation, key);
    return interpolate(value, params);
  };

  return t;
}

/**
 * Get translation object directly for a specific language
 */
export function getTranslations(language: Language): TranslationKeys {
  return translations[language];
}

export { translations };
export type { TranslationKeys };
