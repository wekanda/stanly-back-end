const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const Project = require('../models/Project');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getUserProjects,
  approveProject,
  getPendingProjects,
  likeProject
} = require('../controllers/projectController');

const { protect, authorize, ownerOrAdmin, adminOrSupervisor } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
});

// Validation rules
const projectValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .isIn(['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Robotics', 'Data Science', 'Other'])
    .withMessage('Invalid category'),
  body('faculty')
    .trim()
    .notEmpty()
    .withMessage('Faculty is required'),
  body('year')
    .isInt({ min: 2020, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .matches(/^https?:\/\/(www\.)?github\.com\/.+$/)
    .withMessage('Invalid GitHub URL'),
  body('liveDemoUrl')
    .optional()
    .isURL()
    .withMessage('Invalid demo URL')
];

// Public routes
router.get('/', getProjects);
router.get('/:id', getProject);

// Protected routes
router.use(protect); // All routes below require authentication

// User project routes
router.get('/user/me', getUserProjects);
router.post('/', upload.single('document'), projectValidation, authorize('student'), createProject);
router.put('/:id', ownerOrAdmin(Project), updateProject);
router.delete('/:id', ownerOrAdmin(Project), deleteProject);

// Like project
router.post('/:id/like', likeProject);

// Supervisor/Admin routes
router.get('/admin/pending', authorize('supervisor', 'admin'), getPendingProjects);
router.put('/:id/approve', authorize('supervisor', 'admin'), [
  body('status')
    .isIn(['approved', 'rejected', 'revision'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment too long')
], approveProject);

module.exports = router;