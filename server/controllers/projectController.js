import Project from '../models/Project.js';
import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import { v4 as uuidv4 } from 'uuid';

export const submitProject = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, gitHubLink } = req.body;

    if (!title || !gitHubLink) {
      return res.status(400).json({
        success: false,
        message: 'Title and GitHub link are required',
        error: 'VALIDATION_ERROR',
      });
    }

    // Check if already submitted
    const existingProject = await Project.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a project for this course',
        error: 'DUPLICATE_ENTRY',
      });
    }

    const project = new Project({
      student: req.user.userId,
      course: courseId,
      title,
      description,
      gitHubLink,
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getStudentProjects = async (req, res) => {
  try {
    const projects = await Project.find({ student: req.user.userId })
      .populate('course', 'title')
      .populate('student', 'name email');

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getCourseProjects = async (req, res) => {
  try {
    const { courseId } = req.params;

    const projects = await Project.find({ course: courseId })
      .populate('student', 'name email')
      .populate('reviewedBy', 'name');

    res.json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const reviewProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, feedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be approved or rejected',
        error: 'VALIDATION_ERROR',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'NOT_FOUND',
      });
    }

    project.status = status;
    project.feedback = feedback;
    project.reviewedBy = req.user.userId;
    project.reviewedAt = new Date();
    await project.save();

    // If approved, create certificate
    if (status === 'approved') {
      const certificateNumber = `CERT-${uuidv4()}`;
      const verificationLink = `${process.env.APP_URL || 'http://localhost:5173'}/verify/${certificateNumber}`;

      const certificate = new Certificate({
        student: project.student,
        course: project.course,
        project: project._id,
        certificateNumber,
        verificationLink,
      });

      await certificate.save();
      project.certificateId = certificate._id;
      await project.save();

      // Update enrollment
      await Enrollment.updateOne(
        { student: project.student, course: project.course },
        {
          certificateIssued: true,
          certificateId: certificate._id,
          status: 'completed',
          projectStatus: 'approved',
        }
      );
    }

    res.json({
      success: true,
      message: `Project ${status}`,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('reviewedBy', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
