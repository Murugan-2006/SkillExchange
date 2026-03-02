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

    // Recalculate progress for each enrollment to ensure accuracy
    for (let enrollment of enrollments) {
      if (enrollment.course) {
        const course = await Course.findById(enrollment.course._id).populate('videos');
        const totalVideos = course?.videos?.length || 1;
        const videosWatched = enrollment.progress.watchedVideoIds?.length || 0;
        
        // Videos = 80%, Project Submitted = 10%, Project Approved = 10%
        const videoProgress = Math.round((videosWatched / totalVideos) * 80);
        const projectSubmittedProgress = enrollment.projectSubmitted ? 10 : 0;
        const projectApprovedProgress = enrollment.projectStatus === 'approved' ? 10 : 0;
        const overallProgress = Math.min(videoProgress + projectSubmittedProgress + projectApprovedProgress, 100);
        
        // Update enrollment if progress changed
        if (enrollment.progress.watchPercentage !== overallProgress) {
          enrollment.progress.watchPercentage = overallProgress;
          enrollment.progress.totalVideos = totalVideos;
          enrollment.progress.videosWatched = videosWatched;
          
          // Fix status based on actual completion
          if (videosWatched >= totalVideos && enrollment.projectStatus === 'approved') {
            enrollment.status = 'completed';
          } else {
            enrollment.status = 'active';
          }
          
          await enrollment.save();
        }
      }
    }

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

export const updateProgressByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { videoId, watchPercentage } = req.body;
    const studentId = req.user.userId;

    // Find enrollment by course and student
    let enrollment = await Enrollment.findOne({
      course: courseId,
      student: studentId,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found for this course',
        error: 'NOT_FOUND',
      });
    }

    // Get total videos count for the course
    const course = await Course.findById(courseId).populate('videos');
    const totalVideos = course?.videos?.length || 1;

    // Track watched videos - store unique video IDs
    if (!enrollment.progress.watchedVideoIds) {
      enrollment.progress.watchedVideoIds = [];
    }

    // Add video to watched list if not already there and watchPercentage >= 90
    if (videoId && watchPercentage >= 90) {
      const videoIdStr = videoId.toString();
      if (!enrollment.progress.watchedVideoIds.includes(videoIdStr)) {
        enrollment.progress.watchedVideoIds.push(videoIdStr);
      }
    }

    // Calculate progress:
    // Videos = 80% max, Project Submitted = 10%, Project Approved = 10%
    const videosWatched = enrollment.progress.watchedVideoIds.length;
    const videoProgress = Math.round((videosWatched / totalVideos) * 80); // Max 80%
    const projectSubmittedProgress = enrollment.projectSubmitted ? 10 : 0; // 10% for submission
    const projectApprovedProgress = enrollment.projectStatus === 'approved' ? 10 : 0; // 10% for approval
    const overallProgress = Math.min(videoProgress + projectSubmittedProgress + projectApprovedProgress, 100);

    // Update progress fields
    enrollment.progress.lastWatchedVideoId = videoId;
    enrollment.progress.lastWatchedAt = new Date();
    enrollment.progress.totalVideos = totalVideos;
    enrollment.progress.videosWatched = videosWatched;
    enrollment.progress.watchPercentage = overallProgress;

    // Mark as completed ONLY if all videos watched AND project is APPROVED
    if (videosWatched >= totalVideos && enrollment.projectStatus === 'approved') {
      enrollment.status = 'completed';
    } else {
      enrollment.status = 'active';
    }

    await enrollment.save();

    res.json({
      success: true,
      message: 'Progress updated',
      enrollment,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
