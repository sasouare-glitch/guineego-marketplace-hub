import {
  Car,
  Truck,
  HardHat,
  Wrench,
  PartyPopper,
  Music,
  Tent,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface RentalCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const RENTAL_CATEGORIES: RentalCategory[] = [
  { id: "vehicles",     label: "Voitures",         icon: Car,            color: "from-blue-500 to-blue-600" },
  { id: "trucks",       label: "Camions",          icon: Truck,          color: "from-slate-600 to-slate-700" },
  { id: "construction", label: "Engins BTP",       icon: HardHat,        color: "from-amber-500 to-orange-500" },
  { id: "tools",        label: "Outillage",        icon: Wrench,         color: "from-red-500 to-red-600" },
  { id: "events",       label: "Événementiel",     icon: PartyPopper,    color: "from-pink-500 to-rose-500" },
  { id: "audio",        label: "Sono / Audio",     icon: Music,          color: "from-purple-500 to-purple-600" },
  { id: "camping",      label: "Camping / Tentes", icon: Tent,           color: "from-green-500 to-emerald-500" },
  { id: "other",        label: "Autres",           icon: MoreHorizontal, color: "from-gray-500 to-gray-600" },
];

export const RENTAL_CATEGORY_IDS = RENTAL_CATEGORIES.map((c) => c.id);
