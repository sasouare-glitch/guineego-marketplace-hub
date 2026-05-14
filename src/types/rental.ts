/**
 * Types pour le module de Location (Rental)
 * Collections Firestore: rental_items, rental_bookings, rental_reviews, rental_disputes
 */

export type RentalCategoryId =
  | "vehicles"
  | "trucks"
  | "construction"
  | "tools"
  | "events"
  | "audio"
  | "camping"
  | "other";

export type RentalItemStatus = "active" | "inactive" | "rented" | "maintenance";

export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEK_DAYS: { id: WeekDay; label: string }[] = [
  { id: "mon", label: "Lundi" },
  { id: "tue", label: "Mardi" },
  { id: "wed", label: "Mercredi" },
  { id: "thu", label: "Jeudi" },
  { id: "fri", label: "Vendredi" },
  { id: "sat", label: "Samedi" },
  { id: "sun", label: "Dimanche" },
];

/**
 * Plage horaire d'un jour donné (heures locales 0-24).
 * `closed: true` = jour fermé, indépendamment des heures.
 */
export interface DayAvailability {
  closed?: boolean;
  startHour: number; // 0-23
  endHour: number;   // 1-24, exclusif
}

export interface RentalAvailability {
  /** Disponibilité hebdomadaire récurrente */
  weekly: Record<WeekDay, DayAvailability>;
  /** Dates spécifiques bloquées (format YYYY-MM-DD) */
  blockedDates: string[];
  /** Préavis minimum en heures avant la location */
  noticeHours?: number;
}

export const DEFAULT_AVAILABILITY: RentalAvailability = {
  weekly: {
    mon: { startHour: 8, endHour: 18 },
    tue: { startHour: 8, endHour: 18 },
    wed: { startHour: 8, endHour: 18 },
    thu: { startHour: 8, endHour: 18 },
    fri: { startHour: 8, endHour: 18 },
    sat: { startHour: 9, endHour: 16 },
    sun: { closed: true, startHour: 0, endHour: 0 },
  },
  blockedDates: [],
  noticeHours: 12,
};

export interface RentalLocation {
  commune: string;
  quartier?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

export interface RentalItem {
  id: string;
  ownerId: string;          // UID propriétaire (loueur)
  title: string;
  description: string;
  category: RentalCategoryId;
  subcategory?: string;
  images: string[];
  thumbnail: string;
  pricePerDay: number;      // en GNF
  pricePerHour?: number;
  deposit: number;          // caution en GNF
  minDays?: number;
  location: RentalLocation;
  specs?: Record<string, string>;
  rules?: string;
  status: RentalItemStatus;
  availability?: RentalAvailability;
  avgRating: number;
  totalRentals: number;
  createdAt: Date | { seconds: number };
  updatedAt: Date | { seconds: number };
}

export type BookingStatus =
  | "pending"     // créée, en attente de validation loueur
  | "confirmed"  // validée
  | "active"     // matériel remis
  | "completed"  // retourné OK
  | "cancelled"
  | "disputed";

/**
 * Méthode de paiement supportée pour la caution.
 */
export type DepositPaymentMethod = "orange_money" | "mtn_money" | "card";

/**
 * Cycle de vie de la caution.
 * - none      : pas encore versée
 * - held      : versée et bloquée chez le loueur
 * - released  : intégralement restituée au locataire (retour OK)
 * - withheld  : conservée totalement par le loueur (dégâts/perte)
 * - partial   : partiellement restituée (frais retenus)
 * - refunded  : remboursée suite à annulation avant location
 */
export type DepositStatus =
  | "none"
  | "held"
  | "released"
  | "withheld"
  | "partial"
  | "refunded";

export interface RentalBooking {
  id: string;
  itemId: string;
  itemTitle: string;
  itemThumbnail?: string;
  ownerId: string;
  renterId: string;
  renterName?: string;
  renterPhone?: string;
  startDate: Date | { seconds: number };
  endDate: Date | { seconds: number };
  totalDays: number;
  pricePerDay: number;
  totalPrice: number;
  deliveryFee?: number;
  mode?: "pickup" | "delivery";
  deposit: number;
  status: BookingStatus;
  paymentId?: string;
  paymentStatus?: "pending" | "paid" | "refunded";

  // ----- Caution -----
  depositStatus?: DepositStatus;
  depositPaymentMethod?: DepositPaymentMethod;
  depositTransactionId?: string;
  depositPaidAt?: Date | { seconds: number };
  depositReleasedAt?: Date | { seconds: number };
  depositAmountReleased?: number; // restitué au locataire
  depositAmountWithheld?: number; // conservé par le loueur
  depositWithheldReason?: string;

  /** Audit trail des retours de caution */
  depositReturnAudits?: DepositReturnAudit[];

  pickupAddress?: string;
  returnAddress?: string;
  notes?: string;
  createdAt: Date | { seconds: number };
  updatedAt: Date | { seconds: number };
}

/**
 * Entrée d'audit pour traçabilité du retour de caution.
 */
export interface DepositReturnAudit {
  processedBy: string;          // UID du loueur/admin ayant fait l'action
  processedByName?: string;     // Nom affichable
  processedAt: Date | { seconds: number };
  decision: "released" | "partial" | "withheld";
  depositTotal: number;         // montant total de la caution
  amountReleased: number;
  amountWithheld: number;
  reason?: string;              // motif si retenue/partial
}
