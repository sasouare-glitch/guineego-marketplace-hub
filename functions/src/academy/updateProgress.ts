/**
 * ACADEMY FUNCTION: Update Progress
 * Track lesson completion and progress
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';

const db = admin.firestore();

interface UpdateProgressData {
  enrollmentId: string;
  lessonId: string;
  completed: boolean;
  watchTime?: number;
  quizScore?: number;
}

/**
 * Update course progress
 * httpsCallable: updateProgress
 */
export const updateProgress = functions
  .region('europe-west1')
  .https.onCall(async (data: UpdateProgressData, context) => {
    const uid = verifyAuth(context);
    const { enrollmentId, lessonId, completed, watchTime, quizScore } = data;

    if (!enrollmentId || !lessonId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'enrollmentId et lessonId sont requis'
      );
    }

    try {
      const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
      const enrollmentDoc = await enrollmentRef.get();

      if (!enrollmentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Inscription non trouvée');
      }

      const enrollment = enrollmentDoc.data()!;

      // Verify ownership
      if (enrollment.userId !== uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Accès non autorisé'
        );
      }

      // Get course to calculate progress
      const courseDoc = await db.collection('academy').doc(enrollment.courseId).get();
      const course = courseDoc.data()!;
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

      const updateData: any = {
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

    } catch (error: any) {
      console.error('Error updating progress:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de la mise à jour'
      );
    }
  });
