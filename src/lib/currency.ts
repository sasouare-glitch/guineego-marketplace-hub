import type { Currency } from "@/hooks/usePreferences";

// Approximate exchange rates (GNF as base currency)
// These would ideally come from an API in production
const exchangeRates: Record<Currency, number> = {
  GNF: 1,
  USD: 0.000116, // 1 GNF ≈ 0.000116 USD
  EUR: 0.000107, // 1 GNF ≈ 0.000107 EUR
  XOF: 0.072,    // 1 GNF ≈ 0.072 XOF
};

const currencyConfig: Record<Currency, { symbol: string; position: "before" | "after"; decimals: number; separator: string }> = {
  GNF: { symbol: "GNF", position: "after", decimals: 0, separator: " " },
  USD: { symbol: "$", position: "before", decimals: 2, separator: "" },
  EUR: { symbol: "€", position: "after", decimals: 2, separator: " " },
  XOF: { symbol: "CFA", position: "after", decimals: 0, separator: " " },
};

/**
 * Convert a price from GNF to the target currency
 */
export function convertPrice(priceInGNF: number, targetCurrency: Currency): number {
  return priceInGNF * exchangeRates[targetCurrency];
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const config = currencyConfig[currency];
  
  const formattedNumber = amount.toLocaleString("fr-FR", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  if (config.position === "before") {
    return `${config.symbol}${config.separator}${formattedNumber}`;
  } else {
    return `${formattedNumber}${config.separator}${config.symbol}`;
  }
}

/**
 * Convert and format a price from GNF to the target currency
 */
export function formatPrice(priceInGNF: number, currency: Currency): string {
  const converted = convertPrice(priceInGNF, currency);
  return formatCurrency(converted, currency);
}

/**
 * Parse a formatted currency string back to a number (GNF)
 */
export function parsePrice(formattedPrice: string): number {
  // Remove all non-numeric characters except decimal point
  const numericString = formattedPrice.replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(numericString) || 0;
}
