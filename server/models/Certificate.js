import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  verificationLink: {
    type: String,
    unique: true,
    required: true,
  },
  imageUrl: String,
  skills: [String],
  expiresAt: Date,
  isVerified: {
    type: Boolean,
    default: true,
  },
  verificationCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
