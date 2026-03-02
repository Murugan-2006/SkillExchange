import Withdrawal from '../models/Withdrawal.js';
import Credits from '../models/Credits.js';
import User from '../models/User.js';
import axios from 'axios';
import phonepeConfig from '../config/phonepe.js';

// Configuration for credit to money conversion
const CONVERSION_CONFIG = {
  rate: 10, // 1 credit = 10 INR
  minWithdrawal: 50, // Minimum 50 credits to withdraw
  maxWithdrawal: 10000, // Maximum 10000 credits per withdrawal
  processingFee: 0, // No processing fee (can be adjusted)
  currency: 'INR',
};

// Get PhonePe OAuth Access Token for Payout
const getPhonePeAccessToken = async () => {
  try {
    const params = new URLSearchParams();
    params.append('client_id', phonepeConfig.clientId);
    params.append('client_secret', phonepeConfig.clientSecret);
    params.append('client_version', phonepeConfig.clientVersion);
    params.append('grant_type', 'client_credentials');
    
    const response = await axios.post(phonepeConfig.authUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('PhonePe Token Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with payment gateway');
  }
};

// Get withdrawal configuration
export const getWithdrawalConfig = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's current credit balance
    const credits = await Credits.findOne({ student: userId });
    const currentBalance = credits?.balance || 0;
    
    // Get user's bank details
    const user = await User.findById(userId).select('bankDetails upiId');
    
    // Check pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({
      user: userId,
      status: { $in: ['pending', 'processing'] }
    });
    
    res.json({
      success: true,
      config: {
        conversionRate: CONVERSION_CONFIG.rate,
        minCredits: CONVERSION_CONFIG.minWithdrawal,
        maxCredits: CONVERSION_CONFIG.maxWithdrawal,
        processingFee: CONVERSION_CONFIG.processingFee,
        currency: CONVERSION_CONFIG.currency,
      },
      userStatus: {
        currentBalance,
        canWithdraw: currentBalance >= CONVERSION_CONFIG.minWithdrawal && pendingWithdrawals === 0,
        hasPendingWithdrawal: pendingWithdrawals > 0,
        hasBankDetails: !!(user?.bankDetails?.accountNumber),
        hasUpiDetails: !!(user?.upiId),
      },
      bankDetails: user?.bankDetails || null,
      upiId: user?.upiId || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Update bank details
export const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountHolderName, accountNumber, ifscCode, bankName, accountType, upiId } = req.body;
    
    // Validate required fields for bank transfer
    if (!upiId && (!accountHolderName || !accountNumber || !ifscCode || !bankName)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either bank details or UPI ID',
        error: 'VALIDATION_ERROR',
      });
    }
    
    // Validate IFSC code format (Indian bank code)
    if (ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IFSC code format',
        error: 'VALIDATION_ERROR',
      });
    }
    
    // Validate UPI ID format
    if (upiId && !/@/.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format',
        error: 'VALIDATION_ERROR',
      });
    }
    
    const updateData = {};
    
    if (accountNumber) {
      updateData.bankDetails = {
        accountHolderName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        bankName,
        accountType: accountType || 'savings',
        isVerified: false, // Bank details need verification
      };
    }
    
    if (upiId) {
      updateData.upiId = upiId;
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('bankDetails upiId');
    
    res.json({
      success: true,
      message: 'Payment details updated successfully',
      bankDetails: user.bankDetails,
      upiId: user.upiId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Request withdrawal - User initiates withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { creditsAmount, payoutMethod, userNotes } = req.body;
    
    // Validate credits amount
    if (!creditsAmount || creditsAmount < CONVERSION_CONFIG.minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${CONVERSION_CONFIG.minWithdrawal} credits`,
        error: 'VALIDATION_ERROR',
      });
    }
    
    if (creditsAmount > CONVERSION_CONFIG.maxWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal is ${CONVERSION_CONFIG.maxWithdrawal} credits`,
        error: 'VALIDATION_ERROR',
      });
    }
    
    // Get user's credit balance
    const credits = await Credits.findOne({ student: userId });
    if (!credits || credits.balance < creditsAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credit balance',
        error: 'INSUFFICIENT_CREDITS',
        available: credits?.balance || 0,
        requested: creditsAmount,
      });
    }
    
    // Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      user: userId,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request',
        error: 'PENDING_WITHDRAWAL_EXISTS',
      });
    }
    
    // Get user's payment details
    const user = await User.findById(userId).select('bankDetails upiId name email');
    
    // Validate payment method and details
    const method = payoutMethod || 'bank_transfer';
    
    if (method === 'bank_transfer' && !user?.bankDetails?.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please add your bank details before requesting withdrawal',
        error: 'MISSING_BANK_DETAILS',
      });
    }
    
    if (method === 'upi' && !user?.upiId) {
      return res.status(400).json({
        success: false,
        message: 'Please add your UPI ID before requesting withdrawal',
        error: 'MISSING_UPI_DETAILS',
      });
    }
    
    // Calculate money amount
    const moneyAmount = creditsAmount * CONVERSION_CONFIG.rate;
    
    // Create withdrawal request
    const withdrawal = new Withdrawal({
      user: userId,
      creditsAmount,
      moneyAmount,
      currency: CONVERSION_CONFIG.currency,
      conversionRate: CONVERSION_CONFIG.rate,
      payoutMethod: method,
      bankDetails: method === 'bank_transfer' ? user.bankDetails : undefined,
      upiDetails: method === 'upi' ? { upiId: user.upiId } : undefined,
      status: 'pending',
      userNotes,
      requestIp: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    await withdrawal.save();
    
    // Deduct credits from user's balance immediately (hold)
    credits.balance -= creditsAmount;
    credits.transactions.push({
      type: 'spent',
      amount: creditsAmount,
      reason: `Withdrawal request #${withdrawal._id}`,
      relatedId: withdrawal._id,
    });
    await credits.save();
    
    // Auto-process the withdrawal (trigger payout)
    // This runs asynchronously - don't await
    processWithdrawalPayout(withdrawal._id).catch(err => {
      console.error('Auto-payout processing error:', err);
    });
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawal: {
        id: withdrawal._id,
        creditsAmount,
        moneyAmount,
        currency: CONVERSION_CONFIG.currency,
        status: 'pending',
        payoutMethod: method,
      },
      newBalance: credits.balance,
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Process withdrawal payout automatically
export const processWithdrawalPayout = async (withdrawalId) => {
  const withdrawal = await Withdrawal.findById(withdrawalId).populate('user', 'name email');
  
  if (!withdrawal || withdrawal.status !== 'pending') {
    throw new Error('Invalid withdrawal or already processed');
  }
  
  try {
    // Update status to processing
    withdrawal.status = 'processing';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    
    // Generate unique payout transaction ID
    const payoutTransactionId = `PAYOUT_${withdrawal._id}_${Date.now()}`;
    
    // Get OAuth access token
    const accessToken = await getPhonePeAccessToken();
    
    // Prepare payout request based on method
    let payoutPayload;
    
    if (withdrawal.payoutMethod === 'bank_transfer') {
      payoutPayload = {
        merchantPayoutId: payoutTransactionId,
        amount: Math.round(withdrawal.moneyAmount * 100), // Convert to paise
        payoutMode: 'BANK_TRANSFER',
        payoutDetails: {
          bankAccount: {
            accountNumber: withdrawal.bankDetails.accountNumber,
            ifsc: withdrawal.bankDetails.ifscCode,
            accountHolderName: withdrawal.bankDetails.accountHolderName,
          }
        },
        merchantUserId: withdrawal.user._id.toString(),
        message: `Credit withdrawal - ${withdrawal.creditsAmount} credits`,
      };
    } else if (withdrawal.payoutMethod === 'upi') {
      payoutPayload = {
        merchantPayoutId: payoutTransactionId,
        amount: Math.round(withdrawal.moneyAmount * 100),
        payoutMode: 'UPI',
        payoutDetails: {
          vpa: withdrawal.upiDetails.upiId,
        },
        merchantUserId: withdrawal.user._id.toString(),
        message: `Credit withdrawal - ${withdrawal.creditsAmount} credits`,
      };
    }
    
    console.log('Initiating payout:', payoutTransactionId);
    
    // PhonePe Payout API call
    // Note: In production, use actual PhonePe Payout API endpoint
    const PAYOUT_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/payout';
    
    try {
      const response = await axios.post(
        PAYOUT_URL,
        payoutPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          timeout: 30000,
        }
      );
      
      // Update withdrawal with gateway response
      withdrawal.payoutTransactionId = payoutTransactionId;
      withdrawal.gatewayResponse = response.data;
      
      if (response.data.success || response.data.code === 'SUCCESS') {
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        console.log('Payout successful:', payoutTransactionId);
      } else {
        // Payout initiated but pending confirmation
        withdrawal.status = 'processing';
      }
      
      await withdrawal.save();
      
    } catch (apiError) {
      // For sandbox/demo: Simulate successful payout
      if (process.env.NODE_ENV !== 'production') {
        console.log('Sandbox mode: Simulating successful payout');
        withdrawal.payoutTransactionId = payoutTransactionId;
        withdrawal.gatewayResponse = {
          simulated: true,
          code: 'SUCCESS',
          message: 'Payout simulated in sandbox mode',
        };
        withdrawal.status = 'completed';
        withdrawal.completedAt = new Date();
        await withdrawal.save();
        return withdrawal;
      }
      
      throw apiError;
    }
    
    return withdrawal;
    
  } catch (error) {
    console.error('Payout processing error:', error);
    
    // Mark withdrawal as failed and refund credits
    withdrawal.status = 'failed';
    withdrawal.failedAt = new Date();
    withdrawal.failureReason = error.message;
    withdrawal.gatewayResponse = error.response?.data;
    await withdrawal.save();
    
    // Refund credits to user
    const credits = await Credits.findOne({ student: withdrawal.user._id || withdrawal.user });
    if (credits) {
      credits.balance += withdrawal.creditsAmount;
      credits.transactions.push({
        type: 'earned',
        amount: withdrawal.creditsAmount,
        reason: `Refund: Withdrawal #${withdrawal._id} failed`,
        relatedId: withdrawal._id,
      });
      await credits.save();
    }
    
    throw error;
  }
};

// Get withdrawal history for user
export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const withdrawals = await Withdrawal.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('-bankDetails.accountNumber -gatewayResponse');
    
    // Mask account numbers for security
    const maskedWithdrawals = withdrawals.map(w => {
      const withdrawal = w.toObject();
      if (withdrawal.bankDetails?.accountNumber) {
        const accNum = withdrawal.bankDetails.accountNumber;
        withdrawal.bankDetails.accountNumber = `XXXX${accNum.slice(-4)}`;
      }
      return withdrawal;
    });
    
    res.json({
      success: true,
      withdrawals: maskedWithdrawals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Get single withdrawal details
export const getWithdrawalDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: userId,
    });
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        error: 'NOT_FOUND',
      });
    }
    
    res.json({
      success: true,
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Cancel pending withdrawal
export const cancelWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      user: userId,
      status: 'pending',
    });
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Pending withdrawal not found or cannot be cancelled',
        error: 'NOT_FOUND',
      });
    }
    
    // Cancel withdrawal
    withdrawal.status = 'cancelled';
    await withdrawal.save();
    
    // Refund credits
    const credits = await Credits.findOne({ student: userId });
    credits.balance += withdrawal.creditsAmount;
    credits.transactions.push({
      type: 'earned',
      amount: withdrawal.creditsAmount,
      reason: `Cancelled withdrawal #${withdrawal._id}`,
      relatedId: withdrawal._id,
    });
    await credits.save();
    
    res.json({
      success: true,
      message: 'Withdrawal cancelled and credits refunded',
      newBalance: credits.balance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Admin: Get all withdrawals
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    
    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name email')
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Withdrawal.countDocuments(query);
    
    // Summary stats
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditsAmount' },
          totalMoney: { $sum: '$moneyAmount' },
        }
      }
    ]);
    
    res.json({
      success: true,
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, s) => {
        acc[s._id] = { count: s.count, totalCredits: s.totalCredits, totalMoney: s.totalMoney };
        return acc;
      }, {}),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Admin: Manually process a failed/pending withdrawal
export const adminProcessWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const adminId = req.user.userId;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        error: 'NOT_FOUND',
      });
    }
    
    if (!['pending', 'failed'].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only process pending or failed withdrawals',
        error: 'INVALID_STATUS',
      });
    }
    
    withdrawal.processedBy = adminId;
    await withdrawal.save();
    
    // Trigger payout
    const result = await processWithdrawalPayout(withdrawalId);
    
    res.json({
      success: true,
      message: 'Withdrawal processed',
      withdrawal: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Admin: Mark withdrawal as completed (manual payout)
export const adminCompleteWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { transactionId, adminNotes } = req.body;
    const adminId = req.user.userId;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        error: 'NOT_FOUND',
      });
    }
    
    if (withdrawal.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal already completed',
        error: 'ALREADY_COMPLETED',
      });
    }
    
    withdrawal.status = 'completed';
    withdrawal.completedAt = new Date();
    withdrawal.processedBy = adminId;
    withdrawal.payoutTransactionId = transactionId || `MANUAL_${Date.now()}`;
    withdrawal.adminNotes = adminNotes;
    withdrawal.gatewayResponse = { manual: true, note: 'Completed manually by admin' };
    
    await withdrawal.save();
    
    res.json({
      success: true,
      message: 'Withdrawal marked as completed',
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Admin: Reject withdrawal and refund
export const adminRejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found',
        error: 'NOT_FOUND',
      });
    }
    
    if (['completed', 'cancelled'].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject completed or cancelled withdrawal',
        error: 'INVALID_STATUS',
      });
    }
    
    // Reject and refund
    withdrawal.status = 'failed';
    withdrawal.failedAt = new Date();
    withdrawal.failureReason = reason || 'Rejected by admin';
    withdrawal.processedBy = adminId;
    await withdrawal.save();
    
    // Refund credits
    const credits = await Credits.findOne({ student: withdrawal.user });
    if (credits) {
      credits.balance += withdrawal.creditsAmount;
      credits.transactions.push({
        type: 'earned',
        amount: withdrawal.creditsAmount,
        reason: `Refund: Withdrawal #${withdrawal._id} rejected`,
        relatedId: withdrawal._id,
      });
      await credits.save();
    }
    
    res.json({
      success: true,
      message: 'Withdrawal rejected and credits refunded',
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Webhook handler for payout status updates
export const payoutWebhook = async (req, res) => {
  try {
    const { merchantPayoutId, status, transactionId, errorCode, errorMessage } = req.body;
    
    console.log('Payout webhook received:', req.body);
    
    // Find the withdrawal by payout transaction ID
    const withdrawal = await Withdrawal.findOne({
      payoutTransactionId: merchantPayoutId,
    });
    
    if (!withdrawal) {
      console.log('Withdrawal not found for webhook:', merchantPayoutId);
      return res.status(200).json({ success: true, message: 'Acknowledged' });
    }
    
    // Update based on status
    if (status === 'SUCCESS' || status === 'COMPLETED') {
      withdrawal.status = 'completed';
      withdrawal.completedAt = new Date();
      withdrawal.gatewayResponse = req.body;
    } else if (status === 'FAILED' || status === 'REJECTED') {
      withdrawal.status = 'failed';
      withdrawal.failedAt = new Date();
      withdrawal.failureReason = errorMessage || errorCode || 'Payout failed';
      withdrawal.gatewayResponse = req.body;
      
      // Refund credits
      const credits = await Credits.findOne({ student: withdrawal.user });
      if (credits) {
        credits.balance += withdrawal.creditsAmount;
        credits.transactions.push({
          type: 'earned',
          amount: withdrawal.creditsAmount,
          reason: `Refund: Payout failed - ${withdrawal._id}`,
          relatedId: withdrawal._id,
        });
        await credits.save();
      }
    }
    
    await withdrawal.save();
    
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Payout webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
