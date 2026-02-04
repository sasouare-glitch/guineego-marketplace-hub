/**
 * ACADEMY FUNCTION: Purchase Course
 * Handle course purchases and enrollment
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { updateWalletTransaction } from '../utils/firestore';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface PurchaseCourseData {
  courseId: string;
  paymentMethod: 'wallet' | 'orange_money' | 'mtn_money';
  phone?: string;
}

/**
 * Purchase course and enroll user
 * httpsCallable: purchaseCourse
 */
export const purchaseCourse = functions
  .region('europe-west1')
  .https.onCall(async (data: PurchaseCourseData, context) => {
    const uid = verifyAuth(context);
    const { courseId, paymentMethod, phone } = data;

    if (!courseId || !paymentMethod) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'courseId et paymentMethod sont requis'
      );
    }

    try {
      // Get course
      const courseDoc = await db.collection('academy').doc(courseId).get();

      if (!courseDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Formation non trouvée');
      }

      const course = courseDoc.data()!;

      // Check if already enrolled
      const enrollmentQuery = await db.collection('enrollments')
        .where('userId', '==', uid)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();

      if (!enrollmentQuery.empty) {
        throw new functions.https.HttpsError(
          'already-exists',
          'Vous êtes déjà inscrit à cette formation'
        );
      }

      let paymentResult: any = null;

      // Process payment
      if (course.price > 0) {
        if (paymentMethod === 'wallet') {
          paymentResult = await updateWalletTransaction(
            uid,
            course.price,
            'debit',
            `Achat formation: ${course.title}`,
            { courseId, type: 'course_purchase' }
          );
        } else {
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
      await sendNotification({
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

    } catch (error: any) {
      console.error('Error purchasing course:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'inscription'
      );
    }
  });
