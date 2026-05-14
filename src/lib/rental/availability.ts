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
  if (item.status !== "active") return false;

  const av: RentalAvailability | undefined = item.availability;
  if (!av) return true;

  const dayKey = format(date, "yyyy-MM-dd");
  if (av.blockedDates?.includes(dayKey)) return false;

  const weekDay = DAY_INDEX[date.getDay()];
  const slot = av.weekly?.[weekDay];
  if (slot?.closed) return false;

  return true;
}
