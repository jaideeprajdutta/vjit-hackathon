const User = require('../models/User');
const Institution = require('../models/Institution');
const database = require('../config/database');

class UserController {
  // Create or login user (simplified for demo)
  async loginUser(req, res) {
    try {
      const {
        name,
        email,
        institutionId,
        institutionName,
        role,
        studentId,
        department,
        phoneNumber
      } = req.body;

      if (!name || !email || !institutionId || !role) {
        return res.status(400).json({
          error: 'Name, email, institution, and role are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      if (database.isConnected) {
        // MongoDB operations
        let user = await User.findOne({ email, institutionId });

        if (!user) {
          // Create new user
          user = new User({
            name,
            email,
            institutionId,
            institutionName,
            role,
            studentId,
            department,
            phoneNumber
          });
          await user.save();
        } else {
          // Update existing user
          user.name = name;
          user.role = role;
          user.studentId = studentId;
          user.department = department;
          user.phoneNumber = phoneNumber;
          await user.save();
        }

        res.json({
          success: true,
          message: 'User authenticated successfully',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            institutionId: user.institutionId,
            institutionName: user.institutionName,
            studentId: user.studentId,
            department: user.department
          }
        });
      } else {
        // Fallback to in-memory storage
        const userData = {
          name,
          email,
          institutionId,
          institutionName,
          role,
          studentId,
          department,
          phoneNumber
        };

        const user = database.createUser ? database.createUser(userData) : {
          id: database.generateId(),
          ...userData,
          createdAt: new Date().toISOString()
        };

        res.json({
          success: true,
          message: 'User authenticated successfully',
          user
        });
      }

    } catch (error) {
      console.error('Login user error:', error);
      res.status(500).json({
        error: 'Failed to authenticate user',
        code: 'AUTH_FAILED'
      });
    }
  }

  // Get user profile
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;

      if (database.isConnected) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            institutionId: user.institutionId,
            institutionName: user.institutionName,
            studentId: user.studentId,
            department: user.department,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt
          }
        });
      } else {
        // Fallback implementation
        res.status(501).json({
          error: 'User profile not available in fallback mode',
          code: 'NOT_IMPLEMENTED'
        });
      }

    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: 'Failed to retrieve user profile',
        code: 'PROFILE_FAILED'
      });
    }
  }

  // Get institutions list
  async getInstitutions(req, res) {
    try {
      if (database.isConnected) {
        const institutions = await Institution.find({ isActive: true })
          .select('institutionId name type address.city address.state')
          .sort({ name: 1 });

        res.json({
          institutions: institutions.map(inst => ({
            id: inst.institutionId,
            name: inst.name,
            type: inst.type,
            city: inst.address?.city,
            state: inst.address?.state
          }))
        });
      } else {
        // Fallback to mock data
        const mockInstitutions = [
          { id: 'inst_1', name: 'University of Technology', type: 'University' },
          { id: 'inst_2', name: 'City Medical College', type: 'Medical College' },
          { id: 'inst_3', name: 'Regional Engineering Institute', type: 'Engineering College' },
          { id: 'inst_4', name: 'State Business School', type: 'Business School' },
          { id: 'inst_5', name: 'Government Arts College', type: 'Arts College' }
        ];

        res.json({ institutions: mockInstitutions });
      }

    } catch (error) {
      console.error('Get institutions error:', error);
      res.status(500).json({
        error: 'Failed to retrieve institutions',
        code: 'INSTITUTIONS_FAILED'
      });
    }
  }
}

module.exports = new UserController();