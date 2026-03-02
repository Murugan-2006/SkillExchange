import Course from '../models/Course.js';
import Feedback from '../models/Feedback.js';
import Credits from '../models/Credits.js';
import { calculateBonusCredits, isCourseEligibleForBonus } from '../utils/bonusCredits.js';

/**
 * Process and award bonus credits for a single course after it ends
 * Only processes if course has ended and bonus hasn't been paid yet
 */
export const processCourseBonus = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    {/* main in course*/}

    // Check if course is eligible for bonus
    if (!isCourseEligibleForBonus(course.endDate, course.bonusCreditsPaid)) {
      if (course.bonusCreditsPaid) {
        return res.status(400).json({
          success: false,
          message: 'Bonus credits have already been paid for this course',
          error: 'ALREADY_PAID',
        });
      }
      if (!course.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Course has no end date set',
          error: 'NO_END_DATE',
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Course has not ended yet. Bonus credits can only be calculated after the course end date.',
        error: 'COURSE_NOT_ENDED',
        endDate: course.endDate,
      });
    }
    // Get all feedback for this course
    const feedbacks = await Feedback.find({ course: courseId });
    const numberOfRatings = feedbacks.length;

    if (numberOfRatings === 0) {
      return res.status(400).json({
        success: false,
        message: 'No ratings received for this course',
        error: 'NO_RATINGS',
      });
    }
   // Calculate average rating
    const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = totalRating / numberOfRatings;

    // Calculate bonus credits
    const bonusResult = calculateBonusCredits(numberOfRatings, averageRating);

    // Award credits to instructor's wallet
    let instructorCredits = await Credits.findOne({ student: course.instructor._id });
  
    if (!instructorCredits) {
      instructorCredits = new Credits({
        student: course.instructor._id,
        balance: 50, // Default balance
      });
    }

    instructorCredits.balance += bonusResult.bonusCredits;
    instructorCredits.transactions.push({
      type: 'earned',
      amount: bonusResult.bonusCredits,
      reason: `Bonus credits for course "${course.title}" - ${numberOfRatings} ratings, ${averageRating.toFixed(1)}★ avg`,
      relatedId: course._id,
    });

    await instructorCredits.save();

    // Mark course as bonus paid
    course.bonusCreditsPaid = true;
    course.bonusCreditsAmount = bonusResult.bonusCredits;
    await course.save();

    res.json({
      success: true,
      message: `Bonus credits awarded to ${course.instructor.name}`,
      data: {
        courseTitle: course.title,
        instructor: course.instructor.name,
        ...bonusResult,
        newBalance: instructorCredits.balance,
      },
    });
  } catch (error) {
    console.error('Process course bonus error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

/**
 * Process all eligible courses and award bonus credits
 * This can be run as a scheduled job or manually by admin
 */
export const processAllEndedCourses = async (req, res) => {
  try {
    const now = new Date();

    // Find all courses that have ended and haven't been paid yet
    const eligibleCourses = await Course.find({
      endDate: { $lt: now },
      bonusCreditsPaid: false,
    }).populate('instructor', 'name email');

    if (eligibleCourses.length === 0) {
      return res.json({
        success: true,
        message: 'No courses eligible for bonus credits',
        processedCount: 0,
      });
    }

    const results = [];

    for (const course of eligibleCourses) {
      try {
        // Get feedback for this course
        const feedbacks = await Feedback.find({ course: course._id });
        const numberOfRatings = feedbacks.length;

        if (numberOfRatings === 0) {
          results.push({
            courseId: course._id,
            courseTitle: course.title,
            status: 'skipped',
            reason: 'No ratings',
          });
          continue;
        }

        // Calculate average rating
        const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
        const averageRating = totalRating / numberOfRatings;

        // Calculate bonus credits
        const bonusResult = calculateBonusCredits(numberOfRatings, averageRating);

        // Award credits to instructor
        let instructorCredits = await Credits.findOne({ student: course.instructor._id });

        if (!instructorCredits) {
          instructorCredits = new Credits({
            student: course.instructor._id,
            balance: 50,
          });
        }

        instructorCredits.balance += bonusResult.bonusCredits;
        instructorCredits.transactions.push({
          type: 'earned',
          amount: bonusResult.bonusCredits,
          reason: `Bonus credits for course "${course.title}" - ${numberOfRatings} ratings, ${averageRating.toFixed(1)}★ avg`,
          relatedId: course._id,
        });

        await instructorCredits.save();

        // Mark course as paid
        course.bonusCreditsPaid = true;
        course.bonusCreditsAmount = bonusResult.bonusCredits;
        await course.save();

        results.push({
          courseId: course._id,
          courseTitle: course.title,
          instructor: course.instructor.name,
          status: 'success',
          ...bonusResult,
        });
      } catch (err) {
        results.push({
          courseId: course._id,
          courseTitle: course.title,
          status: 'error',
          reason: err.message,
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const totalCreditsAwarded = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.bonusCredits, 0);

    res.json({
      success: true,
      message: `Processed ${eligibleCourses.length} courses, awarded bonus to ${successCount}`,
      totalCreditsAwarded,
      results,
    });
  } catch (error) {
    console.error('Process all ended courses error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

/**
 * Get bonus credit status for a course
 */
export const getCourseBonus = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('instructor', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Get feedback stats
    const feedbacks = await Feedback.find({ course: courseId });
    const numberOfRatings = feedbacks.length;
    const averageRating = numberOfRatings > 0
      ? feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / numberOfRatings
      : 0;

    // Calculate potential bonus
    const potentialBonus = calculateBonusCredits(numberOfRatings, averageRating);

    const isEligible = isCourseEligibleForBonus(course.endDate, course.bonusCreditsPaid);
    const hasEnded = course.endDate && new Date(course.endDate) < new Date();

    res.json({
      success: true,
      data: {
        courseId: course._id,
        courseTitle: course.title,
        instructor: course.instructor.name,
        endDate: course.endDate,
        hasEnded,
        bonusCreditsPaid: course.bonusCreditsPaid,
        bonusCreditsAmount: course.bonusCreditsAmount,
        isEligible,
        currentStats: {
          numberOfRatings,
          averageRating: Math.round(averageRating * 100) / 100,
        },
        potentialBonus: course.bonusCreditsPaid ? null : potentialBonus,
      },
    });
  } catch (error) {
    console.error('Get course bonus error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

/**
 * Get instructor's bonus credit history
 */
export const getInstructorBonusHistory = async (req, res) => {
  try {
    const instructorId = req.user.userId;

    // Get all courses by this instructor with bonus credits paid
    const courses = await Course.find({
      instructor: instructorId,
      bonusCreditsPaid: true,
    }).select('title endDate bonusCreditsAmount bonusCreditsPaid');

    // Get credit transactions related to bonus
    const credits = await Credits.findOne({ student: instructorId });
    const bonusTransactions = credits
      ? credits.transactions.filter((t) => t.reason.includes('Bonus credits for course'))
      : [];

    const totalBonusEarned = courses.reduce((sum, c) => sum + (c.bonusCreditsAmount || 0), 0);

    res.json({
      success: true,
      data: {
        totalBonusEarned,
        coursesWithBonus: courses,
        transactions: bonusTransactions,
      },
    });
  } catch (error) {
    console.error('Get instructor bonus history error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
