/**
 * Sponsored products configuration & types
 */

export type SponsorDuration = '7d' | '14d' | '30d';

export interface SponsorPlan {
  id: SponsorDuration;
  label: string;
  days: number;
  price: number; // GNF
}

export const SPONSOR_PLANS: SponsorPlan[] = [
  { id: '7d',  label: '7 jours',  days: 7,  price: 50_000 },
  { id: '14d', label: '14 jours', days: 14, price: 85_000 },
  { id: '30d', label: '30 jours', days: 30, price: 150_000 },
];

export interface SponsorData {
  isSponsored: boolean;
  sponsoredAt?: Date;
  sponsoredUntil?: Date;
  sponsorPlan?: SponsorDuration;
}
