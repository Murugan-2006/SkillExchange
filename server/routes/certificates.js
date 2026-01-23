import express from 'express';
import {
  getCertificates,
  getCertificateById,
  verifyCertificate,
  downloadCertificate,
} from '../controllers/certificateController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getCertificates);
router.get('/:certificateId', getCertificateById);
router.get('/verify/:certificateNumber', verifyCertificate);
router.post('/:certificateId/download', authMiddleware, downloadCertificate);

export default router;
