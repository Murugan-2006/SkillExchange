import Project from '../models/Project.js';
import Certificate from '../models/Certificate.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { v4 as uuidv4 } from 'uuid';
import { sendProjectSubmissionEmail, sendProjectStatusEmail } from '../utils/emailService.js';

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

    // Get user's GitHub username
    const user = await User.findById(req.user.userId);
    if (!user || !user.githubUsername) {
      return res.status(400).json({
        success: false,
        message: 'Your account does not have a GitHub username registered',
        error: 'VALIDATION_ERROR',
      });
    }

    // Verify GitHub link matches user's GitHub username
    // Extract username from GitHub URL (handles various formats)
    const githubUrlPattern = /github\.com\/([a-zA-Z0-9_-]+)/i;
    const match = gitHubLink.match(githubUrlPattern);
    
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub URL format. Please provide a valid GitHub repository link.',
        error: 'VALIDATION_ERROR',
      });
    }

    const submittedGithubUsername = match[1].toLowerCase();
    const userGithubUsername = user.githubUsername.toLowerCase();

    if (submittedGithubUsername !== userGithubUsername) {
      return res.status(400).json({
        success: false,
        message: `GitHub link must be from your own account (${user.githubUsername}). You submitted a link from "${match[1]}".`,
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

    // Update enrollment to mark project as submitted and recalculate progress
    const enrollment = await Enrollment.findOne({
      student: req.user.userId,
      course: courseId,
    });

    if (enrollment) {
      enrollment.projectSubmitted = true;
      enrollment.projectStatus = 'pending';
      
      // Recalculate progress: Videos = 80%, Project Submitted = 10%, Project Approved = 10%
      const totalVideos = enrollment.progress.totalVideos || 1;
      const videosWatched = enrollment.progress.watchedVideoIds?.length || 0;
      const videoProgress = Math.round((videosWatched / totalVideos) * 80);
      const projectSubmittedProgress = 10; // Project now submitted
      // Project not approved yet, so no approval progress
      enrollment.progress.watchPercentage = Math.min(videoProgress + projectSubmittedProgress, 90);
      
      // Don't mark as completed - needs admin approval
      enrollment.status = 'active';
      
      await enrollment.save();
    }

    // Get course details with instructor info for email
    const course = await Course.findById(courseId).populate('instructor', 'name email');
    const student = await User.findById(req.user.userId);
    
    // Send email to course instructor (who created this course)
    if (course && course.instructor && course.instructor.email) {
      await sendProjectSubmissionEmail({
        adminEmail: course.instructor.email,
        studentName: student.name,
        studentEmail: student.email,
        courseName: course.title,
        projectTitle: title,
        gitHubLink,
        projectId: project._id.toString(),
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully. Course instructor has been notified via email.',
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

    const project = await Project.findById(projectId)
      .populate('student', 'name email')
      .populate('course', 'title');
      
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

    let certificateLink = null;

    // If approved, create certificate
    if (status === 'approved') {
      const certificateNumber = `CERT-${uuidv4()}`;
      const verificationLink = `${process.env.APP_URL || 'http://localhost:5173'}/verify/${certificateNumber}`;

      const certificate = new Certificate({
        student: project.student._id,
        course: project.course._id,
        project: project._id,
        certificateNumber,
        verificationLink,
      });

      await certificate.save();
      project.certificateId = certificate._id;
      await project.save();

      certificateLink = `${process.env.APP_URL || 'http://localhost:5173'}/certificate/${certificate._id}`;

      // Update enrollment
      const enrollment = await Enrollment.findOne(
        { student: project.student._id, course: project.course._id }
      );
      
      if (enrollment) {
        enrollment.certificateIssued = true;
        enrollment.certificateId = certificate._id;
        enrollment.status = 'completed';
        enrollment.projectStatus = 'approved';
        enrollment.progress.watchPercentage = 100; // Full completion
        await enrollment.save();
      }
    } else {
      // If rejected, update enrollment status
      const enrollment = await Enrollment.findOne(
        { student: project.student._id, course: project.course._id }
      );
      
      if (enrollment) {
        enrollment.projectStatus = 'rejected';
        await enrollment.save();
      }
    }

    // Send email notification to student
    await sendProjectStatusEmail({
      studentEmail: project.student.email,
      studentName: project.student.name,
      projectTitle: project.title,
      courseName: project.course.title,
      status,
      feedback,
      certificateLink,
    });

    res.json({
      success: true,
      message: `Project ${status}. Student has been notified via email.`,
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

// Handle review from email link (GET request with query params)
export const reviewProjectFromEmail = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { action, token } = req.query;

    // Verify admin token
    const adminToken = process.env.ADMIN_ACTION_TOKEN || 'admin-secret';
    if (token !== adminToken) {
      return res.status(401).send(`
        <html>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc3545;">❌ Unauthorized</h1>
              <p>Invalid or expired token.</p>
            </div>
          </body>
        </html>
      `);
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc3545;">❌ Invalid Action</h1>
              <p>Action must be 'approve' or 'reject'.</p>
            </div>
          </body>
        </html>
      `);
    }

    const project = await Project.findById(projectId)
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!project) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #dc3545;">❌ Not Found</h1>
              <p>Project not found.</p>
            </div>
          </body>
        </html>
      `);
    }

    if (project.status !== 'pending') {
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h1 style="color: #ffc107;">⚠️ Already Reviewed</h1>
              <p>This project has already been ${project.status}.</p>
            </div>
          </body>
        </html>
      `);
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    project.status = status;
    project.reviewedAt = new Date();
    await project.save();

    let certificateLink = null;

    if (status === 'approved') {
      const certificateNumber = `CERT-${uuidv4()}`;
      const verificationLink = `${process.env.APP_URL || 'http://localhost:5173'}/verify/${certificateNumber}`;

      const certificate = new Certificate({
        student: project.student._id,
        course: project.course._id,
        project: project._id,
        certificateNumber,
        verificationLink,
      });

      await certificate.save();
      project.certificateId = certificate._id;
      await project.save();

      certificateLink = `${process.env.APP_URL || 'http://localhost:5173'}/certificate/${certificate._id}`;

      const enrollment = await Enrollment.findOne(
        { student: project.student._id, course: project.course._id }
      );
      
      if (enrollment) {
        enrollment.certificateIssued = true;
        enrollment.certificateId = certificate._id;
        enrollment.status = 'completed';
        enrollment.projectStatus = 'approved';
        enrollment.progress.watchPercentage = 100;
        await enrollment.save();
      }
    } else {
      const enrollment = await Enrollment.findOne(
        { student: project.student._id, course: project.course._id }
      );
      
      if (enrollment) {
        enrollment.projectStatus = 'rejected';
        await enrollment.save();
      }
    }

    // Send email to student
    await sendProjectStatusEmail({
      studentEmail: project.student.email,
      studentName: project.student.name,
      projectTitle: project.title,
      courseName: project.course.title,
      status,
      feedback: null,
      certificateLink,
    });

    const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
    const statusEmoji = status === 'approved' ? '✅' : '❌';

    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
          <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px;">
            <h1 style="color: ${statusColor};">${statusEmoji} Project ${status.toUpperCase()}</h1>
            <p style="color: #666; margin: 20px 0;">
              <strong>Student:</strong> ${project.student.name}<br>
              <strong>Project:</strong> ${project.title}<br>
              <strong>Course:</strong> ${project.course.title}
            </p>
            <p style="color: #28a745;">✓ Student has been notified via email.</p>
            <a href="${process.env.APP_URL || 'http://localhost:5173'}/admin/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
              Go to Dashboard
            </a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error reviewing project from email:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
          <div style="text-align: center; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc3545;">❌ Error</h1>
            <p>${error.message}</p>
          </div>
        </body>
      </html>
    `);
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
