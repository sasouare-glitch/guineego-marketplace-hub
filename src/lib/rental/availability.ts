import { format } from "date-fns";
import type { RentalAvailability, RentalItem, WeekDay } from "@/types/rental";

const DAY_INDEX: WeekDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Renvoie true si l'équipement est louable à la date donnée :
 *  - status === "active"
 *  - date non listée dans availability.blockedDates
 *  - jour de semaine non fermé
 * Si l'équipement n'a pas d'`availability`, on suppose qu'il est ouvert.
 */
export function isItemAvailableOn(item: RentalItem, date: Date): boolean {
  return getAvailabilityReason(item, date) === null;
}

/**
 * Renvoie `null` si l'équipement est disponible, sinon une raison lisible.
 */
export function getAvailabilityReason(item: RentalItem, date: Date): string | null {
  if (item.status === "inactive") return "Annonce désactivée";
  if (item.status === "rented") return "Déjà loué";
  if (item.status === "maintenance") return "En maintenance";

  const av: RentalAvailability | undefined = item.availability;
  if (!av) return null;

  const dayKey = format(date, "yyyy-MM-dd");
  if (av.blockedDates?.includes(dayKey)) return "Date bloquée par le loueur";

  const weekDay = DAY_INDEX[date.getDay()];
  const slot = av.weekly?.[weekDay];
  if (slot?.closed) return "Fermé ce jour-là";

  return null;
}
