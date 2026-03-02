import nodemailer from 'nodemailer';

// Admin email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'iiinfottech@gmail.com';
const EMAIL_USER = process.env.EMAIL_USER || 'iiinfottech@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'ddks lqvu eomq wsph';

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

// Send project submission notification to admin
export const sendProjectSubmissionEmail = async ({
  adminEmail,
  studentName,
  studentEmail,
  courseName,
  projectTitle,
  gitHubLink,
  projectId,
}) => {
  try {
    const transporter = createTransporter();
    
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const acceptUrl = `${appUrl}/api/projects/${projectId}/review?action=approve&token=${process.env.ADMIN_ACTION_TOKEN || 'admin-secret'}`;
    const rejectUrl = `${appUrl}/api/projects/${projectId}/review?action=reject&token=${process.env.ADMIN_ACTION_TOKEN || 'admin-secret'}`;

    const mailOptions = {
      from: `"SkillExchange" <${EMAIL_USER}>`,
      to: adminEmail,
      subject: `📝 New Project Submission: ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Submission Review</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📚 SkillExchange</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">New Project Submission</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Project Details</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;"><strong>Student Name:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Student Email:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${studentEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Course:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${courseName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Project Title:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${projectTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>GitHub Link:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <a href="${gitHubLink}" style="color: #667eea; text-decoration: none;">${gitHubLink}</a>
                  </td>
                </tr>
              </table>

              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  📌 Please review the project repository and verify the student's work before approving.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                  ✅ ACCEPT PROJECT
                </a>
                <a href="${rejectUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 0 10px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);">
                  ❌ REJECT PROJECT
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated email from SkillExchange Learning Platform.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Project submission email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send project status notification to student
export const sendProjectStatusEmail = async ({
  studentEmail,
  studentName,
  projectTitle,
  courseName,
  status,
  feedback,
  certificateLink,
}) => {
  try {
    const transporter = createTransporter();
    
    const isApproved = status === 'approved';
    const statusColor = isApproved ? '#28a745' : '#dc3545';
    const statusEmoji = isApproved ? '🎉' : '❌';
    const statusText = isApproved ? 'APPROVED' : 'REJECTED';

    const mailOptions = {
      from: `"SkillExchange" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `${statusEmoji} Project ${statusText}: ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Review Result</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📚 SkillExchange</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Project Review Result</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Hello ${studentName}! ${statusEmoji}</h2>
              
              <div style="background: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: ${statusColor}; font-weight: bold; font-size: 18px;">
                  Your project "${projectTitle}" has been ${statusText}!
                </p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 120px;"><strong>Course:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${courseName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Project:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333;">${projectTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Status:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                    <span style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">${statusText}</span>
                  </td>
                </tr>
              </table>

              ${feedback ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 5px 0; color: #666; font-weight: bold;">Feedback from Instructor:</p>
                  <p style="margin: 0; color: #333;">${feedback}</p>
                </div>
              ` : ''}

              ${isApproved && certificateLink ? `
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #28a745; font-size: 18px; margin-bottom: 15px;">🏆 Congratulations! Your certificate is ready!</p>
                  <a href="${certificateLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                    📜 View Certificate
                  </a>
                </div>
              ` : ''}

              ${!isApproved ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                    💡 Don't worry! You can review the feedback and resubmit your project after making improvements.
                  </p>
                </div>
              ` : ''}

              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This is an automated email from SkillExchange Learning Platform.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Project status email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendProjectSubmissionEmail,
  sendProjectStatusEmail,
};
