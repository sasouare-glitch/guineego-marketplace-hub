"use strict";
/**
 * PRODUCTS FUNCTION: Create Product
 * Seller function to create new product
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
exports.createProduct = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Create new product (seller only)
 * httpsCallable: createProduct
 */
exports.createProduct = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const token = (context.auth?.token || {});
    // Seller/admin verification: prefer token claims, fallback to Firestore /users/{uid}
    const tokenRole = token.role;
    const tokenRoles = Array.isArray(token.roles) ? token.roles : [];
    let allowed = tokenRole === 'admin' || tokenRole === 'ecommerce' || tokenRoles.includes('admin') || tokenRoles.includes('ecommerce');
    if (!allowed) {
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : null;
        const docRole = userData?.role || undefined;
        const docRoles = Array.isArray(userData?.roles) ? userData?.roles : [];
        allowed = docRole === 'admin' || docRole === 'ecommerce' || docRoles.includes('admin') || docRoles.includes('ecommerce');
    }
    if (!allowed) {
        throw new functions.https.HttpsError('permission-denied', 'Accès refusé (vendeur requis)');
    }
    // Seller ID: accept either business id (ecommerceId/ecomId) or fallback to UID
    const sellerId = token.ecommerceId || token.ecomId || uid;
    // Validate required fields (description/images can be empty on the UI)
    if (!data.name || !data.category || !data.basePrice) {
        throw new functions.https.HttpsError('invalid-argument', 'Nom, catégorie et prix sont requis');
    }
    const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : ['/placeholder.svg'];
    try {
        const productRef = db.collection('products').doc();
        const now = admin.firestore.FieldValue.serverTimestamp();
        // Generate SKU for variants
        const variants = data.variants?.map((v, idx) => ({
            ...v,
            sku: v.sku || `${productRef.id}-V${idx + 1}`,
            stock: v.stock || 0
        })) || [{
                sku: `${productRef.id}-DEFAULT`,
                name: 'Standard',
                price: data.basePrice,
                stock: 0
            }];
        // Calculate total stock
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        const product = {
            id: productRef.id,
            name: data.name,
            description: data.description || '',
            category: data.category,
            subcategory: data.subcategory || null,
            basePrice: data.basePrice,
            price: data.basePrice, // Current display price
            images,
            thumbnail: images[0],
            variants,
            totalStock,
            sellerId,
            sellerRef: db.collection('ecommerces').doc(sellerId),
            tags: data.tags || [],
            specifications: data.specifications || {},
            avgRating: 0,
            totalReviews: 0,
            totalSales: 0,
            status: 'active',
            featured: false,
            createdAt: now,
            updatedAt: now
        };
        await productRef.set(product);
        // Update seller's product count (best-effort)
        try {
            const ecomRef = db.collection('ecommerces').doc(sellerId);
            const ecomDoc = await ecomRef.get();
            if (ecomDoc.exists) {
                await ecomRef.update({
                    totalProducts: admin.firestore.FieldValue.increment(1)
                });
            }
        }
        catch (e) {
            console.warn('Could not update ecommerces totalProducts:', e);
        }
        return {
            success: true,
            productId: productRef.id,
            message: 'Produit créé avec succès'
        };
    }
    catch (error) {
        console.error('Error creating product:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la création du produit');
    }
});
//# sourceMappingURL=createProduct.js.map