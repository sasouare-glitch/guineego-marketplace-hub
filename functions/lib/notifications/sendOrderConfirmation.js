"use strict";
/**
 * NOTIFICATIONS: Send Order Confirmation
 * Sends SMS (Orange API) + Email (Firebase Trigger Email Extension)
 * after a successful order creation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmation = sendOrderConfirmation;
const admin = __importStar(require("firebase-admin"));
const emailTemplate_1 = require("../utils/emailTemplate");
const sendgrid_1 = require("../utils/sendgrid");
const db = admin.firestore();
/**
 * Send order confirmation via Email + SMS
 */
async function sendOrderConfirmation(order) {
    const isGuest = order.customerId.startsWith('guest_');
    const promises = [];
    // 1. Send Email (only for registered users)
    if (!isGuest) {
        try {
            const customerDoc = await db.collection('users').doc(order.customerId).get();
            const email = customerDoc.data()?.email;
            if (email) {
                promises.push(sendConfirmationEmail(email, order));
            }
        }
        catch (error) {
            console.warn(`⚠️ Impossible de récupérer l'email du client ${order.customerId}:`, error);
        }
    }
    // 2. Send SMS (via Orange SMS API) — works for both guests and registered users
    const phone = order.shippingAddress.phone;
    if (phone) {
        promises.push(sendConfirmationSMS(phone, order));
    }
    await Promise.allSettled(promises);
}
/**
 * Write to 'mail' collection — Firebase Trigger Email Extension picks it up
 */
async function sendConfirmationEmail(email, order) {
    try {
        const itemsList = order.items
            .map(item => `• ${item.name} x${item.quantity} — ${item.price.toLocaleString()} GNF`)
            .join('<br>');
        const itemsHtml = order.items
            .map(item => `
        <tr>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailTemplate_1.COLORS.darkText};">${item.name} <span style="color: ${emailTemplate_1.COLORS.mutedText};">x${item.quantity}</span></td>
          <td style="padding: 8px 0; font-size: 14px; color: ${emailTemplate_1.COLORS.darkText}; text-align: right;">${item.price.toLocaleString()} GNF</td>
        </tr>`)
            .join('');
        const bodyContent = `
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${emailTemplate_1.COLORS.green};">✅ Commande confirmée !</h2>
      <p style="margin: 0 0 20px; font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText};">
        Bonjour <strong>${order.shippingAddress.fullName}</strong>, votre commande a été créée avec succès.
      </p>

      <div style="background-color: ${emailTemplate_1.COLORS.lightBg}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: ${emailTemplate_1.COLORS.mutedText};">Numéro de commande</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: ${emailTemplate_1.COLORS.darkText}; letter-spacing: 0.5px;">${order.id}</p>
      </div>

      ${(0, emailTemplate_1.sectionTitle)('📦', 'Articles commandés')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${itemsHtml}
      </table>

      ${(0, emailTemplate_1.divider)()}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${(0, emailTemplate_1.infoRow)('Sous-total', `${order.pricing.subtotal.toLocaleString()} GNF`)}
        ${(0, emailTemplate_1.infoRow)('Livraison', `${order.pricing.shippingFee.toLocaleString()} GNF`)}
        ${order.pricing.discount > 0 ? (0, emailTemplate_1.infoRow)('Réduction', `-${order.pricing.discount.toLocaleString()} GNF`) : ''}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: ${emailTemplate_1.COLORS.darkText};">Total</td>
          <td style="padding: 12px 0 0; font-size: 18px; font-weight: 700; color: ${emailTemplate_1.COLORS.green}; text-align: right;">${order.pricing.total.toLocaleString()} GNF</td>
        </tr>
      </table>

      ${(0, emailTemplate_1.divider)()}

      ${(0, emailTemplate_1.sectionTitle)('📍', 'Livraison')}
      <p style="margin: 0; font-size: 14px; color: ${emailTemplate_1.COLORS.bodyText};">${order.shippingAddress.address}, ${order.shippingAddress.commune}</p>
      
      <div style="margin-top: 12px;">
        ${(0, emailTemplate_1.sectionTitle)('💳', 'Paiement')}
        <p style="margin: 0; font-size: 14px; color: ${emailTemplate_1.COLORS.bodyText};">${formatPaymentMethod(order.paymentMethod)}</p>
      </div>

      ${(0, emailTemplate_1.ctaButton)('📍 Suivre ma commande', `${emailTemplate_1.APP_URL}/order/${order.id}`)}
    `;
        const subject = `✅ Commande ${order.id} confirmée — GuineeGo`;
        const html = (0, emailTemplate_1.wrapInTemplate)(bodyContent);
        // Dual strategy: Firestore 'mail' collection + SendGrid fallback
        await (0, sendgrid_1.sendEmailWithFallback)({ to: email, subject, html });
        console.log(`✅ Email de confirmation envoyé à ${email} pour commande ${order.id}`);
    }
    catch (error) {
        console.error(`❌ Erreur envoi email pour commande ${order.id}:`, error);
    }
}
/**
 * Send SMS via Orange SMS API (Guinea)
 */
async function sendConfirmationSMS(phone, order) {
    const formattedPhone = formatGuineaPhone(phone);
    const trackingLink = `${emailTemplate_1.APP_URL}/track/${order.id}?phone=${encodeURIComponent(formattedPhone)}`;
    const smsMessage = `GuineeGo: Commande ${order.id} confirmée! ` +
        `Total: ${order.pricing.total.toLocaleString()} GNF. ` +
        `Suivi: ${trackingLink}`;
    const logRef = db.collection('sms_logs').doc();
    const logBase = {
        type: 'order_confirmation',
        to: formattedPhone,
        message: smsMessage,
        orderId: order.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    try {
        // Get Orange API credentials
        const configDoc = await db.collection('config').doc('orange_sms').get();
        const config = configDoc.data();
        if (!config?.clientId || !config?.clientSecret) {
            await logRef.set({ ...logBase, status: 'failed', error: 'Orange SMS API non configurée (clientId/clientSecret manquant)' });
            console.warn('⚠️ Orange SMS API non configurée — SMS non envoyé');
            return;
        }
        if (!config?.enabled) {
            await logRef.set({ ...logBase, status: 'failed', error: 'SMS désactivé dans la configuration' });
            console.warn('⚠️ Orange SMS désactivé — SMS non envoyé');
            return;
        }
        // 1. Get OAuth token
        const tokenResponse = await fetch('https://api.orange.com/oauth/v3/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });
        if (!tokenResponse.ok) {
            const tokenError = await tokenResponse.text();
            await logRef.set({ ...logBase, status: 'failed', error: `Token OAuth échoué [${tokenResponse.status}]: ${tokenError}` });
            throw new Error(`Token request failed: ${tokenResponse.status}`);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        // 2. Send SMS
        const senderAddress = config.senderAddress || 'tel:+224000000000';
        const encodedSender = encodeURIComponent(senderAddress);
        const smsResponse = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                outboundSMSMessageRequest: {
                    address: `tel:${formattedPhone}`,
                    senderAddress,
                    outboundSMSTextMessage: { message: smsMessage },
                },
            }),
        });
        if (!smsResponse.ok) {
            const errorBody = await smsResponse.text();
            await logRef.set({ ...logBase, status: 'failed', error: `SMS envoi échoué [${smsResponse.status}]: ${errorBody}` });
            throw new Error(`SMS send failed [${smsResponse.status}]: ${errorBody}`);
        }
        const responseBody = await smsResponse.text();
        await logRef.set({ ...logBase, status: 'sent', response: responseBody });
        console.log(`✅ SMS de confirmation envoyé à ${formattedPhone} pour commande ${order.id}`);
    }
    catch (error) {
        // If not already logged above, log the catch-all error
        const existingLog = await logRef.get();
        if (!existingLog.exists) {
            await logRef.set({ ...logBase, status: 'failed', error: error?.message || String(error) });
        }
        console.error(`❌ Erreur envoi SMS pour commande ${order.id}:`, error);
    }
}
/**
 * Format phone number for Guinea (+224)
 */
function formatGuineaPhone(phone) {
    const cleaned = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+224'))
        return cleaned;
    if (cleaned.startsWith('224'))
        return `+${cleaned}`;
    if (cleaned.startsWith('6') || cleaned.startsWith('3'))
        return `+224${cleaned}`;
    return `+224${cleaned}`;
}
/**
 * Human-readable payment method
 */
function formatPaymentMethod(method) {
    const methods = {
        'orange_money': 'Orange Money',
        'mtn_money': 'MTN Mobile Money',
        'card': 'Carte bancaire',
        'wallet': 'Portefeuille GuineeGo',
        'cash': 'Paiement à la livraison',
    };
    return methods[method] || method;
}
//# sourceMappingURL=sendOrderConfirmation.js.map