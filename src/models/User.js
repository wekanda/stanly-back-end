const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// In-memory storage for when MongoDB is not available
let inMemoryUsers = [];
let userIdCounter = 1;

// Initialize with default users
const initializeDefaultUsers = async () => {
  if (!isMongoConnected() && inMemoryUsers.length === 0) {
    const bcrypt = require('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;

    const defaultUsers = [
      {
        name: 'Admin User',
        email: 'admin@mbalehub.com',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'admin',
        faculty: 'Administration',
        department: 'IT',
        isActive: true
      },
      {
        name: 'Supervisor User',
        email: 'supervisor@mbalehub.com',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'supervisor',
        faculty: 'Engineering',
        department: 'Computer Science',
        isActive: true
      },
      {
        name: 'Student User',
        email: 'student@mbalehub.com',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        faculty: 'Science',
        department: 'Mathematics',
        isActive: true
      }
    ];

    for (const userData of defaultUsers) {
      const user = {
        _id: userIdCounter++,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryUsers.push(user);
    }

    console.log('✅ Default users initialized for testing');
  }
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'supervisor', 'admin'],
    default: 'student'
  },
  faculty: {
    type: String,
    required: [true, 'Please add a faculty'],
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String // URL to profile picture
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return require('jsonwebtoken').sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Initialize default users when the module is loaded
initializeDefaultUsers();

module.exports = mongoose.model('User', userSchema);