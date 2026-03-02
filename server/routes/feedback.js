import express from 'express';
import {
  submitFeedback,
  checkFeedback,
  getCourseFeedback,
} from '../controllers/feedbackController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Submit feedback for a course (authenticated users only)
router.post('/:courseId', authMiddleware, submitFeedback);

// Check if user has submitted feedback
router.get('/check/:courseId', authMiddleware, checkFeedback);

// Get all feedback for a course
router.get('/course/:courseId', authMiddleware, getCourseFeedback);

export default router;
