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

export type RentalItemStatus = "active" | "inactive" | "rented";

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
  deposit: number;
  status: BookingStatus;
  paymentId?: string;
  paymentStatus?: "pending" | "paid" | "refunded";
  pickupAddress?: string;
  returnAddress?: string;
  notes?: string;
  createdAt: Date | { seconds: number };
  updatedAt: Date | { seconds: number };
}
