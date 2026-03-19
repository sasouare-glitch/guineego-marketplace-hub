"use strict";
/**
 * ACADEMY FUNCTION: Update Progress
 * Track lesson completion and progress
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
exports.updateProgress = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Update course progress
 * httpsCallable: updateProgress
 */
exports.updateProgress = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    const uid = (0, auth_1.verifyAuth)(context);
    const { enrollmentId, lessonId, completed, watchTime, quizScore } = data;
    if (!enrollmentId || !lessonId) {
        throw new functions.https.HttpsError('invalid-argument', 'enrollmentId et lessonId sont requis');
    }
    try {
        const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
        const enrollmentDoc = await enrollmentRef.get();
        if (!enrollmentDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Inscription non trouvée');
        }
        const enrollment = enrollmentDoc.data();
        // Verify ownership
        if (enrollment.userId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'Accès non autorisé');
        }
        // Get course to calculate progress
        const courseDoc = await db.collection('academy').doc(enrollment.courseId).get();
        const course = courseDoc.data();
        const totalLessons = course.lessons?.length || 1;
        // Update completed lessons
        const completedLessons = [...(enrollment.completedLessons || [])];
        if (completed && !completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
        }
        // Calculate progress percentage
        const progress = Math.round((completedLessons.length / totalLessons) * 100);
        // Update quiz scores if provided
        const quizScores = { ...(enrollment.quizScores || {}) };
        if (quizScore !== undefined) {
            quizScores[lessonId] = quizScore;
        }
        // Check if course is completed
        const isCompleted = progress === 100;
        const updateData = {
            completedLessons,
            progress,
            quizScores,
            lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (watchTime) {
            updateData.totalWatchTime = admin.firestore.FieldValue.increment(watchTime);
        }
        if (isCompleted && !enrollment.completedAt) {
            updateData.completedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await enrollmentRef.update(updateData);
        // Update user's learning stats
        await db.collection('users').doc(uid).update({
            totalWatchTime: admin.firestore.FieldValue.increment(watchTime || 0),
            completedLessons: admin.firestore.FieldValue.increment(completed ? 1 : 0)
        });
        return {
            success: true,
            progress,
            isCompleted,
            completedLessons: completedLessons.length,
            totalLessons,
            message: isCompleted
                ? 'Formation terminée ! Félicitations !'
                : `Progression: ${progress}%`
        };
    }
    catch (error) {
        console.error('Error updating progress:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Erreur lors de la mise à jour');
    }
});
//# sourceMappingURL=updateProgress.js.map