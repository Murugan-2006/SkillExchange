import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', authMiddleware, adminMiddleware, createCourse);
router.put('/:id', authMiddleware, adminMiddleware, updateCourse);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCourse);

export default router;
