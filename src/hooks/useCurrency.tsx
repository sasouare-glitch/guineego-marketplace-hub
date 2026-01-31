import { useCallback } from "react";
import { usePreferences } from "./usePreferences";
import { formatPrice, convertPrice } from "@/lib/currency";

/**
 * Hook to format prices according to currency preference
 */
export function useCurrency() {
  const { preferences } = usePreferences();

  const format = useCallback(
    (priceInGNF: number): string => {
      return formatPrice(priceInGNF, preferences.currency);
    },
    [preferences.currency]
  );

  const convert = useCallback(
    (priceInGNF: number): number => {
      return convertPrice(priceInGNF, preferences.currency);
    },
    [preferences.currency]
  );

  return {
    format,
    convert,
    currency: preferences.currency,
  };
}
