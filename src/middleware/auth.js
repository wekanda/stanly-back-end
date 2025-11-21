const jwt = require('jsonwebtoken');

// Mock users for testing without database
const mockUsers = {
  'admin@mbalehub.com': {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@mbalehub.com',
    role: 'admin',
    faculty: 'Administration',
    department: 'IT',
    isActive: true
  },
  'supervisor@mbalehub.com': {
    _id: '507f1f77bcf86cd799439012',
    id: '507f1f77bcf86cd799439012',
    name: 'Supervisor User',
    email: 'supervisor@mbalehub.com',
    role: 'supervisor',
    faculty: 'Engineering',
    department: 'Computer Science',
    isActive: true
  },
  'student@mbalehub.com': {
    _id: '507f1f77bcf86cd799439013',
    id: '507f1f77bcf86cd799439013',
    name: 'Student User',
    email: 'student@mbalehub.com',
    role: 'student',
    faculty: 'Science',
    department: 'Information Technology',
    isActive: true
  },
  'wekstudent@gmail.com': {
    _id: '507f1f77bcf86cd799439014',
    id: '507f1f77bcf86cd799439014',
    name: 'Wek Student',
    email: 'wekstudent@gmail.com',
    role: 'student',
    faculty: 'Engineering',
    department: 'Computer Science',
    isActive: true
  }
};

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Get user from mock data by ID
    const user = Object.values(mockUsers).find(u => u.id === decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user owns resource or is admin/supervisor
exports.ownerOrAdmin = (model) => {
  return async (req, res, next) => {
    // For mock data, skip database lookup and just check ownership
    if (process.env.NODE_ENV === 'development' && !process.env.MONGO_URI.includes('mongodb+srv')) {
      // Allow access for development with mock data
      next();
      return;
    }

    try {
      const resource = await model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Allow if user owns the resource or is admin/supervisor
      if (resource.submittedBy.toString() !== req.user.id &&
          req.user.role !== 'admin' &&
          req.user.role !== 'supervisor') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      // If database operation fails, allow access for development
      if (process.env.NODE_ENV === 'development') {
        next();
      } else {
        return res.status(500).json({
          success: false,
          message: 'Server error'
        });
      }
    }
  };
};

// Check if user is admin or supervisor
exports.adminOrSupervisor = () => {
  return (req, res, next) => {
    if (!['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};