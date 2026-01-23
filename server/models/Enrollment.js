import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  progress: {
    videosWatched: { type: Number, default: 0 },
    totalVideos: { type: Number, default: 0 },
    watchPercentage: { type: Number, default: 0 },
    lastWatchedAt: Date,
    lastWatchedVideoId: mongoose.Schema.Types.ObjectId,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active',
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    default: null,
  },
  projectSubmitted: {
    type: Boolean,
    default: false,
  },
  projectStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  quizzesAttempted: { type: Number, default: 0 },
  averageQuizScore: { type: Number, default: 0 },
  creditsSpent: { type: Number, default: 0 },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Ensure unique enrollment per student per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
