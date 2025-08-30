const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grievance_system';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');
      
      // Create initial data if needed
      await this.seedInitialData();
      
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      // Fall back to in-memory storage for development
      console.log('📝 Falling back to in-memory storage...');
      this.initInMemoryStorage();
    }
  }

  async seedInitialData() {
    const Institution = require('../models/Institution');
    const User = require('../models/User');

    // Check if institutions already exist
    const existingInstitutions = await Institution.countDocuments();
    if (existingInstitutions === 0) {
      console.log('🌱 Seeding initial institutions...');
      
      const institutions = [
        {
          institutionId: 'inst_1',
          name: 'University of Technology',
          type: 'University',
          address: {
            city: 'Tech City',
            state: 'Maharashtra',
            country: 'India'
          },
          contactInfo: {
            email: 'grievance@techuni.edu',
            phone: '+91-9876543210'
          }
        },
        {
          institutionId: 'inst_2',
          name: 'City Medical College',
          type: 'Medical College',
          address: {
            city: 'Medical City',
            state: 'Karnataka',
            country: 'India'
          },
          contactInfo: {
            email: 'grievance@citymedical.edu',
            phone: '+91-9876543211'
          }
        },
        {
          institutionId: 'inst_3',
          name: 'Regional Engineering Institute',
          type: 'Engineering College',
          address: {
            city: 'Engineering Hub',
            state: 'Tamil Nadu',
            country: 'India'
          },
          contactInfo: {
            email: 'grievance@rei.edu',
            phone: '+91-9876543212'
          }
        }
      ];

      await Institution.insertMany(institutions);
      console.log('✅ Initial institutions seeded');
    }
  }

  initInMemoryStorage() {
    // Fallback in-memory storage
    this.grievances = new Map();
    this.fileMetadata = new Map();
    this.users = new Map();
    this.notifications = new Map();
    this.isConnected = false;
  }

  // Legacy methods for backward compatibility (in-memory fallback)
  createGrievance(grievanceData) {
    if (!this.isConnected) {
      const id = this.generateId();
      const grievance = {
        id,
        ...grievanceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'submitted',
        files: []
      };
      this.grievances.set(id, grievance);
      return grievance;
    }
    // For MongoDB, this should be handled by controllers
    throw new Error('Use Grievance model for MongoDB operations');
  }

  getGrievance(id) {
    if (!this.isConnected) {
      return this.grievances.get(id);
    }
    throw new Error('Use Grievance model for MongoDB operations');
  }

  updateGrievance(id, updates) {
    if (!this.isConnected) {
      const grievance = this.grievances.get(id);
      if (grievance) {
        const updated = {
          ...grievance,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.grievances.set(id, updated);
        return updated;
      }
      return null;
    }
    throw new Error('Use Grievance model for MongoDB operations');
  }

  getAllGrievances() {
    if (!this.isConnected) {
      return Array.from(this.grievances.values());
    }
    throw new Error('Use Grievance model for MongoDB operations');
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

module.exports = new Database();