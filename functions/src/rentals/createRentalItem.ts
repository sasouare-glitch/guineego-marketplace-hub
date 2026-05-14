/**
 * RENTALS FUNCTION: Create Rental Item
 * Lessor function to publish a new rental item.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth, type UserRole } from '../utils/auth';

const db = admin.firestore();

const ALLOWED_CATEGORIES = [
  'vehicles',
  'trucks',
  'construction',
  'tools',
  'events',
  'audio',
  'camping',
  'other',
] as const;

type RentalCategory = typeof ALLOWED_CATEGORIES[number];

interface RentalLocationInput {
  commune?: string;
  quartier?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
}

type RentalItemStatus = 'active' | 'inactive' | 'rented' | 'maintenance';
const ALLOWED_STATUSES: RentalItemStatus[] = ['active', 'inactive', 'rented', 'maintenance'];

type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
const WEEK_DAYS: WeekDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface DayAvailabilityInput {
  closed?: boolean;
  startHour?: number;
  endHour?: number;
}

interface RentalAvailabilityInput {
  weekly?: Partial<Record<WeekDay, DayAvailabilityInput>>;
  blockedDates?: string[];
  noticeHours?: number;
}

interface CreateRentalItemData {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  images?: string[];
  pricePerDay?: number;
  pricePerHour?: number;
  deposit?: number;
  minDays?: number;
  location?: RentalLocationInput;
  specs?: Record<string, string>;
  rules?: string;
  status?: string;
  availability?: RentalAvailabilityInput;
}

const MAX_IMAGES = 5;
const MAX_TITLE = 80;
const MAX_DESCRIPTION = 1000;
const MAX_RULES = 1000;
const MAX_PRICE = 100_000_000; // 100M GNF

function clean<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = v;
  }
  return out as T;
}

/**
 * Create a new rental item.
 * httpsCallable: createRentalItem
 */
export const createRentalItem = functions
  .region('europe-west1')
  .https.onCall(async (data: CreateRentalItemData, context) => {
    const uid = verifyAuth(context);
    const token = (context.auth?.token || {}) as any;

    // ---- Authorization: lessor or admin ----
    const tokenRole = token.role as UserRole | undefined;
    const tokenRoles = Array.isArray(token.roles) ? (token.roles as UserRole[]) : [];

    let allowed =
      tokenRole === 'admin' ||
      tokenRole === 'lessor' ||
      tokenRoles.includes('admin') ||
      tokenRoles.includes('lessor');

    if (!allowed) {
      const userDoc = await db.collection('users').doc(uid).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const docRole = (userData?.role as UserRole | undefined) || undefined;
      const docRoles = Array.isArray(userData?.roles) ? (userData?.roles as UserRole[]) : [];
      allowed =
        docRole === 'admin' ||
        docRole === 'lessor' ||
        docRoles.includes('admin') ||
        docRoles.includes('lessor');
    }

    if (!allowed) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Accès refusé (rôle loueur requis)'
      );
    }

    // ---- Validation & normalization ----
    const title = (data.title || '').trim();
    const description = (data.description || '').trim();
    const category = (data.category || '').trim();
    const subcategory = data.subcategory?.trim();
    const rules = data.rules?.trim();

    if (title.length < 3 || title.length > MAX_TITLE) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Titre requis (3 à ${MAX_TITLE} caractères)`
      );
    }
    if (description.length > MAX_DESCRIPTION) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Description trop longue (max ${MAX_DESCRIPTION})`
      );
    }
    if (rules && rules.length > MAX_RULES) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Règles trop longues (max ${MAX_RULES})`
      );
    }
    if (!ALLOWED_CATEGORIES.includes(category as RentalCategory)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Catégorie invalide'
      );
    }

    const pricePerDay = Number(data.pricePerDay);
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0 || pricePerDay > MAX_PRICE) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Prix par jour invalide'
      );
    }

    let pricePerHour: number | undefined;
    if (data.pricePerHour !== undefined && data.pricePerHour !== null && `${data.pricePerHour}` !== '') {
      const v = Number(data.pricePerHour);
      if (!Number.isFinite(v) || v < 0 || v > MAX_PRICE) {
        throw new functions.https.HttpsError('invalid-argument', 'Prix par heure invalide');
      }
      pricePerHour = v;
    }

    const deposit = Number(data.deposit ?? 0);
    if (!Number.isFinite(deposit) || deposit < 0 || deposit > MAX_PRICE) {
      throw new functions.https.HttpsError('invalid-argument', 'Caution invalide');
    }

    const minDaysRaw = Number(data.minDays ?? 1);
    const minDays = Number.isFinite(minDaysRaw) && minDaysRaw >= 1 ? Math.floor(minDaysRaw) : 1;

    const images = Array.isArray(data.images)
      ? data.images.filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)).slice(0, MAX_IMAGES)
      : [];
    if (images.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Au moins une image est requise'
      );
    }

    const commune = data.location?.commune?.trim();
    if (!commune) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Commune requise'
      );
    }

    const location = clean({
      commune,
      quartier: data.location?.quartier?.trim(),
      address: data.location?.address?.trim(),
      coordinates:
        data.location?.coordinates &&
        Number.isFinite(data.location.coordinates.lat) &&
        Number.isFinite(data.location.coordinates.lng)
          ? {
              lat: Number(data.location.coordinates.lat),
              lng: Number(data.location.coordinates.lng),
            }
          : undefined,
    });

    // ---- Persistence ----
    try {
      const itemRef = db.collection('rental_items').doc();
      const now = admin.firestore.FieldValue.serverTimestamp();

      const payload = clean({
        id: itemRef.id,
        ownerId: uid,
        ownerRef: db.collection('users').doc(uid),
        title,
        description,
        category,
        subcategory,
        images,
        thumbnail: images[0],
        pricePerDay,
        pricePerHour,
        deposit,
        minDays,
        location,
        specs: data.specs && typeof data.specs === 'object' ? data.specs : {},
        rules,
        status: 'active',
        avgRating: 0,
        totalRentals: 0,
        createdAt: now,
        updatedAt: now,
      });

      await itemRef.set(payload);

      return {
        success: true,
        itemId: itemRef.id,
        message: 'Équipement publié avec succès',
      };
    } catch (error) {
      console.error('[createRentalItem] error:', error);
      throw new functions.https.HttpsError(
        'internal',
        "Erreur lors de la création de l'équipement"
      );
    }
  });
