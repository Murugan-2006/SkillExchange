import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Credits from '../models/Credits.js';
import crypto from 'crypto';
import axios from 'axios';
import phonepeConfig from '../config/phonepe.js';

// Initiate payment with credits
export const payCourseWithCredits = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if course start date has passed
    if (course.startDate && new Date(course.startDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment closed. Course has already started.',
        error: 'ENROLLMENT_CLOSED',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
        error: 'DUPLICATE_ENTRY',
      });
    }

    // Get student credits
    let credits = await Credits.findOne({ student: studentId });
    if (!credits) {
      credits = new Credits({ student: studentId, balance: 50 });
      await credits.save();
    }

    // Check if course requires credits
    const creditsNeeded = course.creditsRequired || 0;
    if (creditsNeeded > 0 && credits.balance < creditsNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. You need ${creditsNeeded} credits but only have ${credits.balance}`,
        error: 'INSUFFICIENT_CREDITS',
        required: creditsNeeded,
        available: credits.balance,
      });
    }

    // Deduct credits and save
    const previousBalance = credits.balance;
    credits.balance = credits.balance - creditsNeeded;
    credits.transactions.push({
      type: 'spent',
      amount: creditsNeeded,
      reason: `Enrolled in course: ${course.title}`,
      relatedId: courseId,
    });
    
    // Save credits with explicit save
    const savedCredits = await credits.save();
    console.log(`Credits deducted: ${previousBalance} -> ${savedCredits.balance} (spent: ${creditsNeeded})`);

    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      status: 'active',
      progress: {
        totalVideos: course.videos?.length || 0,
      },
    });
    await enrollment.save();

    // Create payment record
    const payment = new Payment({
      student: studentId,
      course: courseId,
      paymentMethod: 'credits',
      amount: creditsNeeded,
      creditSpent: creditsNeeded,
      status: 'completed',
      paidAt: new Date(),
      transactionId: `CREDIT-${Date.now()}`,
    });
    await payment.save();

    // Increment course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    res.json({
      success: true,
      message: 'Course enrolled successfully using credits',
      enrollment,
      payment,
      creditsSpent: creditsNeeded,
      newBalance: savedCredits.balance,
    });
  } catch (error) {
    console.error('Credit payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const payments = await Payment.find({ student: studentId })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('student', 'name email')
      .populate('course', 'title price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Admin: Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('student', 'name email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 });

    const summary = {
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      totalRevenue: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: payments.filter(p => p.status === 'pending').length,
    };

    res.json({
      success: true,
      payments,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Free Enrollment - For courses with no price
export const freeEnroll = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if course start date has passed
    if (course.startDate && new Date(course.startDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment closed. Course has already started.',
        error: 'ENROLLMENT_CLOSED',
      });
    }

    // Verify course is actually free
    if ((course.price && course.price > 0) || (course.creditsRequired && course.creditsRequired > 0)) {
      return res.status(400).json({
        success: false,
        message: 'This course is not free. Please use payment method.',
        error: 'VALIDATION_ERROR',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
        error: 'DUPLICATE_ENTRY',
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      status: 'active',
      progress: {
        totalVideos: course.videos?.length || 0,
      },
    });
    await enrollment.save();

    // Create free enrollment record
    const payment = new Payment({
      student: studentId,
      course: courseId,
      paymentMethod: 'free',
      amount: 0,
      status: 'completed',
      paidAt: new Date(),
      transactionId: `FREE-${Date.now()}`,
    });
    await payment.save();

    // Increment course enrollment count
    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    res.json({
      success: true,
      message: 'Successfully enrolled in free course!',
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Get PhonePe OAuth Access Token
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
    
    console.log('PhonePe Access Token obtained successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('PhonePe Token Error:', error.response?.status, error.response?.data);
    throw error;
  }
};

// Initiate PhonePe Payment (Standard Checkout API v2)
export const initiatePhonePePayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user.userId;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
        error: 'DUPLICATE_ENTRY',
      });
    }

    // Get course price (default to 1000 INR if not set)
    const amount = course.price || 1000;

    // Generate unique merchant transaction ID
    const merchantTransactionId = `TXN_${courseId}_${Date.now()}`;

    // Create pending payment record
    const payment = new Payment({
      student: studentId,
      course: courseId,
      paymentMethod: 'phonepe',
      amount: amount,
      currency: 'INR',
      status: 'pending',
      phonepeMerchantTransactionId: merchantTransactionId,
      metadata: {
        courseTitle: course.title,
        initiatedAt: new Date(),
      },
    });
    await payment.save();

    // Get OAuth access token
    const accessToken = await getPhonePeAccessToken();

    // PhonePe Standard Checkout API v2 payload
    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: Math.round(amount * 100), // Convert to paise
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: studentId.toString(),
        udf2: courseId.toString(),
        udf3: payment._id.toString(),
      },
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: `Payment for course: ${course.title}`,
        merchantUrls: {
          redirectUrl: `${phonepeConfig.redirectUrl}/${merchantTransactionId}`
        }
      }
    };

    console.log('PhonePe Payment Payload:', JSON.stringify(payload, null, 2));

    // Make API request to PhonePe
    const response = await axios.post(
      phonepeConfig.payUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`
        }
      }
    );

    console.log('PhonePe Response:', response.data);

    if (response.data.orderId) {
      // Update payment with PhonePe order ID
      payment.phonepeTransactionId = response.data.orderId;
      await payment.save();

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        paymentId: payment._id,
        redirectUrl: response.data.redirectUrl,
        merchantTransactionId: merchantTransactionId,
        orderId: response.data.orderId,
      });
    } else {
      payment.status = 'failed';
      payment.failureReason = response.data.message || 'Payment initiation failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: response.data.message || 'Payment initiation failed',
        error: 'PAYMENT_FAILED',
      });
    }
  } catch (error) {
    console.error('PhonePe Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate PhonePe payment. Please try again.',
      error: 'PHONEPE_API_ERROR',
      details: error.response?.data || error.message,
    });
  }
};

// PhonePe Payment Status Check (redirect handler)
export const phonePeStatusRedirect = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find payment by merchant transaction ID
    const payment = await Payment.findOne({
      phonepeMerchantTransactionId: transactionId,
    });

    if (!payment) {
      console.error('Payment not found for transactionId:', transactionId);
      return res.redirect(`${phonepeConfig.frontendUrl}/payment/status?status=error&message=Payment not found`);
    }

    // Get access token and check status with PhonePe
    const accessToken = await getPhonePeAccessToken();

    const response = await axios.get(
      `${phonepeConfig.statusUrl}/${transactionId}/status`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${accessToken}`
        }
      }
    );

    console.log('PhonePe Status Response:', response.data);

    const state = response.data.state;
    
    if (state === 'COMPLETED') {
      // Update payment as completed
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.transactionId = `PHONEPE-${response.data.orderId || Date.now()}`;
      await payment.save();

      // Create enrollment
      const course = await Course.findById(payment.course);
      
      const existingEnrollment = await Enrollment.findOne({
        student: payment.student,
        course: payment.course,
      });

      if (!existingEnrollment) {
        const enrollment = new Enrollment({
          student: payment.student,
          course: payment.course,
          status: 'active',
          progress: {
            totalVideos: course?.videos?.length || 0,
          },
        });
        await enrollment.save();

        // Increment enrollment count
        if (course) {
          course.enrollmentCount = (course.enrollmentCount || 0) + 1;
          await course.save();
        }
      }

      return res.redirect(`${phonepeConfig.frontendUrl}/payment/status?paymentId=${payment._id}&status=success`);
    } else if (state === 'PENDING') {
      return res.redirect(`${phonepeConfig.frontendUrl}/payment/status?paymentId=${payment._id}&status=pending`);
    } else {
      payment.status = 'failed';
      payment.failureReason = response.data.message || 'Payment failed';
      await payment.save();

      return res.redirect(`${phonepeConfig.frontendUrl}/payment/status?paymentId=${payment._id}&status=failed`);
    }
  } catch (error) {
    console.error('PhonePe Status Error:', error.response?.data || error.message);
    return res.redirect(`${phonepeConfig.frontendUrl}/payment/status?status=error`);
  }
};

// PhonePe Payment Callback (webhook)
export const phonePeCallback = async (req, res) => {
  try {
    console.log('PhonePe Callback received:', req.body);
    
    // Handle webhook notification from PhonePe
    const { merchantOrderId, state, orderId } = req.body;

    if (merchantOrderId) {
      const payment = await Payment.findOne({
        phonepeMerchantTransactionId: merchantOrderId,
      });

      if (payment && payment.status === 'pending') {
        if (state === 'COMPLETED') {
          payment.status = 'completed';
          payment.phonepeTransactionId = orderId;
          payment.paidAt = new Date();
          payment.transactionId = `PHONEPE-${orderId || Date.now()}`;
          await payment.save();

          // Create enrollment
          const course = await Course.findById(payment.course);
          
          const existingEnrollment = await Enrollment.findOne({
            student: payment.student,
            course: payment.course,
          });

          if (!existingEnrollment) {
            const enrollment = new Enrollment({
              student: payment.student,
              course: payment.course,
              status: 'active',
              progress: {
                totalVideos: course?.videos?.length || 0,
              },
            });
            await enrollment.save();
            
            if (course) {
              course.enrollmentCount = (course.enrollmentCount || 0) + 1;
              await course.save();
            }
          }
        } else if (state === 'FAILED') {
          payment.status = 'failed';
          await payment.save();
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('PhonePe Callback Error:', error);
    return res.status(500).json({ success: false });
  }
};

// Check PhonePe Payment Status (API endpoint for frontend)
export const checkPhonePeStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const studentId = req.user.userId;

    const payment = await Payment.findById(paymentId).populate('course', 'title price');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if payment belongs to this user
    if (payment.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        error: 'FORBIDDEN',
      });
    }

    // If payment is still pending, check status with PhonePe
    if (payment.status === 'pending' && payment.phonepeMerchantTransactionId) {
      try {
        const accessToken = await getPhonePeAccessToken();
        
        const response = await axios.get(
          `${phonepeConfig.statusUrl}/${payment.phonepeMerchantTransactionId}/status`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `O-Bearer ${accessToken}`
            }
          }
        );

        const state = response.data.state;

        if (state === 'COMPLETED') {
          payment.status = 'completed';
          payment.paidAt = new Date();
          payment.transactionId = `PHONEPE-${response.data.orderId || Date.now()}`;
          await payment.save();

          // Create enrollment if not exists
          const existingEnrollment = await Enrollment.findOne({
            student: payment.student,
            course: payment.course._id,
          });

          if (!existingEnrollment) {
            const course = await Course.findById(payment.course._id);
            const enrollment = new Enrollment({
              student: payment.student,
              course: payment.course._id,
              status: 'active',
              progress: {
                totalVideos: course?.videos?.length || 0,
              },
            });
            await enrollment.save();

            if (course) {
              course.enrollmentCount = (course.enrollmentCount || 0) + 1;
              await course.save();
            }
          }
        } else if (state === 'FAILED') {
          payment.status = 'failed';
          payment.failureReason = response.data.message;
          await payment.save();
        }
      } catch (apiError) {
        console.error('PhonePe status check error:', apiError.message);
      }
    }

    res.json({
      success: true,
      payment: {
        _id: payment._id,
        status: payment.status,
        amount: payment.amount,
        course: payment.course,
        merchantTransactionId: payment.phonepeMerchantTransactionId,
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error('PhonePe status error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

