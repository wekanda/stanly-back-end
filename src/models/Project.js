const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a project description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Web Development', 'Mobile App', 'AI/ML', 'IoT', 'Robotics', 'Data Science', 'Other']
  },
  technologies: [{
    type: String,
    trim: true
  }],
  faculty: {
    type: String,
    required: [true, 'Please add a faculty'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Please add the project year'],
    min: [2020, 'Year must be 2020 or later']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision'],
    default: 'pending'
  },
  githubUrl: {
    type: String,
    match: [
      /^https?:\/\/(www\.)?github\.com\/.+/,
      'Please provide a valid GitHub URL'
    ]
  },
  liveDemoUrl: {
    type: String,
    match: [
      /^https?:\/\/.+/,
      'Please provide a valid URL'
    ]
  },
  documentationUrl: {
    type: String // Path to uploaded PDF document
  },
  images: [{
    type: String // Paths to uploaded images
  }],
  teamMembers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    role: {
      type: String,
      trim: true
    }
  }],
  submittedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  supervisorComments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search functionality
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

// Virtual for like count
projectSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Static method to get projects by status
projectSchema.statics.getByStatus = function(status) {
  return this.find({ status });
};

// Static method to get projects by faculty
projectSchema.statics.getByFaculty = function(faculty) {
  return this.find({ faculty });
};

module.exports = mongoose.model('Project', projectSchema);