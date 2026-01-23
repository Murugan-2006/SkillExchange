import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Credits from '../models/Credits.js';

export const enrollCourse = async (req, res) => {
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

    // Check credits if required
    if (course.creditsRequired > 0) {
      const credits = await Credits.findOne({ student: studentId });
      if (!credits || credits.balance < course.creditsRequired) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits',
          error: 'VALIDATION_ERROR',
        });
      }

      // Deduct credits
      credits.balance -= course.creditsRequired;
      credits.transactions.push({
        type: 'spent',
        amount: course.creditsRequired,
        reason: `Enrolled in ${course.title}`,
        relatedId: courseId,
      });
      await credits.save();
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      progress: {
        totalVideos: course.videos.length,
      },
    });

    await enrollment.save();

    // Increase enrollment count
    course.enrollmentCount += 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
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

export const getEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.userId })
      .populate('course')
      .populate('student', 'name email');

    res.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
        error: 'NOT_FOUND',
      });
    }

    // Check authorization
    if (enrollment.student._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
        error: 'FORBIDDEN',
      });
    }

    res.json({
      success: true,
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

export const updateProgress = async (req, res) => {
  try {
    const { videoId, watchPercentage } = req.body;
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
        error: 'NOT_FOUND',
      });
    }

    // Update progress
    enrollment.progress.lastWatchedVideoId = videoId;
    enrollment.progress.watchPercentage = watchPercentage;
    enrollment.progress.lastWatchedAt = new Date();

    if (watchPercentage > 0) {
      enrollment.progress.videosWatched = Math.ceil(
        (watchPercentage / 100) * enrollment.progress.totalVideos
      );
    }

    await enrollment.save();

    res.json({
      success: true,
      message: 'Progress updated',
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
