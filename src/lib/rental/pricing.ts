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
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Normalise une date à minuit local (évite les biais d'heure). */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Compte de jours calendaires INCLUSIFS entre deux dates.
 * start == end → 1 jour ; start, start+1j → 2 jours.
 */
export function diffInDays(start: Date, end: Date): number {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  return Math.max(1, Math.floor((b - a) / MS_PER_DAY) + 1);
}

/** Normalise et borne `minDays` (toujours >= 1). */
export function normalizeMinDays(minDays?: number): number {
  return Math.max(1, Math.floor(minDays ?? 1));
}

/**
 * Date de fin minimale autorisée pour respecter la durée minimale.
 * Source de vérité partagée entre la validation UI et le calcul du devis.
 */
export function getMinEndDate(start: Date, minDays?: number): Date {
  const n = normalizeMinDays(minDays);
  return new Date(startOfDay(start).getTime() + (n - 1) * MS_PER_DAY);
}

export function computeRentalQuote(input: QuoteInput): RentalQuote {
  const { startDate, endDate, pricePerDay, mode } = input;
  const deposit = Math.max(0, input.deposit ?? 0);
  const minDays = normalizeMinDays(input.minDays);
  const deliveryFee =
    mode === "delivery" ? Math.max(0, input.deliveryFee ?? DEFAULT_DELIVERY_FEE) : 0;

  let days = 0;
  if (startDate) {
    const end = endDate ?? startDate;
    // Même contrainte que la validation : on aligne au minimum sur minEndDate.
    days = Math.max(minDays, diffInDays(startDate, end));
  }

  const subtotal = days * Math.max(0, pricePerDay);
  const totalRentalCost = subtotal + deliveryFee;
  const totalPayable = totalRentalCost + deposit;

  return { days, subtotal, deliveryFee, deposit, totalPayable, totalRentalCost };
}
