import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skillsCovered: [String],
  creditsRequired: {
    type: Number,
    default: 0,
  },
  creditsEarned: {
    type: Number,
    default: 10,
  },
  price: {
    type: Number,
    default: 0, // in USD
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    default: 'General',
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
  }],
  thumbnail: {
    type: String,
    default: null,
  },
  duration: {
    type: Number,
    default: 0,
  },
  enrollmentCount: {
    type: Number,
    default: 0,
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  price: {
    type: Number,
    default: 1000, // Default price in INR
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
  bonusCreditsPaid: {
    type: Boolean,
    default: false,
  },
  bonusCreditsAmount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,  // Courses visible immediately when created
  },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
