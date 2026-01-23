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
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
