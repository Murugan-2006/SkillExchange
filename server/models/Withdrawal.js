import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Credits being withdrawn
  creditsAmount: {
    type: Number,
    required: true,
    min: 1,
  },
  // Monetary amount to be paid (credits * conversion rate)
  moneyAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  // Conversion rate used (e.g., 1 credit = 10 INR)
  conversionRate: {
    type: Number,
    required: true,
    default: 10,
  },
  // Bank account details for payout
  bankDetails: {
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
      enum: ['savings', 'current'],
      default: 'savings',
    },
  },
  // UPI details (alternative)
  upiDetails: {
    upiId: String,
  },
  // Payout method
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi'],
    default: 'bank_transfer',
  },
  // Status of the withdrawal
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  // Payment gateway transaction details
  payoutTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  
  // Processing timestamps
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  
  // Failure reason if any
  failureReason: String,
  
  // Admin who processed (for audit)
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // User's IP and device info for security
  requestIp: String,
  userAgent: String,
  
  // Notes
  adminNotes: String,
  userNotes: String,
}, { timestamps: true });

// Indexes for faster queries
withdrawalSchema.index({ user: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ payoutTransactionId: 1 });

export default mongoose.model('Withdrawal', withdrawalSchema);
