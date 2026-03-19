"use strict";
/**
 * NOTIFICATIONS: Send Order Status Change Notification
 * Sends SMS (Orange API) + Email (Firebase Trigger Email Extension)
 * when an order status changes (confirmed, in_delivery, delivered)
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
exports.sendStatusNotification = sendStatusNotification;
const admin = __importStar(require("firebase-admin"));
const emailTemplate_1 = require("../utils/emailTemplate");
const sendgrid_1 = require("../utils/sendgrid");
const db = admin.firestore();
const statusMessages = {
    confirmed: {
        emoji: '✅',
        title: 'Commande confirmée',
        body: 'Votre commande a été confirmée par le vendeur et est en cours de préparation.',
        sms: 'Commande confirmée! Le vendeur prépare votre colis.',
    },
    preparing: {
        emoji: '📦',
        title: 'Commande en préparation',
        body: 'Votre commande est en cours de préparation par le vendeur.',
        sms: 'Votre commande est en cours de préparation.',
    },
    ready: {
        emoji: '🏪',
        title: 'Commande prête',
        body: 'Votre commande est prête et en attente d\'un coursier pour la livraison.',
        sms: 'Votre commande est prête! Un coursier sera assigné sous peu.',
    },
    shipped: {
        emoji: '🚚',
        title: 'Commande expédiée',
        body: 'Votre commande a été confiée à un coursier.',
        sms: 'Votre commande a été expédiée!',
    },
    in_delivery: {
        emoji: '🛵',
        title: 'Commande en livraison',
        body: 'Votre coursier est en route ! Votre commande arrive bientôt.',
        sms: 'Votre coursier est en route! Livraison imminente.',
    },
    delivered: {
        emoji: '🎉',
        title: 'Commande livrée',
        body: 'Votre commande a été livrée avec succès. Merci pour votre confiance !',
        sms: 'Commande livrée avec succès! Merci pour votre confiance.',
    },
    cancelled: {
        emoji: '❌',
        title: 'Commande annulée',
        body: 'Votre commande a été annulée. Contactez-nous pour plus d\'informations.',
        sms: 'Votre commande a été annulée.',
    },
};
/**
 * Send status change notification via Email + SMS
 */
async function sendStatusNotification(data) {
    const { orderId, customerId, status } = data;
    const msgConfig = statusMessages[status];
    if (!msgConfig)
        return;
    const customerDoc = await db.collection('users').doc(customerId).get();
    const customer = customerDoc.data();
    if (!customer)
        return;
    const customerName = data.customerName || customer.displayName || 'Client';
    const promises = [];
    // 1. Email
    if (customer.email) {
        promises.push(sendStatusEmail(customer.email, orderId, status, msgConfig, customerName));
    }
    // 2. SMS — priorité: phone passé en paramètre > shippingAddress > profil utilisateur
    const phone = data.phone || customer.phone || customer.phoneNumber;
    if (phone) {
        promises.push(sendStatusSMS(phone, orderId, status, msgConfig));
    }
    else {
        console.warn(`⚠️ Pas de numéro de téléphone trouvé pour le client ${customerId} — SMS non envoyé`);
    }
    await Promise.allSettled(promises);
}
async function sendStatusEmail(email, orderId, status, msg, customerName) {
    try {
        const statusColor = status === 'cancelled' ? emailTemplate_1.COLORS.red : status === 'delivered' ? emailTemplate_1.COLORS.green : emailTemplate_1.COLORS.green;
        const buttonLabel = status === 'delivered' ? '⭐ Laisser un avis' : '📍 Suivre ma commande';
        const bodyContent = `
      <h2 style="margin: 0 0 8px; font-size: 22px; color: ${statusColor};">${msg.emoji} ${msg.title}</h2>
      <p style="margin: 0 0 20px; font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText};">
        Bonjour <strong>${customerName}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; color: ${emailTemplate_1.COLORS.bodyText};">${msg.body}</p>

      <div style="background-color: ${emailTemplate_1.COLORS.lightBg}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: ${emailTemplate_1.COLORS.mutedText};">Numéro de commande</p>
        <p style="margin: 4px 0 0; font-size: 18px; font-weight: 700; color: ${emailTemplate_1.COLORS.darkText}; letter-spacing: 0.5px;">${orderId}</p>
      </div>

      ${(0, emailTemplate_1.ctaButton)(buttonLabel, `${emailTemplate_1.APP_URL}/order/${orderId}`, statusColor)}
    `;
        const subject = `${msg.emoji} ${msg.title} — Commande ${orderId}`;
        const html = (0, emailTemplate_1.wrapInTemplate)(bodyContent);
        // Dual strategy: Firestore 'mail' collection + SendGrid fallback
        await (0, sendgrid_1.sendEmailWithFallback)({ to: email, subject, html });
        console.log(`✅ Email statut "${status}" envoyé à ${email} pour commande ${orderId}`);
    }
    catch (error) {
        console.error(`❌ Erreur envoi email statut pour commande ${orderId}:`, error);
    }
}
async function sendStatusSMS(phone, orderId, status, msg) {
    const formattedPhone = formatGuineaPhone(phone);
    const smsMessage = `GuineeGo: ${msg.sms} Commande ${orderId}. Suivi: ${emailTemplate_1.APP_URL}/order/${orderId}`;
    const logRef = db.collection('sms_logs').doc();
    const logBase = {
        type: `status_${status}`,
        to: formattedPhone,
        message: smsMessage,
        orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    try {
        const configDoc = await db.collection('config').doc('orange_sms').get();
        const config = configDoc.data();
        if (!config?.clientId || !config?.clientSecret) {
            await logRef.set({ ...logBase, status: 'failed', error: 'Orange SMS API non configurée' });
            return;
        }
        if (!config?.enabled) {
            await logRef.set({ ...logBase, status: 'failed', error: 'SMS désactivé' });
            return;
        }
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
            throw new Error(`Token failed: ${tokenResponse.status}`);
        }
        const { access_token } = await tokenResponse.json();
        const senderAddress = config.senderAddress || 'tel:+224000000000';
        const encodedSender = encodeURIComponent(senderAddress);
        const smsResponse = await fetch(`https://api.orange.com/smsmessaging/v1/outbound/${encodedSender}/requests`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
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
            await logRef.set({ ...logBase, status: 'failed', error: `SMS échoué [${smsResponse.status}]: ${errorBody}` });
            throw new Error(`SMS failed [${smsResponse.status}]: ${errorBody}`);
        }
        const responseBody = await smsResponse.text();
        await logRef.set({ ...logBase, status: 'sent', response: responseBody });
        console.log(`✅ SMS statut "${status}" envoyé à ${formattedPhone} pour commande ${orderId}`);
    }
    catch (error) {
        const existingLog = await logRef.get();
        if (!existingLog.exists) {
            await logRef.set({ ...logBase, status: 'failed', error: error?.message || String(error) });
        }
        console.error(`❌ Erreur envoi SMS statut pour commande ${orderId}:`, error);
    }
}
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
//# sourceMappingURL=sendStatusNotification.js.map