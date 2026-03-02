import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  fileType: String,
  uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Note', noteSchema);
