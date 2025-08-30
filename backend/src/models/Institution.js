const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  institutionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['University', 'College', 'Medical College', 'Engineering College', 'Business School', 'Arts College', 'Other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  grievanceOfficers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    department: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    allowAnonymousGrievances: {
      type: Boolean,
      default: true
    },
    autoAssignGrievances: {
      type: Boolean,
      default: false
    },
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB
    },
    maxFilesPerGrievance: {
      type: Number,
      default: 5
    },
    expectedResolutionDays: {
      type: Number,
      default: 15
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
institutionSchema.index({ institutionId: 1 });
institutionSchema.index({ name: 1 });

module.exports = mongoose.model('Institution', institutionSchema);