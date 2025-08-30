const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  institutionId: {
    type: String,
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Student', 'Faculty', 'Admin', 'Grievance Officer']
  },
  studentId: {
    type: String,
    sparse: true // Only for students
  },
  department: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ institutionId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);