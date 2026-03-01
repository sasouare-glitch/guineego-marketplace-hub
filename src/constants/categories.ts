import {
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Shirt,
  Home,
  Sparkles,
  Utensils,
  Refrigerator,
  Dumbbell,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface AppCategory {
  id: string;       // Valeur stockée dans Firestore (champ 'category')
  label: string;    // Libellé affiché
  icon: LucideIcon;
  color: string;    // Gradient pour la section catégories
}

export const CATEGORIES: AppCategory[] = [
  { id: "Téléphones",      label: "Téléphones",      icon: Smartphone,    color: "from-blue-500 to-blue-600" },
  { id: "Ordinateurs",     label: "Ordinateurs",     icon: Monitor,       color: "from-slate-600 to-slate-700" },
  { id: "Tablettes",       label: "Tablettes",       icon: Tablet,        color: "from-indigo-500 to-indigo-600" },
  { id: "Accessoires",     label: "Accessoires",     icon: Headphones,    color: "from-cyan-500 to-cyan-600" },
  { id: "Mode",            label: "Mode",            icon: Shirt,         color: "from-pink-500 to-rose-500" },
  { id: "Maison",          label: "Maison",          icon: Home,          color: "from-amber-500 to-orange-500" },
  { id: "Beauté",          label: "Beauté",          icon: Sparkles,      color: "from-purple-500 to-purple-600" },
  { id: "Alimentation",    label: "Alimentation",    icon: Utensils,      color: "from-green-500 to-emerald-500" },
  { id: "Électroménager",  label: "Électroménager",  icon: Refrigerator,  color: "from-teal-500 to-teal-600" },
  { id: "Sports",          label: "Sports",          icon: Dumbbell,      color: "from-orange-500 to-red-500" },
  { id: "Autres",          label: "Autres",          icon: MoreHorizontal,color: "from-gray-500 to-gray-600" },
];

/** Liste simple des noms de catégories (pour les <Select>) */
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.id);
