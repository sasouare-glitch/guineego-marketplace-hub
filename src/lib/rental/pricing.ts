/**
 * Calcul du prix d'une réservation de location.
 * - subtotal = jours * prix/jour
 * - deliveryFee = frais de livraison (0 si retrait)
 * - deposit = caution remboursable
 * - totalPayable = subtotal + deliveryFee + deposit
 * - totalRentalCost = subtotal + deliveryFee (hors caution)
 */
export type RentalMode = "pickup" | "delivery";

export interface RentalQuote {
  days: number;
  subtotal: number;
  deliveryFee: number;
  deposit: number;
  totalPayable: number;     // ce que le client doit avancer
  totalRentalCost: number;  // coût final hors caution
}

export interface QuoteInput {
  startDate?: Date | null;
  endDate?: Date | null;
  pricePerDay: number;
  deposit?: number;
  minDays?: number;
  mode: RentalMode;
  /** Frais de livraison forfaitaires (GNF). Défaut 50 000. */
  deliveryFee?: number;
}

export const DEFAULT_DELIVERY_FEE = 50_000;

export function diffInDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  // inclusif : 1 jour minimum quand start == end
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + (ms === 0 ? 1 : 0));
}

export function computeRentalQuote(input: QuoteInput): RentalQuote {
  const { startDate, endDate, pricePerDay, mode } = input;
  const deposit = Math.max(0, input.deposit ?? 0);
  const minDays = Math.max(1, input.minDays ?? 1);
  const deliveryFee =
    mode === "delivery" ? Math.max(0, input.deliveryFee ?? DEFAULT_DELIVERY_FEE) : 0;

  let days = 0;
  if (startDate) {
    const end = endDate ?? startDate;
    days = Math.max(minDays, diffInDays(startDate, end));
  }

  const subtotal = days * Math.max(0, pricePerDay);
  const totalRentalCost = subtotal + deliveryFee;
  const totalPayable = totalRentalCost + deposit;

  return { days, subtotal, deliveryFee, deposit, totalPayable, totalRentalCost };
}
