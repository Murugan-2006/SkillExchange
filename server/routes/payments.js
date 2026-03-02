import express from 'express';
import {
  payCourseWithCredits,
  getPaymentHistory,
  getPaymentDetails,
  getAllPayments,
  freeEnroll,
  initiatePhonePePayment,
  phonePeCallback,
  phonePeStatusRedirect,
  checkPhonePeStatus,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// PhonePe routes (must be before /:paymentId to avoid conflict)
router.post('/phonepe/initiate', authMiddleware, initiatePhonePePayment);
router.post('/phonepe/callback', phonePeCallback);  // No auth - called by PhonePe server
router.get('/phonepe/status/:transactionId', phonePeStatusRedirect);  // Redirect from PhonePe
router.get('/phonepe/check/:paymentId', authMiddleware, checkPhonePeStatus);  // Frontend status check

// Student routes
router.post('/credits', authMiddleware, payCourseWithCredits);
router.post('/free', authMiddleware, freeEnroll);            // Free enrollment
router.get('/history', authMiddleware, getPaymentHistory);

// Admin routes
router.get('/', authMiddleware, getAllPayments);

// This must be LAST as it catches any /:paymentId
router.get('/:paymentId', authMiddleware, getPaymentDetails);

export default router;
