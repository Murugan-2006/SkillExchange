import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import videoRoutes from './routes/videos.js';
import discussionRoutes from './routes/discussions.js';
import quizRoutes from './routes/quizzes.js';
import projectRoutes from './routes/projects.js';
import certificateRoutes from './routes/certificates.js';
import creditsRoutes from './routes/credits.js';
import notesRoutes from './routes/notes.js';
import paymentRoutes from './routes/payments.js';
import feedbackRoutes from './routes/feedback.js';
import bonusCreditsRoutes from './routes/bonusCredits.js';
import withdrawalRoutes from './routes/withdrawals.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer configuration for file uploads
         // this will execute only when will the route is 'upload/'
            const upload = multer({
              dest: 'uploads/',
              limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
              fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('video/')) {
                  cb(null, true);
                } else {
                  cb(new Error('Only video files are allowed'));
                }
              },
            });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CORS_ORIGIN
].filter(Boolean);


app.use(cors({
  origin: '*',
}));

// Serve uploads directory as static files
app.use('/uploads', express.static('uploads'));

// Connect Database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bonus-credits', bonusCreditsRoutes);
app.use('/api/withdrawals', withdrawalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
  });
});

app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
