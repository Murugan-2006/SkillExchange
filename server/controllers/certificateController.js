import Certificate from '../models/Certificate.js';

export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.userId })
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate('project');

    res.json({
      success: true,
      certificates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        error: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        error: 'NOT_FOUND',
      });
    }

    // Increment verification count
    certificate.verificationCount += 1;
    await certificate.save();

    res.json({
      success: true,
      isValid: certificate.isVerified,
      student: certificate.student.name,
      course: certificate.course.title,
      issuedAt: certificate.issuedAt,
      skills: certificate.skills,
      verificationCount: certificate.verificationCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.certificateId)
      .populate('student', 'name')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        error: 'NOT_FOUND',
      });
    }

    // In production, generate PDF using a library like pdfkit
    res.json({
      success: true,
      message: 'Certificate ready for download',
      certificate,
      downloadUrl: '/certificates/' + certificate._id + '.pdf',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'SERVER_ERROR',
    });
  }
};
