import Credits from '../models/Credits.js';

export const getCredits = async (req, res) => {
  try {
    const credits = await Credits.findOne({ student: req.user.userId });

    if (!credits) {
      // Create if doesn't exist
      const newCredits = new Credits({ student: req.user.userId, balance: 50 });
      await newCredits.save();
      return res.json({
        success: true,
        credits: newCredits,
      });
    }

    res.json({
      success: true,
      credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const credits = await Credits.findOne({ student: req.user.userId });

    if (!credits) {
      return res.json({
        success: true,
        transactions: [],
      });
    }

    res.json({
      success: true,
      transactions: credits.transactions.sort((a, b) => b.createdAt - a.createdAt),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const addCredits = async (req, res) => {
  try {
    const { studentId, amount, reason } = req.body;

    if (!studentId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, amount, and reason are required',
        error: 'VALIDATION_ERROR',
      });
    }

    let credits = await Credits.findOne({ student: studentId });

    if (!credits) {
      credits = new Credits({ student: studentId });
    }

    credits.balance += amount;
    credits.transactions.push({
      type: 'earned',
      amount,
      reason,
    });

    await credits.save();

    res.json({
      success: true,
      message: 'Credits added',
      credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const freezeCredits = async (req, res) => {
  try {
    const { studentId, reason } = req.body;

    const credits = await Credits.findOne({ student: studentId });

    if (!credits) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND',
      });
    }

    credits.frozenBalance = credits.balance;
    credits.balance = 0;
    credits.freezeReason = reason;

    await credits.save();

    res.json({
      success: true,
      message: 'Credits frozen',
      credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const unfreezeCredits = async (req, res) => {
  try {
    const { studentId } = req.body;

    const credits = await Credits.findOne({ student: studentId });

    if (!credits) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'NOT_FOUND',
      });
    }

    credits.balance = credits.frozenBalance;
    credits.frozenBalance = 0;
    credits.freezeReason = null;

    await credits.save();

    res.json({
      success: true,
      message: 'Credits unfrozen',
      credits,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
