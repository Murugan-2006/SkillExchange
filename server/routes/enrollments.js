import express from 'express';
import {
  enrollCourse,
  getEnrollments,
  getEnrollmentById,
  updateProgress,
} from '../controllers/enrollmentController.js';
import { authMiddleware, studentMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, studentMiddleware, enrollCourse);
router.get('/', authMiddleware, studentMiddleware, getEnrollments);
router.get('/:id', authMiddleware, studentMiddleware, getEnrollmentById);
router.put('/:id/progress', authMiddleware, studentMiddleware, updateProgress);

export default router;
