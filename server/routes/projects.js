import express from 'express';
import {
  submitProject,
  getStudentProjects,
  getCourseProjects,
  reviewProject,
  getProjectById,
} from '../controllers/projectController.js';
import { authMiddleware, adminMiddleware, studentMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/:courseId', authMiddleware, studentMiddleware, submitProject);
router.get('/', authMiddleware, studentMiddleware, getStudentProjects);
router.get('/:courseId/projects', authMiddleware, adminMiddleware, getCourseProjects);
router.get('/:projectId', authMiddleware, getProjectById);
router.put('/:projectId/review', authMiddleware, adminMiddleware, reviewProject);

export default router;
