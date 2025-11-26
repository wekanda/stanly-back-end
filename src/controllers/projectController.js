const { validationResult } = require('express-validator');
const Project = require('../models/Project');

// Mock projects data for testing
let mockProjects = [
  {
    _id: '1',
    title: 'Smart Agriculture System',
    description: 'An IoT-based system for monitoring crop health and optimizing irrigation.',
    category: 'IoT',
    technologies: ['Arduino', 'Sensors', 'Node.js'],
    faculty: 'Engineering',
    department: 'Agricultural Engineering',
    year: 2024,
    status: 'approved',
    submittedBy: {
      _id: '507f1f77bcf86cd799439013',
      id: '507f1f77bcf86cd799439013',
      name: 'Student User',
      email: 'student@mbalehub.com'
    },
    githubUrl: 'https://github.com/student/smart-agriculture',
    liveDemoUrl: 'https://demo.smart-agri.com',
    createdAt: '2024-01-15T10:00:00.000Z',
    views: 45,
    likes: []
  },
  {
    _id: '2',
    title: 'AI-Powered Health Monitor',
    description: 'Machine learning application for predicting health risks from vital signs.',
    category: 'AI/ML',
    technologies: ['Python', 'TensorFlow', 'React'],
    faculty: 'Science',
    department: 'Computer Science',
    year: 2024,
    status: 'approved',
    submittedBy: {
      _id: '507f1f77bcf86cd799439013',
      id: '507f1f77bcf86cd799439013',
      name: 'Student User',
      email: 'student@mbalehub.com'
    },
    githubUrl: 'https://github.com/student/health-monitor',
    liveDemoUrl: 'https://demo.health-ai.com',
    createdAt: '2024-01-10T14:30:00.000Z',
    views: 32,
    likes: []
  },
  {
    _id: '3',
    title: 'E-Learning Platform',
    description: 'Interactive online learning platform with video conferencing and assessments.',
    category: 'Web Development',
    technologies: ['React', 'Node.js', 'MongoDB', 'WebRTC'],
    faculty: 'Education',
    department: 'Educational Technology',
    year: 2024,
    status: 'pending',
    submittedBy: {
      _id: '507f1f77bcf86cd799439013',
      id: '507f1f77bcf86cd799439013',
      name: 'Student User',
      email: 'student@ucuhub.com'
    },
    githubUrl: 'https://github.com/student/e-learning',
    liveDemoUrl: 'https://demo.e-learning.com',
    createdAt: '2024-01-12T09:15:00.000Z',
    views: 18,
    likes: []
  }
];

// @desc    Get all projects (public gallery)
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
  try {
    const { category, faculty, status, search } = req.query;

    let filteredProjects = [...mockProjects];

    // Apply filters
    if (category && category !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.category === category);
    }
    if (faculty && faculty !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.faculty === faculty);
    }
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    if (search) {
      filteredProjects = filteredProjects.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.technologies.some(tech => tech.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Only show approved projects for public access
    if (!req.user) {
      filteredProjects = filteredProjects.filter(p => p.status === 'approved');
    }

    res.json({
      success: true,
      count: filteredProjects.length,
      data: filteredProjects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('submittedBy', 'name email faculty department')
      .populate('approvedBy', 'name')
      .populate('supervisorComments.user', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Increment view count
    project.views += 1;
    await project.save();

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (students)
exports.createProject = async (req, res) => {
  try {
    const { title, description, category, faculty, department, year, technologies, githubUrl, liveDemoUrl } = req.body;

    // Handle technologies - could be string or array
    let techArray = [];
    if (Array.isArray(technologies)) {
      techArray = technologies;
    } else if (typeof technologies === 'string') {
      try {
        techArray = JSON.parse(technologies);
      } catch {
        techArray = technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
      }
    }

    // Create new project with mock data
    const newProject = {
      _id: (mockProjects.length + 1).toString(),
      title,
      description,
      category,
      faculty,
      department,
      year: parseInt(year),
      technologies: techArray,
      githubUrl: githubUrl || undefined, // Make optional
      liveDemoUrl: liveDemoUrl || undefined, // Make optional
      status: 'pending',
      submittedBy: {
        _id: req.user.id,
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      createdAt: new Date().toISOString(),
      views: 0,
      likes: [],
      documentationUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    };

    // Add to mock projects
    mockProjects.push(newProject);

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully',
      data: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owner or admin)
exports.updateProject = async (req, res) => {
  try {
    // Handle mock data update
    const projectId = req.params.id;
    const projectIndex = mockProjects.findIndex(p => p._id === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = mockProjects[projectIndex];

    // Make sure user is project owner or admin/supervisor
    if (project.submittedBy.id !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'supervisor') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    // Don't allow status updates by regular users
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      delete req.body.status;
      delete req.body.approvedBy;
      delete req.body.approvedAt;
    }

    // Handle technologies field
    let techArray = [];
    if (Array.isArray(req.body.technologies)) {
      techArray = req.body.technologies;
    } else if (typeof req.body.technologies === 'string') {
      techArray = req.body.technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
    }

    // Update project
    const updatedProject = {
      ...project,
      ...req.body,
      technologies: techArray,
      updatedAt: new Date().toISOString()
    };

    mockProjects[projectIndex] = updatedProject;

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner or admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Make sure user is project owner or admin
    if (project.submittedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's projects
// @route   GET /api/projects/user/me
// @access  Private
exports.getUserProjects = async (req, res) => {
  try {
    // Filter mock projects by user (check both ID and email for compatibility)
    const userProjects = mockProjects.filter(project =>
      project.submittedBy.id === req.user.id || project.submittedBy.email === req.user.email
    );

    res.json({
      success: true,
      count: userProjects.length,
      data: userProjects
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve/Reject project
// @route   PUT /api/projects/:id/approve
// @access  Private (supervisor/admin)
exports.approveProject = async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!['approved', 'rejected', 'revision'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Find project in mock data
    const projectIndex = mockProjects.findIndex(p => p._id === req.params.id);
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const project = mockProjects[projectIndex];

    // Update project status
    project.status = status;
    if (status === 'approved') {
      project.approvedBy = req.user.id;
      project.approvedAt = new Date().toISOString();
    }

    // Add supervisor comment if provided
    if (comment) {
      if (!project.supervisorComments) {
        project.supervisorComments = [];
      }
      project.supervisorComments.push({
        user: req.user.id,
        comment,
        createdAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Project ${status} successfully`,
      data: project
    });
  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get pending projects for approval
// @route   GET /api/projects/pending
// @access  Private (supervisor/admin)
exports.getPendingProjects = async (req, res) => {
  try {
    // Filter mock projects for pending/revision status
    const pendingProjects = mockProjects.filter(project =>
      ['pending', 'revision'].includes(project.status)
    );

    res.json({
      success: true,
      count: pendingProjects.length,
      data: pendingProjects
    });
  } catch (error) {
    console.error('Get pending projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Like/Unlike project
// @route   POST /api/projects/:id/like
// @access  Private
exports.likeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const likeIndex = project.likes.findIndex(
      like => like.user.toString() === req.user.id
    );

    if (likeIndex > -1) {
      // Unlike
      project.likes.splice(likeIndex, 1);
    } else {
      // Like
      project.likes.push({ user: req.user.id });
    }

    await project.save();

    res.json({
      success: true,
      liked: likeIndex === -1,
      likeCount: project.likes.length
    });
  } catch (error) {
    console.error('Like project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};