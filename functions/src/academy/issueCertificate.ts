/**
 * ACADEMY FUNCTION: Issue Certificate
 * Generate certificate for completed course
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuth } from '../utils/auth';
import { sendNotification } from '../utils/notifications';

const db = admin.firestore();

interface IssueCertificateData {
  enrollmentId: string;
}

/**
 * Issue certificate for completed course
 * httpsCallable: issueCertificate
 */
export const issueCertificate = functions
  .region('europe-west1')
  .https.onCall(async (data: IssueCertificateData, context) => {
    const uid = verifyAuth(context);
    const { enrollmentId } = data;

    if (!enrollmentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'enrollmentId est requis'
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

      // Check if course is completed
      if (enrollment.progress < 100) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Formation non terminée'
        );
      }

      // Check if certificate already exists
      if (enrollment.certificateId) {
        const existingCert = await db.collection('certificates')
          .doc(enrollment.certificateId)
          .get();
        
        if (existingCert.exists) {
          return {
            success: true,
            certificateId: enrollment.certificateId,
            message: 'Certificat déjà émis'
          };
        }
      }

      // Get user and course info
      const [userDoc, courseDoc] = await Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('academy').doc(enrollment.courseId).get()
      ]);

      const user = userDoc.data()!;
      const course = courseDoc.data()!;

      // Generate certificate ID
      const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;

      // Create certificate
      const certificateRef = db.collection('certificates').doc(certId);
      await certificateRef.set({
        id: certId,
        userId: uid,
        userName: user.displayName,
        courseId: enrollment.courseId,
        courseTitle: course.title,
        courseDuration: course.duration,
        enrollmentId,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: enrollment.completedAt,
        averageQuizScore: calculateAverageScore(enrollment.quizScores),
        verificationUrl: `https://guineego.com/verify/${certId}`
      });

      // Update enrollment
      await enrollmentRef.update({
        certificateId: certId
      });

      // Notify user
      await sendNotification({
        userId: uid,
        type: 'certificate_issued',
        title: 'Certificat émis !',
        body: `Votre certificat pour "${course.title}" est prêt !`,
        data: { certificateId: certId, courseId: enrollment.courseId }
      });

      // Update user stats
      await db.collection('users').doc(uid).update({
        certificatesEarned: admin.firestore.FieldValue.increment(1)
      });

      return {
        success: true,
        certificateId: certId,
        verificationUrl: `https://guineego.com/verify/${certId}`,
        message: 'Certificat émis avec succès'
      };

    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal',
        'Erreur lors de l\'émission du certificat'
      );
    }
  });

/**
 * Calculate average quiz score
 */
function calculateAverageScore(quizScores: Record<string, number>): number {
  const scores = Object.values(quizScores || {});
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
