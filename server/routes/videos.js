import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadVideo,
  getVideosByCourse,
  getVideoById,
  updateVideo,
  deleteVideo,
} from '../controllers/videoController.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration: use memory storage for direct Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

router.post('/:courseId', authMiddleware, upload.single('file'), uploadVideo);
router.get('/course/:courseId', getVideosByCourse);
router.get('/:videoId', getVideoById);
router.put('/:videoId', authMiddleware, updateVideo);
router.delete('/:videoId', authMiddleware, deleteVideo);

export default router;
