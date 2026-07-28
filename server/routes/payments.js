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
import Payment from '../models/Payment.js';

const router = express.Router();

// PhonePe routes (must be before /:paymentId to avoid conflict)
router.post('/phonepe/initiate', authMiddleware, initiatePhonePePayment);
router.post('/phonepe/callback', phonePeCallback);  // No auth - called by PhonePe server
router.get('/phonepe/status/:transactionId', phonePeStatusRedirect);  // Redirect from PhonePe
router.get('/phonepe/check/:paymentId', authMiddleware, checkPhonePeStatus);  // Frontend status check

// Test endpoint to check pending payments (REMOVE IN PRODUCTION)
router.get('/test/pending/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const payment = await Payment.findOne({
      phonepeMerchantTransactionId: transactionId,
    }).populate('student course');
    
    res.json({
      found: !!payment,
      payment: payment ? {
        _id: payment._id,
        status: payment.status,
        phonepeMerchantTransactionId: payment.phonepeMerchantTransactionId,
        phonepeTransactionId: payment.phonepeTransactionId,
        amount: payment.amount,
        student: payment.student?.email,
        course: payment.course?.title,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student routes
router.post('/credits', authMiddleware, payCourseWithCredits);
router.post('/free', authMiddleware, freeEnroll);            // Free enrollment
router.get('/history', authMiddleware, getPaymentHistory);

// Admin routes
router.get('/', authMiddleware, getAllPayments);

// This must be LAST as it catches any /:paymentId
router.get('/:paymentId', authMiddleware, getPaymentDetails);

export default router;
