import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  url: {
    type: String,
    required: true,
  },
  duration: Number,
  transcript: String,
  videoOrder: Number,
  thumbnail: String,
  views: {
    type: Number,
    default: 0,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Video', videoSchema);
