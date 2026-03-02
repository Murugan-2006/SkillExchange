import Feedback from '../models/Feedback.js';
import Course from '../models/Course.js';
import Credits from '../models/Credits.js';

// Submit feedback for a course
export const submitFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const studentId = req.user.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating is required and must be between 1 and 5',
        error: 'VALIDATION_ERROR',
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      course: courseId,
      student: studentId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this course',
        error: 'DUPLICATE_FEEDBACK',
      });
    }

    // Get course to find instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Create feedback
    const feedback = new Feedback({
      course: courseId,
      student: studentId,
      rating,
      comment: comment || '',
    });

    await feedback.save();

    // Calculate credits based on rating (higher rating = more credits)
    // Base: 2 credits, +1 for each star above 1
    const creditsToAdd = Math.floor(rating);

    // Add credits to instructor's wallet
    let instructorCredits = await Credits.findOne({ student: course.instructor });

    if (!instructorCredits) {
      instructorCredits = new Credits({
        student: course.instructor,
        balance: 50, // Default balance
      });
    }

    instructorCredits.balance += creditsToAdd;
    instructorCredits.transactions.push({
      type: 'earned',
      amount: creditsToAdd,
      reason: `Feedback received (${rating} stars) for course: ${course.title}`,
      relatedId: feedback._id,
    });

    await instructorCredits.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
      creditsAwarded: creditsToAdd,
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Check if user has submitted feedback for a course
export const checkFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    const feedback = await Feedback.findOne({
      course: courseId,
      student: studentId,
    });

    res.json({
      success: true,
      hasSubmitted: !!feedback,
      feedback: feedback || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

// Get all feedback for a course (for instructor/admin)
export const getCourseFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;

    const feedbacks = await Feedback.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 0;

    res.json({
      success: true,
      feedbacks,
      averageRating: parseFloat(averageRating),
      totalFeedbacks: feedbacks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
