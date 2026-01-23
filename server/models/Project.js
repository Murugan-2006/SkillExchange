import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
  },
  description: String,
  gitHubLink: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  feedback: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
