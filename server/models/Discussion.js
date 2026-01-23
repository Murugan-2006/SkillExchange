import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  replies: [{
    replyId: mongoose.Schema.Types.ObjectId,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    upvotes: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  upvotes: {
    type: Number,
    default: 0,
  },
  views: {
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
  isSolved: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.model('Discussion', discussionSchema);
