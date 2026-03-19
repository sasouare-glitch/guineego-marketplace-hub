/**
 * Checkout order creation via Cloud Functions
 */

import { callFunction } from './config';

interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  thumbnail?: string;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  commune: string;
  quartier?: string;
  address: string;
  instructions?: string;
}

interface CreateOrderParams {
  uid?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  isGuest?: boolean;
}

type PaymentMethod = 'orange_money' | 'mtn_money' | 'card' | 'wallet' | 'cash';
type OrderFunctionName = 'createOrder' | 'createGuestOrder';

interface CreateOrderFunctionPayload {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

interface CreateOrderResult {
  success?: boolean;
  orderId: string;
  paymentId: string;
  total: number;
  message?: string;
}

function normalizePaymentMethod(paymentMethod: string): PaymentMethod {
  if (
    paymentMethod === 'orange_money' ||
    paymentMethod === 'mtn_money' ||
    paymentMethod === 'card' ||
    paymentMethod === 'wallet' ||
    paymentMethod === 'cash'
  ) {
    return paymentMethod;
  }

  throw new Error('Méthode de paiement invalide');
}

function toUserFacingOrderError(error: any, isGuest?: boolean): Error {
  const code = error?.code || '';
  const message = error?.message || '';

  console.error('[Order] Raw error:', { code, message, error });

  // Network / CORS / unreachable Cloud Function
  if (
    message === 'internal' ||
    message === 'Failed to fetch' ||
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('ERR_NETWORK') ||
    code === 'functions/internal'
  ) {
    return new Error(
      'Le serveur de commande est temporairement indisponible. Vérifiez votre connexion internet et réessayez dans quelques instants.'
    );
  }

  if (code === 'functions/unauthenticated') {
    return new Error('Votre session a expiré. Reconnectez-vous puis réessayez.');
  }

  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    if (isGuest) {
      return new Error('Le checkout invité est momentanément indisponible. Réessayez dans un instant.');
    }
    return new Error('Votre commande a été bloquée par les permissions backend. Réessayez maintenant.');
  }

  if (
    code === 'functions/invalid-argument' ||
    code === 'functions/failed-precondition'
  ) {
    return new Error(message || 'Erreur lors de la création de la commande');
  }

  return error instanceof Error ? error : new Error(message || 'Erreur lors de la création de la commande');
}

async function createOrderViaFunction(
  functionName: OrderFunctionName,
  params: CreateOrderParams
): Promise<CreateOrderResult> {
  const createOrder = callFunction<CreateOrderFunctionPayload, CreateOrderResult>(functionName);
  const result = await createOrder({
    items: params.items,
    shippingAddress: params.shippingAddress,
    paymentMethod: normalizePaymentMethod(params.paymentMethod),
  });

  return result.data;
}

export async function createOrderDirect(params: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    const functionName: OrderFunctionName = params.uid && !params.isGuest ? 'createOrder' : 'createGuestOrder';
    return await createOrderViaFunction(functionName, params);
  } catch (error: any) {
    throw toUserFacingOrderError(error, params.isGuest);
  }
}
