# Plan : Module de Location (Rental Marketplace)

## Objectif
Ajouter un espace de location de matériels (voitures, équipements BTP, etc.) en parallèle du marketplace e-commerce existant, sans toucher à l'architecture actuelle vendeur/acheteur.

## Approche : isolation par module
On crée un **module `rental`** complètement séparé (collections Firestore, pages, hooks, rôle), partageant uniquement l'infra commune (Auth, Cloud, paiements, notifications, design system).

---

## 1. Modèle de données (Firestore)

Nouvelles collections (pas de modification des existantes) :

- **`rental_items`** — équipements/véhicules à louer
  - `id`, `ownerId`, `ownerRef`, `title`, `description`, `category` (`vehicle` | `construction` | `tools` | `event` | `other`), `subcategory`, `images[]`, `pricePerDay`, `pricePerHour?`, `deposit`, `location` (commune, GPS), `availability` (calendar), `status` (`active`|`inactive`|`rented`), `specs{}`, `rules`, `avgRating`, `totalRentals`, timestamps
- **`rental_bookings`** — réservations
  - `id`, `itemId`, `ownerId`, `renterId`, `startDate`, `endDate`, `totalDays`, `totalPrice`, `deposit`, `status` (`pending`|`confirmed`|`active`|`completed`|`cancelled`|`disputed`), `paymentId`, `pickupAddress`, `returnAddress`, `notes`, timestamps
- **`rental_reviews`** — avis sur item + locataire (bidirectionnel)
- **`rental_disputes`** — litiges (caution, dégâts)

Règles : créées **uniquement via Cloud Functions** (cohérent avec `orders`/`payments`). RLS par `ownerId`/`renterId`/admin (mémoire `security-rules-overview`).

## 2. Rôles & Auth

Ajout d'un nouveau rôle dans `app_role` côté claims/Firestore :
- `lessor` (loueur/propriétaire) — pendant qu'un user normal peut être locataire sans rôle spécifique (comme acheteur)

Réutilise le système de `role-request-system` existant (demande depuis le profil → validation admin).

## 3. Cloud Functions (functions/src/rental/)

- `createRentalItem` (lessor)
- `updateRentalItem` / `deleteRentalItem`
- `createBooking` (renter, atomique : check availability + lock dates + create payment intent)
- `confirmBooking` (lessor)
- `cancelBooking`
- `completeBooking` (libère caution selon état)
- `rentalTriggers` (notifications FCM/SMS sur changement statut — réutilise `sendStatusNotification`)

## 4. Pages & Routes (frontend)

```
/rental                          → marketplace location (browse)
/rental/category/:id             → filtre catégorie
/rental/item/:id                 → détail + calendrier dispo + réservation
/rental/booking/:id              → suivi réservation locataire
/lessor                          → dashboard loueur (calque /seller)
/lessor/items                    → mes équipements
/lessor/items/new                → création
/lessor/bookings                 → demandes & réservations
/lessor/earnings                 → revenus (réutilise wallet)
/lessor/settings
```

## 5. Composants nouveaux

- `RentalCard`, `RentalGrid`, `RentalFilters` (catégories rental)
- `AvailabilityCalendar` (react-day-picker déjà présent via shadcn)
- `BookingDialog` (sélection dates + récap prix + caution)
- `LessorHeader`, `LessorSidebar` (calques de Seller*)
- `RentalCategoriesSection` sur Index si activé

## 6. Navigation & UX

- Ajout d'un toggle/onglet **"Acheter | Louer"** sur la page d'accueil et le header (mobile bottom bar : nouvelle icône)
- Le rôle `lessor` voit un bottom bar dédié (cohérent mémoire `ux-navigation`)
- Réutilise design system (couleurs Rouge/Jaune/Vert, Inter/Poppins) — rien de nouveau côté tokens

## 7. Paiements & Wallet

Réutilise l'architecture existante :
- Paiement initial = loyer + caution (Orange Money / MoMo / Stripe / Cash)
- Split : 95% loueur / 5% plateforme (mémoire `payments-wallet`)
- Caution bloquée jusqu'à `completeBooking` (nouveau statut wallet `escrow`)

## 8. Notifications

Hybride in-app + FCM (mémoire `notifications-automation`) :
- Nouvelle demande → loueur
- Confirmation/refus → locataire
- Rappel J-1 retrait & retour
- Caution libérée

## 9. Sécurité (firestore.rules)

Bloc dédié `match /rental_items/{id}` etc. — lecture publique pour items actifs, écriture functions-only pour bookings (cohérent avec mémoire `orders-payments-creation`).

## 10. Catégories

Nouveau fichier `src/constants/rentalCategories.ts` (séparé de `categories.ts` produits) : Voitures, Camions, Engins BTP, Outillage, Événementiel, Sono/Audio, Autres.

---

## Détails techniques

- **Pas de breaking change** : aucune collection/page/hook existante modifiée.
- **Lazy loading** des routes `/rental/*` et `/lessor/*` pour préserver budget bundle PWA <5MB (mémoire `constraints-pwa-css`).
- **safeOnSnapshot** pour tous les listeners (mémoire `firestore-stability-hardening`).
- **Indexes Firestore** à ajouter dans `firestore.indexes.json` : `rental_items(category, status, createdAt)`, `rental_bookings(renterId, status)`, `rental_bookings(ownerId, status)`.
- **i18n** : ajout des clés `rental.*` dans fr/en/zh/nqo (4 locales supportées).
- **Tests** : unitaires sur calcul prix (jours × tarif + caution) et chevauchement de dates.

## Découpage en livrables (PRs successives)

1. **Fondations** : rôle `lessor`, collections + rules + indexes + i18n keys + route `/rental` (browse vide)
2. **Catalogue** : création/édition d'items côté loueur + listing côté client
3. **Réservation** : calendrier dispo + booking dialog + Cloud Function `createBooking` + paiement
4. **Cycle de vie** : confirm/cancel/complete + notifications + caution
5. **Dashboard loueur** : earnings, stats, avis
6. **Polish** : disputes, reviews bidirectionnels, filtres avancés (commune, prix, dispo)

Je peux démarrer par le livrable **1 (Fondations)** dès validation.
