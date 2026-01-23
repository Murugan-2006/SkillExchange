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
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer configuration with proper file naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

router.post('/:courseId', authMiddleware, adminMiddleware, upload.single('file'), uploadVideo);
router.get('/course/:courseId', getVideosByCourse);
router.get('/:videoId', getVideoById);
router.put('/:videoId', authMiddleware, adminMiddleware, updateVideo);
router.delete('/:videoId', authMiddleware, adminMiddleware, deleteVideo);

export default router;
