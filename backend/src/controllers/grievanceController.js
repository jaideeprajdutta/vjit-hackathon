const Grievance = require('../models/Grievance');
const User = require('../models/User');
const Institution = require('../models/Institution');
const database = require('../config/database');

class GrievanceController {
  // Create a new grievance
  async createGrievance(req, res) {
    try {
      const {
        title,
        description,
        category,
        priority,
        submitterName,
        submitterEmail,
        submitterRole,
        studentId,
        department,
        institutionId,
        institutionName,
        isAnonymous
      } = req.body;

      if (!title || !description || !category || !institutionId) {
        return res.status(400).json({
          error: 'Title, description, category, and institution are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Check if using MongoDB or fallback to in-memory
      if (database.isConnected) {
        const grievanceData = {
          title,
          description,
          category,
          priority: priority || 'Medium',
          isAnonymous: Boolean(isAnonymous),
          institutionId,
          institutionName,
          submittedBy: {
            name: isAnonymous ? 'Anonymous' : submitterName,
            email: isAnonymous ? null : submitterEmail,
            studentId: isAnonymous ? null : studentId,
            department: isAnonymous ? null : department
          },
          updates: [{
            status: 'Submitted',
            message: 'Your grievance has been submitted successfully and is awaiting review.',
            updatedBy: 'System',
            updatedByRole: 'System'
          }]
        };

        const grievance = new Grievance(grievanceData);
        await grievance.save();

        res.status(201).json({
          success: true,
          message: 'Grievance created successfully',
          grievance: {
            id: grievance._id,
            referenceId: grievance.referenceId,
            title: grievance.title,
            status: grievance.status,
            createdAt: grievance.createdAt
          }
        });
      } else {
        // Fallback to in-memory storage
        const grievanceData = {
          title,
          description,
          category,
          priority: priority || 'medium',
          submitterName: isAnonymous ? 'Anonymous' : submitterName,
          submitterEmail: isAnonymous ? null : submitterEmail,
          submitterRole: submitterRole || 'student',
          institutionId,
          isAnonymous: Boolean(isAnonymous),
          status: 'submitted'
        };

        const grievance = database.createGrievance(grievanceData);

        res.status(201).json({
          success: true,
          message: 'Grievance created successfully',
          grievance: {
            id: grievance.id,
            title: grievance.title,
            status: grievance.status,
            createdAt: grievance.createdAt
          }
        });
      }

    } catch (error) {
      console.error('Create grievance error:', error);
      res.status(500).json({
        error: 'Failed to create grievance',
        code: 'CREATE_FAILED'
      });
    }
  }

  // Get all grievances (for admin/officer dashboard)
  async getAllGrievances(req, res) {
    try {
      const { status, category, priority, institutionId, page = 1, limit = 10 } = req.query;

      if (database.isConnected) {
        // MongoDB query
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (institutionId) filter.institutionId = institutionId;

        const skip = (page - 1) * limit;
        const grievances = await Grievance.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate('submittedBy.userId', 'name email')
          .populate('assignedTo.userId', 'name email');

        const total = await Grievance.countDocuments(filter);

        res.json({
          grievances,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        });
      } else {
        // Fallback to in-memory storage
        let grievances = database.getAllGrievances();

        // Apply filters
        if (status) {
          grievances = grievances.filter(g => g.status === status);
        }
        if (category) {
          grievances = grievances.filter(g => g.category === category);
        }
        if (priority) {
          grievances = grievances.filter(g => g.priority === priority);
        }

        // Sort by creation date (newest first)
        grievances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedGrievances = grievances.slice(startIndex, endIndex);

        res.json({
          grievances: paginatedGrievances,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(grievances.length / limit),
            totalItems: grievances.length,
            itemsPerPage: parseInt(limit)
          }
        });
      }

    } catch (error) {
      console.error('Get all grievances error:', error);
      res.status(500).json({
        error: 'Failed to retrieve grievances',
        code: 'RETRIEVAL_FAILED'
      });
    }
  }

  // Get a specific grievance by ID
  async getGrievance(req, res) {
    try {
      const { id } = req.params;
      const grievance = database.getGrievance(id);

      if (!grievance) {
        return res.status(404).json({
          error: 'Grievance not found',
          code: 'GRIEVANCE_NOT_FOUND'
        });
      }

      // Get associated files
      const files = database.getFilesByGrievanceId(id);
      
      res.json({
        ...grievance,
        files: files.map(f => ({
          id: f.id,
          originalName: f.originalName,
          size: f.size,
          mimetype: f.mimetype,
          uploadDate: f.uploadDate
        }))
      });

    } catch (error) {
      console.error('Get grievance error:', error);
      res.status(500).json({
        error: 'Failed to retrieve grievance',
        code: 'RETRIEVAL_FAILED'
      });
    }
  }

  // Update grievance status
  async updateGrievanceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, assignedTo, comments } = req.body;

      const validStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed'];
      
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          code: 'INVALID_STATUS'
        });
      }

      const grievance = database.getGrievance(id);
      if (!grievance) {
        return res.status(404).json({
          error: 'Grievance not found',
          code: 'GRIEVANCE_NOT_FOUND'
        });
      }

      const updates = {};
      if (status) updates.status = status;
      if (assignedTo) updates.assignedTo = assignedTo;
      if (comments) {
        updates.comments = [...(grievance.comments || []), {
          text: comments,
          timestamp: new Date().toISOString(),
          author: 'System' // In real app, get from auth
        }];
      }

      const updatedGrievance = database.updateGrievance(id, updates);

      res.json({
        success: true,
        message: 'Grievance updated successfully',
        grievance: updatedGrievance
      });

    } catch (error) {
      console.error('Update grievance error:', error);
      res.status(500).json({
        error: 'Failed to update grievance',
        code: 'UPDATE_FAILED'
      });
    }
  }

  // Get grievance statistics
  async getStatistics(req, res) {
    try {
      const grievances = database.getAllGrievances();
      
      const stats = {
        total: grievances.length,
        byStatus: {},
        byCategory: {},
        byPriority: {},
        recent: grievances
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      };

      // Count by status
      grievances.forEach(g => {
        stats.byStatus[g.status] = (stats.byStatus[g.status] || 0) + 1;
        stats.byCategory[g.category] = (stats.byCategory[g.category] || 0) + 1;
        stats.byPriority[g.priority] = (stats.byPriority[g.priority] || 0) + 1;
      });

      res.json(stats);

    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve statistics',
        code: 'STATS_FAILED'
      });
    }
  }
}

module.exports = new GrievanceController();