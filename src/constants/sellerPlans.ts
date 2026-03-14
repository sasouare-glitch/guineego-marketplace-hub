/**
 * Seller subscription plans configuration
 */

export type SellerPlanId = 'free' | 'pro' | 'business';

export interface SellerPlan {
  id: SellerPlanId;
  name: string;
  price: number; // GNF per month
  productLimit: number;
  features: string[];
  badge: 'none' | 'pro' | 'business';
  badgeLabel: string;
  recommended?: boolean;
}

export const SELLER_PLANS: SellerPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    productLimit: 10,
    badge: 'none',
    badgeLabel: '',
    features: [
      'Jusqu\'à 10 produits',
      'Tableau de bord basique',
      'Support par email',
      'Commissions standard (5%)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 150_000,
    productLimit: 100,
    badge: 'pro',
    badgeLabel: 'Vendeur Pro ✓',
    recommended: true,
    features: [
      'Jusqu\'à 100 produits',
      'Badge "Vendeur Pro" vérifié',
      'Statistiques avancées',
      'Commissions réduites (4%)',
      'Support prioritaire',
      'Produits mis en avant',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 500_000,
    productLimit: Infinity,
    badge: 'business',
    badgeLabel: 'Business ★',
    features: [
      'Produits illimités',
      'Badge "Business" premium',
      'Analytics & rapports complets',
      'Commissions réduites (3%)',
      'Account manager dédié',
      'API & intégrations',
      'Publicité sponsorisée incluse',
    ],
  },
];

export function getPlanById(id: SellerPlanId): SellerPlan {
  return SELLER_PLANS.find((p) => p.id === id) || SELLER_PLANS[0];
}
