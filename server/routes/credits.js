import express from 'express';
import {
  getCredits,
  getTransactionHistory,
  addCredits,
  freezeCredits,
  unfreezeCredits,
} from '../controllers/creditsController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCredits);
router.get('/history', authMiddleware, getTransactionHistory);
router.post('/', authMiddleware, adminMiddleware, addCredits);
router.put('/freeze', authMiddleware, adminMiddleware, freezeCredits);
router.put('/unfreeze', authMiddleware, adminMiddleware, unfreezeCredits);

export default router;
