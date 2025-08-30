import { supabase, getCurrentUser } from '../lib/supabase'

/**
 * Comprehensive Grievance Service with Supabase Integration
 * Handles all CRUD operations, file uploads, notifications, and status updates
 */
class SupabaseGrievanceService {
  
  // =====================================================
  // GRIEVANCE CRUD OPERATIONS
  // =====================================================

  /**
   * Create a new grievance with file attachments
   * @param {Object} grievanceData - Grievance data
   * @param {File[]} files - Optional files to upload
   * @returns {Promise<Object>} Created grievance with attachments
   */
  async createGrievance(grievanceData, files = []) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Start a transaction
      const { data: grievance, error: grievanceError } = await supabase
        .from('grievances')
        .insert({
          ...grievanceData,
          created_by: user.id
        })
        .select()
        .single()

      if (grievanceError) throw grievanceError

      // Upload files if provided
      const attachments = []
      if (files.length > 0) {
        for (const file of files) {
          const attachment = await this.uploadFile(file, grievance.id, user.id)
          attachments.push(attachment)
        }
      }

      // Create initial status update
      await this.createGrievanceUpdate(grievance.id, {
        status_change: 'Grievance submitted',
        comments: 'Grievance has been successfully submitted and is under review.'
      })

      // Send notification to assigned user if any
      if (grievanceData.assigned_to) {
        await this.createNotification(grievanceData.assigned_to, grievance.id, 
          `New grievance assigned: ${grievanceData.title}`)
      }

      // Log the event
      await this.logSystemEvent('data_update', {
        action: 'grievance_created',
        grievance_id: grievance.id,
        title: grievanceData.title
      })

      return { ...grievance, attachments }
    } catch (error) {
      console.error('Error creating grievance:', error)
      throw new Error(`Failed to create grievance: ${error.message}`)
    }
  }

  /**
   * Get grievances with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Grievances with metadata
   */
  async getGrievances(filters = {}, page = 1, limit = 10) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from('grievances')
        .select(`
          *,
          created_by_user:users!grievances_created_by_fkey(id, email),
          assigned_to_user:users!grievances_assigned_to_fkey(id, email),
          category:grievance_categories(name, description),
          department:departments(name),
          institution:institutions(name, short_name),
          file_attachments(id, file_name, file_path),
          grievance_updates(
            id,
            status_change,
            comments,
            created_at,
            updated_by_user:users(id, email)
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (filters.institution_id) {
        query = query.eq('institution_id', filters.institution_id)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false })

      const { data: grievances, error, count } = await query

      if (error) throw error

      return {
        grievances,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Error fetching grievances:', error)
      throw new Error(`Failed to fetch grievances: ${error.message}`)
    }
  }

  /**
   * Get a specific grievance by ID
   * @param {string} grievanceId - Grievance ID
   * @returns {Promise<Object>} Grievance with all related data
   */
  async getGrievance(grievanceId) {
    try {
      const { data: grievance, error } = await supabase
        .from('grievances')
        .select(`
          *,
          created_by_user:users!grievances_created_by_fkey(id, email),
          assigned_to_user:users!grievances_assigned_to_fkey(id, email),
          category:grievance_categories(name, description),
          department:departments(name),
          institution:institutions(name, short_name),
          file_attachments(id, file_name, file_path, uploaded_at),
          grievance_updates(
            id,
            status_change,
            comments,
            created_at,
            updated_by_user:users(id, email)
          )
        `)
        .eq('id', grievanceId)
        .single()

      if (error) throw error
      return grievance
    } catch (error) {
      console.error('Error fetching grievance:', error)
      throw new Error(`Failed to fetch grievance: ${error.message}`)
    }
  }

  /**
   * Update grievance status and create update record
   * @param {string} grievanceId - Grievance ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated grievance
   */
  async updateGrievanceStatus(grievanceId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Update grievance
      const { data: grievance, error: grievanceError } = await supabase
        .from('grievances')
        .update(updates)
        .eq('id', grievanceId)
        .select()
        .single()

      if (grievanceError) throw grievanceError

      // Create update record
      await this.createGrievanceUpdate(grievanceId, {
        status_change: updates.status ? `Status changed to: ${updates.status}` : 'Grievance updated',
        comments: updates.comments || 'Grievance has been updated'
      })

      // Send notification to grievance creator
      await this.createNotification(grievance.created_by, grievanceId,
        `Your grievance "${grievance.title}" has been updated to status: ${updates.status || 'updated'}`)

      // Log the event
      await this.logSystemEvent('data_update', {
        action: 'grievance_updated',
        grievance_id: grievanceId,
        updated_by: user.id,
        changes: updates
      })

      return grievance
    } catch (error) {
      console.error('Error updating grievance:', error)
      throw new Error(`Failed to update grievance: ${error.message}`)
    }
  }

  // =====================================================
  // FILE UPLOAD OPERATIONS
  // =====================================================

  /**
   * Upload a file for a grievance
   * @param {File} file - File to upload
   * @param {string} grievanceId - Grievance ID
   * @param {string} userId - User ID who uploaded the file
   * @returns {Promise<Object>} File attachment record
   */
  async uploadFile(file, grievanceId, userId) {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${grievanceId}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('grievance-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Create file attachment record
      const { data: attachment, error: attachmentError } = await supabase
        .from('file_attachments')
        .insert({
          grievance_id: grievanceId,
          file_path: filePath,
          file_name: file.name,
          uploaded_by: userId
        })
        .select()
        .single()

      if (attachmentError) throw attachmentError

      return attachment
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  /**
   * Get file download URL
   * @param {string} filePath - File path in storage
   * @returns {Promise<string>} Download URL
   */
  async getFileDownloadUrl(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from('grievance-attachments')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error getting download URL:', error)
      throw new Error(`Failed to get download URL: ${error.message}`)
    }
  }

  /**
   * Delete a file attachment
   * @param {string} attachmentId - Attachment ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(attachmentId) {
    try {
      // Get attachment details
      const { data: attachment, error: fetchError } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('id', attachmentId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('grievance-attachments')
        .remove([attachment.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) throw dbError

      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  // =====================================================
  // GRIEVANCE UPDATES
  // =====================================================

  /**
   * Create a grievance update record
   * @param {string} grievanceId - Grievance ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Created update record
   */
  async createGrievanceUpdate(grievanceId, updateData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data: update, error } = await supabase
        .from('grievance_updates')
        .insert({
          grievance_id: grievanceId,
          updated_by: user.id,
          status_change: updateData.status_change,
          comments: updateData.comments
        })
        .select(`
          *,
          updated_by_user:users(id, email)
        `)
        .single()

      if (error) throw error
      return update
    } catch (error) {
      console.error('Error creating grievance update:', error)
      throw new Error(`Failed to create grievance update: ${error.message}`)
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  /**
   * Create a notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} grievanceId - Related grievance ID
   * @param {string} message - Notification message
   * @returns {Promise<Object>} Created notification
   */
  async createNotification(recipientId, grievanceId, message) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          grievance_id: grievanceId,
          message: message
        })
        .select()
        .single()

      if (error) throw error
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw new Error(`Failed to create notification: ${error.message}`)
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {boolean} unreadOnly - Get only unread notifications
   * @returns {Promise<Array>} Notifications
   */
  async getNotifications(userId, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          grievance:grievances(title, status)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data: notifications, error } = await query

      if (error) throw error
      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) throw error
      return notification
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  // =====================================================
  // SYSTEM LOGGING
  // =====================================================

  /**
   * Log system events
   * @param {string} eventType - Event type
   * @param {Object} details - Event details
   * @returns {Promise<Object>} Log record
   */
  async logSystemEvent(eventType, details) {
    try {
      const user = await getCurrentUser()
      
      const { data: log, error } = await supabase
        .from('system_logs')
        .insert({
          user_id: user?.id || null,
          event_type: eventType,
          details: details
        })
        .select()
        .single()

      if (error) throw error
      return log
    } catch (error) {
      console.error('Error logging system event:', error)
      // Don't throw error for logging failures
      return null
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile(file) {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, PDF, TXT, DOC, and DOCX files are allowed.'
      }
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Maximum size is 10MB.'
      }
    }

    return { valid: true }
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get status color for UI display
   * @param {string} status - Grievance status
   * @returns {string} Color class
   */
  getStatusColor(status) {
    const colors = {
      'submitted': 'blue',
      'in_progress': 'orange',
      'closed': 'green',
      'breached': 'red'
    }
    return colors[status] || 'gray'
  }

  /**
   * Get priority color for UI display
   * @param {string} priority - Grievance priority
   * @returns {string} Color class
   */
  getPriorityColor(priority) {
    const colors = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red'
    }
    return colors[priority] || 'gray'
  }
}

// Create and export singleton instance
const supabaseGrievanceService = new SupabaseGrievanceService()
export default supabaseGrievanceService
