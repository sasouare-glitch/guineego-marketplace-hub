"use strict";
/**
 * ACADEMY FUNCTION: Purchase Course
 * Handle course purchases and enrollment
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
exports.purchaseCourse = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const firestore_1 = require("../utils/firestore");
const notifications_1 = require("../utils/notifications");
const db = admin.firestore();
/**
 * Purchase course and enroll user
 * httpsCallable: purchaseCourse
 */
exports.purchaseCourse = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { courseId, paymentMethod, phone } = data;
    if (!courseId || !paymentMethod) {
        throw new functions.https.HttpsError('invalid-argument', 'courseId et paymentMethod sont requis');
    }
    try {
        // Get course
        const courseDoc = await db.collection('academy').doc(courseId).get();
        if (!courseDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Formation non trouvée');
        }
        const course = courseDoc.data();
        // Check if already enrolled
        const enrollmentQuery = await db.collection('enrollments')
            .where('userId', '==', uid)
            .where('courseId', '==', courseId)
            .limit(1)
            .get();
        if (!enrollmentQuery.empty) {
            throw new functions.https.HttpsError('already-exists', 'Vous êtes déjà inscrit à cette formation');
        }
        let paymentResult = null;
        // Process payment
        if (course.price > 0) {
            if (paymentMethod === 'wallet') {
                paymentResult = await (0, firestore_1.updateWalletTransaction)(uid, course.price, 'debit', `Achat formation: ${course.title}`, { courseId, type: 'course_purchase' });
            }
            else {
                // Create pending payment for mobile money
                const paymentRef = db.collection('payments').doc();
                await paymentRef.set({
                    id: paymentRef.id,
                    type: 'course',
                    courseId,
                    customerId: uid,
                    amount: course.price,
                    method: paymentMethod,
                    phone: phone || null,
                    status: 'pending',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                return {
                    success: true,
                    status: 'payment_pending',
                    paymentId: paymentRef.id,
                    message: 'Veuillez confirmer le paiement mobile'
                };
            }
        }
        // Create enrollment
        const enrollmentRef = db.collection('enrollments').doc();
        await enrollmentRef.set({
            id: enrollmentRef.id,
            userId: uid,
            courseId,
            courseTitle: course.title,
            progress: 0,
            completedLessons: [],
            currentLesson: 0,
            quizScores: {},
            certificateId: null,
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: null
        });
        // Update course stats
        await courseDoc.ref.update({
            enrollmentCount: admin.firestore.FieldValue.increment(1),
            revenue: admin.firestore.FieldValue.increment(course.price)
        });
        // Notify user
        await (0, notifications_1.sendNotification)({
            userId: uid,
            type: 'course_purchased',
            title: 'Inscription confirmée !',
            body: `Vous êtes inscrit à "${course.title}". Commencez maintenant !`,
            data: { courseId, enrollmentId: enrollmentRef.id }
        });
        return {
            success: true,
            enrollmentId: enrollmentRef.id,
            transactionId: paymentResult?.transactionId,
            message: 'Inscription réussie'
        };
    }
    catch (error) {
        console.error('Error purchasing course:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'inscription');
    }
});
//# sourceMappingURL=purchaseCourse.js.map