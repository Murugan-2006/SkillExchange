import mongoose from 'mongoose';

const creditsSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 50,
  },
  transactions: [{
    transactionId: mongoose.Schema.Types.ObjectId,
    type: String,
    enum: ['earned', 'spent'],
    amount: Number,
    reason: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
  }],
  frozenBalance: {
    type: Number,
    default: 0,
  },
  freezeReason: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Credits', creditsSchema);
