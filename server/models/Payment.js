import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
  paymentMethod: {
    type: String,
    enum: ['credits', 'stripe', 'razorpay', 'phonepe', 'free', 'demo'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  stripePaymentIntentId: String,
  razorpayOrderId: String,
  phonepeTransactionId: String,
  phonepeMerchantTransactionId: String,
  transactionId: String,
  creditSpent: {
    type: Number,
    default: 0,
  },
  paidAt: Date,
  failureReason: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
