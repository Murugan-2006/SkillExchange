import express from 'express';
import multer from 'multer';
import { uploadNote, getNotesByCourse, deleteNote } from '../controllers/notesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/:courseId', authMiddleware, upload.single('file'), uploadNote);
router.get('/course/:courseId', getNotesByCourse);
router.delete('/:noteId', authMiddleware, deleteNote);

export default router;
