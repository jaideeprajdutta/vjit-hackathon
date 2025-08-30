const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected']
  },
  message: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    required: true
  },
  updatedByRole: {
    type: String,
    enum: ['System', 'Student', 'Faculty', 'Admin', 'Grievance Officer']
  }
}, {
  timestamps: true
});

const grievanceSchema = new mongoose.Schema({
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Academic Issues',
      'Hostel/Accommodation', 
      'Harassment/Discrimination',
      'Fee/Financial Issues',
      'Infrastructure Problems',
      'Administrative Issues',
      'Other'
    ]
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    default: 'Submitted'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  submittedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    studentId: String,
    department: String
  },
  institutionId: {
    type: String,
    required: true
  },
  institutionName: {
    type: String,
    required: true
  },
  assignedTo: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: String
  },
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  updates: [updateSchema],
  tags: [String],
  expectedResolutionDate: Date,
  actualResolutionDate: Date,
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String
}, {
  timestamps: true
});

// Indexes for better query performance
grievanceSchema.index({ referenceId: 1 });
grievanceSchema.index({ 'submittedBy.userId': 1 });
grievanceSchema.index({ institutionId: 1, status: 1 });
grievanceSchema.index({ category: 1, status: 1 });
grievanceSchema.index({ createdAt: -1 });

// Generate reference ID before saving
grievanceSchema.pre('save', function(next) {
  if (!this.referenceId) {
    this.referenceId = `GRV${Date.now().toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model('Grievance', grievanceSchema);