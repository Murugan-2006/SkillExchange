import express from 'express';
import {
  generateQuiz,
  getQuiz,
  submitQuiz,
  approveQuiz,
} from '../controllers/quizController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/:videoId/generate', authMiddleware, adminMiddleware, generateQuiz);
router.get('/:videoId', getQuiz);
router.post('/:quizId/submit', authMiddleware, submitQuiz);
router.put('/:quizId/approve', authMiddleware, adminMiddleware, approveQuiz);

export default router;
