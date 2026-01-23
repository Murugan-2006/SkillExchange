import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, level } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (category) query.category = category;
    if (level) query.level = level;

    const courses = await Course.find(query)
      .populate('instructor', 'name email')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      courses,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('videos');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { title, description, skillsCovered, creditsRequired, level, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
        error: 'VALIDATION_ERROR',
      });
    }

    const course = new Course({
      title,
      description,
      skillsCovered: skillsCovered || [],
      creditsRequired: creditsRequired || 0,
      level: level || 'beginner',
      category: category || 'General',
      instructor: req.user.userId,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    // Check if user is instructor
    if (course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course',
        error: 'FORBIDDEN',
      });
    }

    Object.assign(course, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        error: 'NOT_FOUND',
      });
    }

    if (course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this course',
        error: 'FORBIDDEN',
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
