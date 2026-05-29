/**
 * PAYMENTS FUNCTION: Process Merchant QR Static Payment
 * Firestore trigger fired when a customer submits a payment via /pay/:sellerId
 *
 * Document lifecycle (merchant_qr_payments/{id}):
 *   pending → processing (OM/MTN STK push) → completed | failed
 *   pending → completed                                  (wallet, atomic)
 *
 * Commission Sarematy: 5% retenue à la source.
 * Sur paiement wallet: débit buyer → crédit seller (net) + commission ledger.
 * Sur OM/MTN: USSD instructions retournées; le webhook (processOMWebhook /
 * processMTNWebhook) confirmera et déclenchera le reversement.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

const COMMISSION_RATE = 0.05; // 5%
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50_000_000;

type Method = 'orange' | 'mtn' | 'wallet';

interface QRPayment {
  sellerId: string;
  shopName?: string;
  amount: number;
  currency?: string;
  method: Method;
  note?: string | null;
  buyerPhone?: string | null;
  buyerUid?: string | null;
  buyerName?: string | null;
  status: string;
  source?: string;
}

export const processMerchantQRPayment = functions
  .region('europe-west1')
  .firestore.document('merchant_qr_payments/{paymentId}')
  .onCreate(async (snap, context) => {
    const paymentId = context.params.paymentId;
    const data = snap.data() as QRPayment;
    const ref = snap.ref;

    // Idempotency: only process freshly created pending requests
    if (data.status !== 'pending') {
      console.log(`[QRPay] ${paymentId} ignored (status=${data.status})`);
      return null;
    }

    // ---- Validation ----
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      await ref.update({
        status: 'failed',
        failureReason: `Montant invalide (${amount})`,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }

    if (!data.sellerId || !['orange', 'mtn', 'wallet'].includes(data.method)) {
      await ref.update({
        status: 'failed',
        failureReason: 'sellerId ou méthode invalide',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }

    // Verify seller exists
    const sellerDoc = await db.collection('sellers').doc(data.sellerId).get();
    if (!sellerDoc.exists) {
      await ref.update({
        status: 'failed',
        failureReason: 'Vendeur introuvable',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }

    const commission = Math.round(amount * COMMISSION_RATE);
    const netAmount = amount - commission;

    try {
      if (data.method === 'wallet') {
        return await processWalletQRPayment({
          paymentId,
          data,
          amount,
          commission,
          netAmount,
        });
      }

      // OM / MTN — return USSD instructions, await webhook confirmation
      return await initMobileMoneyQRPayment({
        paymentId,
        data,
        amount,
      });
    } catch (err: any) {
      console.error('[QRPay] processing error', paymentId, err);
      await ref.update({
        status: 'failed',
        failureReason: err?.message || 'Erreur interne',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }
  });

/**
 * Wallet → atomic debit buyer / credit seller / record commission
 */
async function processWalletQRPayment(args: {
  paymentId: string;
  data: QRPayment;
  amount: number;
  commission: number;
  netAmount: number;
}) {
  const { paymentId, data, amount, commission, netAmount } = args;
  const ref = db.collection('merchant_qr_payments').doc(paymentId);

  if (!data.buyerUid) {
    await ref.update({
      status: 'failed',
      failureReason: 'Connexion requise pour paiement wallet',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  }

  // 1. Debit buyer (throws on insufficient funds)
  const debit = await updateWalletTransaction(
    data.buyerUid,
    amount,
    'debit',
    `Paiement QR boutique ${data.shopName || data.sellerId}`,
    { qrPaymentId: paymentId, sellerId: data.sellerId, type: 'merchant_qr' }
  );

  // 2. Credit seller (net, 95%)
  const credit = await updateWalletTransaction(
    data.sellerId,
    netAmount,
    'credit',
    `Vente QR ${data.note ? '— ' + data.note : ''}`.trim(),
    {
      qrPaymentId: paymentId,
      buyerUid: data.buyerUid,
      gross: amount,
      commission,
      type: 'merchant_qr_sale',
    }
  );

  // 3. Audit payment record + ledger entry
  const batch = db.batch();
  batch.set(db.collection('payments').doc(), {
    source: 'merchant_qr',
    qrPaymentId: paymentId,
    sellerId: data.sellerId,
    buyerUid: data.buyerUid,
    method: 'wallet',
    amount,
    commission,
    netAmount,
    currency: 'GNF',
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.set(db.collection('platform_revenue').doc(), {
    source: 'merchant_qr_commission',
    qrPaymentId: paymentId,
    sellerId: data.sellerId,
    amount: commission,
    currency: 'GNF',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  batch.update(ref, {
    status: 'completed',
    commission,
    netAmount,
    buyerTxId: debit.transactionId,
    sellerTxId: credit.transactionId,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await batch.commit();

  // 4. Notifications
  await Promise.allSettled([
    sendNotification({
      userId: data.sellerId,
      type: 'payment_received',
      title: '💰 Nouveau paiement QR',
      body: `+${netAmount.toLocaleString()} GNF de ${data.buyerName || 'un client'}${
        data.note ? ` — ${data.note}` : ''
      }`,
      data: { qrPaymentId: paymentId, amount: String(netAmount) },
    }),
    sendNotification({
      userId: data.buyerUid,
      type: 'payment_sent',
      title: 'Paiement effectué',
      body: `${amount.toLocaleString()} GNF envoyés à ${data.shopName || 'la boutique'}.`,
      data: { qrPaymentId: paymentId },
    }),
  ]);

  console.log(`[QRPay] wallet ${paymentId} OK net=${netAmount} commission=${commission}`);
  return null;
}

/**
 * OM / MTN — mark as processing + return USSD instructions to the buyer.
 * Real STK push integration happens in initiateOrangeMoneyPayment /
 * initiateMTNMoMoPayment; the existing webhooks finalize the payment.
 */
async function initMobileMoneyQRPayment(args: {
  paymentId: string;
  data: QRPayment;
  amount: number;
}) {
  const { paymentId, data, amount } = args;
  const ref = db.collection('merchant_qr_payments').doc(paymentId);

  const isOrange = data.method === 'orange';
  const ussd = isOrange ? '*144#' : '*170#';
  const operator = isOrange ? 'Orange Money' : 'MTN MoMo';
  const code = 'SAREMATY';

  const instructions = `Pour confirmer ${amount.toLocaleString()} GNF à ${
    data.shopName || 'la boutique'
  } :
1. Composez ${ussd}
2. Choisissez "Paiement marchand"
3. Code marchand: ${code}
4. Montant: ${amount}
5. Réf: ${paymentId.slice(0, 8).toUpperCase()}
6. Validez avec votre code secret`;

  await ref.update({
    status: 'processing',
    operator,
    ussd,
    merchantCode: code,
    instructions,
    expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 15 * 60 * 1000),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify the seller so they can confirm the receipt in shop
  await sendNotification({
    userId: data.sellerId,
    type: 'payment_pending',
    title: '⏳ Paiement QR en attente',
    body: `${data.buyerPhone || 'Un client'} initie ${amount.toLocaleString()} GNF via ${operator}.`,
    data: { qrPaymentId: paymentId, amount: String(amount) },
  }).catch((e) => console.warn('[QRPay] seller notif failed', e));

  console.log(`[QRPay] ${data.method} ${paymentId} awaiting webhook`);
  return null;
}
