import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  questions: [{
    questionId: mongoose.Schema.Types.ObjectId,
    type: String,
    enum: ['mcq', 'short_answer'],
    question: String,
    options: [String],
    correctAnswer: String,
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    generatedAt: { type: Date, default: Date.now },
  }],
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  attempts: [{
    attemptId: mongoose.Schema.Types.ObjectId,
    student: mongoose.Schema.Types.ObjectId,
    answers: [String],
    score: Number,
    completedAt: Date,
  }],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
