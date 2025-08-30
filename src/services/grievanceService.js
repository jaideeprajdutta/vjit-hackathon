/**
 * Grievance Service for Grievance System
 * Handles grievance CRUD operations and status management
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class GrievanceService {
  /**
   * Create a new grievance
   * @param {Object} grievanceData - Grievance data
   */
  async createGrievance(grievanceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/grievances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grievanceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create grievance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to create grievance: ${error.message}`);
    }
  }

  /**
   * Get all grievances with optional filtering
   * @param {Object} filters - Filter options
   */
  async getAllGrievances(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${API_BASE_URL}/grievances${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch grievances');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch grievances: ${error.message}`);
    }
  }

  /**
   * Get a specific grievance by ID
   * @param {string} grievanceId - Grievance ID
   */
  async getGrievance(grievanceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/grievances/${grievanceId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch grievance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch grievance: ${error.message}`);
    }
  }

  /**
   * Update grievance status
   * @param {string} grievanceId - Grievance ID
   * @param {Object} updates - Status updates
   */
  async updateGrievanceStatus(grievanceId, updates) {
    try {
      const response = await fetch(`${API_BASE_URL}/grievances/${grievanceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update grievance');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to update grievance: ${error.message}`);
    }
  }

  /**
   * Get grievance statistics
   */
  async getStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/grievances/statistics`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch statistics');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch statistics: ${error.message}`);
    }
  }

  /**
   * Generate a unique reference ID for grievances
   */
  generateReferenceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `GRV-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Get status color for UI display
   * @param {string} status - Grievance status
   */
  getStatusColor(status) {
    const colors = {
      'submitted': 'blue',
      'under_review': 'yellow',
      'in_progress': 'orange',
      'resolved': 'green',
      'closed': 'gray'
    };
    return colors[status] || 'gray';
  }

  /**
   * Get status label for UI display
   * @param {string} status - Grievance status
   */
  getStatusLabel(status) {
    const labels = {
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed'
    };
    return labels[status] || status;
  }

  /**
   * Get priority color for UI display
   * @param {string} priority - Grievance priority
   */
  getPriorityColor(priority) {
    const colors = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red',
      'urgent': 'purple'
    };
    return colors[priority] || 'gray';
  }

  /**
   * Get category icon for UI display
   * @param {string} category - Grievance category
   */
  getCategoryIcon(category) {
    const icons = {
      'academic': '📚',
      'hostel': '🏠',
      'transport': '🚌',
      'library': '📖',
      'canteen': '🍽️',
      'sports': '⚽',
      'medical': '🏥',
      'administrative': '📋',
      'infrastructure': '🏗️',
      'other': '📝'
    };
    return icons[category] || '📝';
  }

  /**
   * Validate grievance data before submission
   * @param {Object} grievanceData - Grievance data to validate
   */
  validateGrievanceData(grievanceData) {
    const errors = [];

    if (!grievanceData.title || grievanceData.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!grievanceData.description || grievanceData.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    if (!grievanceData.category) {
      errors.push('Category is required');
    }

    if (!grievanceData.isAnonymous) {
      if (!grievanceData.submitterName || grievanceData.submitterName.trim().length < 2) {
        errors.push('Name is required for non-anonymous submissions');
      }

      if (!grievanceData.submitterEmail || !this.isValidEmail(grievanceData.submitterEmail)) {
        errors.push('Valid email is required for non-anonymous submissions');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

const grievanceService = new GrievanceService();
export default grievanceService;