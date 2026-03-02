import express from 'express';
import {
  enrollCourse,
  getEnrollments,
  getEnrollmentById,
  updateProgress,
  updateProgressByCourse,
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, enrollCourse);
router.get('/', authMiddleware, getEnrollments);
router.get('/:id', authMiddleware, getEnrollmentById);
router.put('/:id/progress', authMiddleware, updateProgress);
router.put('/course/:courseId/progress', authMiddleware, updateProgressByCourse);

export default router;
