import { verifyToken } from '../config/jwt.js';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        error: 'UNAUTHORIZED',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'UNAUTHORIZED',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'SERVER_ERROR',
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
      error: 'FORBIDDEN',
    });
  }
  next();
};

export const studentMiddleware = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.',
      error: 'FORBIDDEN',
    });
  }
  next();
};
