"use strict";
/**
 * PRODUCTS FUNCTION: List Products
 * Public paginated product listing with filters
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
exports.listProducts = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * List products with pagination and filters
 * httpsCallable: listProducts
 */
exports.listProducts = functions
    .region('europe-west1')
    .https.onCall(async (data) => {
    const { category, sellerId, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', limit = 20, startAfter } = data;
    try {
        // Build query
        let query = db.collection('products')
            .where('status', '==', 'active');
        // Apply filters
        if (category) {
            query = query.where('category', '==', category);
        }
        if (sellerId) {
            query = query.where('sellerId', '==', sellerId);
        }
        if (minPrice !== undefined) {
            query = query.where('price', '>=', minPrice);
        }
        if (maxPrice !== undefined) {
            query = query.where('price', '<=', maxPrice);
        }
        // Order by
        const orderField = sortBy === 'sales' ? 'totalSales' :
            sortBy === 'rating' ? 'avgRating' :
                sortBy;
        query = query.orderBy(orderField, sortOrder);
        // Pagination
        if (startAfter) {
            const startDoc = await db.collection('products').doc(startAfter).get();
            if (startDoc.exists) {
                query = query.startAfter(startDoc);
            }
        }
        query = query.limit(limit + 1);
        // Execute query
        const snapshot = await query.get();
        const docs = snapshot.docs.slice(0, limit);
        const products = docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return {
            data: products,
            lastDoc: docs.length > 0 ? docs[docs.length - 1].id : null,
            hasMore: snapshot.docs.length > limit
        };
    }
    catch (error) {
        console.error('Error listing products:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de la récupération des produits');
    }
});
//# sourceMappingURL=listProducts.js.map