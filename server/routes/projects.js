import express from 'express';
import {
  submitProject,
  getStudentProjects,
  getCourseProjects,
  reviewProject,
  reviewProjectFromEmail,
  getProjectById,
} from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Email-based review (no auth needed, uses token in query)
router.get('/:projectId/review', reviewProjectFromEmail);

router.post('/:courseId', authMiddleware, submitProject);
router.get('/', authMiddleware, getStudentProjects);
router.get('/:courseId/projects', authMiddleware, getCourseProjects);
router.get('/:projectId', authMiddleware, getProjectById);
router.put('/:projectId/review', authMiddleware, reviewProject);

export default router;
