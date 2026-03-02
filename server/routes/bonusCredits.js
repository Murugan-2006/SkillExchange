import express from 'express';
import {
  processCourseBonus,
  processAllEndedCourses,
  getCourseBonus,
  getInstructorBonusHistory,
} from '../controllers/bonusCreditsController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get bonus credit status for a specific course
router.get('/course/:courseId', authMiddleware, getCourseBonus);

// Get instructor's bonus credit history
router.get('/my-history', authMiddleware, getInstructorBonusHistory);

// Process bonus credits for a single course (admin only)
router.post('/process/:courseId', authMiddleware, adminMiddleware, processCourseBonus);

// Process all ended courses and award bonus credits (admin only - can be used as cron job)
router.post('/process-all', authMiddleware, adminMiddleware, processAllEndedCourses);

export default router;
