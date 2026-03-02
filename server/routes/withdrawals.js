import express from 'express';
import {
  getWithdrawalConfig,
  updateBankDetails,
  requestWithdrawal,
  getWithdrawalHistory,
  getWithdrawalDetails,
  cancelWithdrawal,
  getAllWithdrawals,
  adminProcessWithdrawal,
  adminCompleteWithdrawal,
  adminRejectWithdrawal,
  payoutWebhook,
} from '../controllers/withdrawalController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// User routes
router.get('/config', authMiddleware, getWithdrawalConfig);
router.put('/bank-details', authMiddleware, updateBankDetails);
router.post('/request', authMiddleware, requestWithdrawal);
router.get('/history', authMiddleware, getWithdrawalHistory);
router.get('/:withdrawalId', authMiddleware, getWithdrawalDetails);
router.post('/:withdrawalId/cancel', authMiddleware, cancelWithdrawal);

// Admin routes
router.get('/admin/all', authMiddleware, adminMiddleware, getAllWithdrawals);
router.post('/admin/:withdrawalId/process', authMiddleware, adminMiddleware, adminProcessWithdrawal);
router.post('/admin/:withdrawalId/complete', authMiddleware, adminMiddleware, adminCompleteWithdrawal);
router.post('/admin/:withdrawalId/reject', authMiddleware, adminMiddleware, adminRejectWithdrawal);

// Webhook (no auth - verified by payload)
router.post('/webhook/payout', payoutWebhook);

export default router;
