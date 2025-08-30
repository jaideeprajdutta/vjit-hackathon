import { supabase } from '../lib/supabase'

/**
 * Comprehensive Authentication Service with Supabase Integration
 * Handles user registration, login, profile management, and role-based access
 */
class SupabaseAuthService {
  
  // =====================================================
  // AUTHENTICATION OPERATIONS
  // =====================================================

  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user profile
   */
  async signUp(userData) {
    try {
      const { email, password, role, institution_id } = userData

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            institution_id
          }
        }
      })

      if (authError) throw authError

      // Create user profile in our users table
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            role: role,
            institution_id: institution_id
          })
          .select(`
            *,
            institutions (
              id,
              name,
              short_name
            )
          `)
          .single()

        if (profileError) throw profileError

        // Log the registration event
        await this.logSystemEvent('user_login', {
          action: 'user_registered',
          user_id: authData.user.id,
          email: email,
          role: role
        })

        return { user: authData.user, profile }
      }

      return authData
    } catch (error) {
      console.error('Error during sign up:', error)
      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User session and profile
   */
  async signIn(email, password) {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      if (authData.user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select(`
            *,
            institutions (
              id,
              name,
              short_name
            )
          `)
          .eq('id', authData.user.id)
          .single()

        if (profileError) throw profileError

        // Log the login event
        await this.logSystemEvent('user_login', {
          action: 'user_login',
          user_id: authData.user.id,
          email: email
        })

        return { user: authData.user, profile, session: authData.session }
      }

      return authData
    } catch (error) {
      console.error('Error during sign in:', error)
      throw new Error(`Login failed: ${error.message}`)
    }
  }

  /**
   * Sign out user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error during sign out:', error)
      throw new Error(`Logout failed: ${error.message}`)
    }
  }

  /**
   * Get current session
   * @returns {Promise<Object>} Current session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      throw new Error(`Failed to get session: ${error.message}`)
    }
  }

  /**
   * Get current user with profile
   * @returns {Promise<Object>} Current user and profile
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!user) return null

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          institutions (
            id,
            name,
            short_name
          )
        `)
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      return { user, profile }
    } catch (error) {
      console.error('Error getting current user:', error)
      throw new Error(`Failed to get current user: ${error.message}`)
    }
  }

  // =====================================================
  // PROFILE MANAGEMENT
  // =====================================================

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          institutions (
            id,
            name,
            short_name
          )
        `)
        .single()

      if (error) throw error

      // Log the profile update
      await this.logSystemEvent('data_update', {
        action: 'profile_updated',
        user_id: userId,
        changes: updates
      })

      return profile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw new Error(`Failed to update profile: ${error.message}`)
    }
  }

  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Log the password update
      const user = await this.getCurrentUser()
      if (user) {
        await this.logSystemEvent('data_update', {
          action: 'password_updated',
          user_id: user.user.id
        })
      }
    } catch (error) {
      console.error('Error updating password:', error)
      throw new Error(`Failed to update password: ${error.message}`)
    }
  }

  /**
   * Reset password via email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
    } catch (error) {
      console.error('Error resetting password:', error)
      throw new Error(`Failed to reset password: ${error.message}`)
    }
  }

  // =====================================================
  // ROLE AND PERMISSION MANAGEMENT
  // =====================================================

  /**
   * Check if user has specific role
   * @param {string} requiredRole - Required role
   * @returns {Promise<boolean>} Has role
   */
  async hasRole(requiredRole) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return false

      return currentUser.profile.role === requiredRole
    } catch (error) {
      console.error('Error checking role:', error)
      return false
    }
  }

  /**
   * Check if user has any of the specified roles
   * @param {Array} requiredRoles - Array of required roles
   * @returns {Promise<boolean>} Has any of the roles
   */
  async hasAnyRole(requiredRoles) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return false

      return requiredRoles.includes(currentUser.profile.role)
    } catch (error) {
      console.error('Error checking roles:', error)
      return false
    }
  }

  /**
   * Get user's institution
   * @returns {Promise<Object>} User's institution
   */
  async getUserInstitution() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return null

      return currentUser.profile.institutions
    } catch (error) {
      console.error('Error getting user institution:', error)
      return null
    }
  }

  // =====================================================
  // INSTITUTION AND DEPARTMENT MANAGEMENT
  // =====================================================

  /**
   * Get all institutions
   * @returns {Promise<Array>} List of institutions
   */
  async getInstitutions() {
    try {
      const { data: institutions, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name')

      if (error) throw error
      return institutions
    } catch (error) {
      console.error('Error fetching institutions:', error)
      throw new Error(`Failed to fetch institutions: ${error.message}`)
    }
  }

  /**
   * Get departments for an institution
   * @param {string} institutionId - Institution ID
   * @returns {Promise<Array>} List of departments
   */
  async getDepartments(institutionId) {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .eq('institution_id', institutionId)
        .order('name')

      if (error) throw error
      return departments
    } catch (error) {
      console.error('Error fetching departments:', error)
      throw new Error(`Failed to fetch departments: ${error.message}`)
    }
  }

  /**
   * Get grievance categories
   * @returns {Promise<Array>} List of grievance categories
   */
  async getGrievanceCategories() {
    try {
      const { data: categories, error } = await supabase
        .from('grievance_categories')
        .select('*')
        .order('name')

      if (error) throw error
      return categories
    } catch (error) {
      console.error('Error fetching grievance categories:', error)
      throw new Error(`Failed to fetch grievance categories: ${error.message}`)
    }
  }

  // =====================================================
  // USER MANAGEMENT (ADMIN ONLY)
  // =====================================================

  /**
   * Get all users for an institution (Admin only)
   * @param {string} institutionId - Institution ID
   * @returns {Promise<Array>} List of users
   */
  async getInstitutionUsers(institutionId) {
    try {
      // Check if current user is admin
      const isAdmin = await this.hasAnyRole(['admin', 'super_admin'])
      if (!isAdmin) {
        throw new Error('Insufficient permissions')
      }

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          institutions (
            id,
            name,
            short_name
          )
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return users
    } catch (error) {
      console.error('Error fetching institution users:', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
  }

  /**
   * Update user role (Admin only)
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   * @returns {Promise<Object>} Updated user
   */
  async updateUserRole(userId, newRole) {
    try {
      // Check if current user is admin
      const isAdmin = await this.hasAnyRole(['admin', 'super_admin'])
      if (!isAdmin) {
        throw new Error('Insufficient permissions')
      }

      const { data: user, error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .select(`
          *,
          institutions (
            id,
            name,
            short_name
          )
        `)
        .single()

      if (error) throw error

      // Log the role update
      await this.logSystemEvent('data_update', {
        action: 'user_role_updated',
        target_user_id: userId,
        new_role: newRole
      })

      return user
    } catch (error) {
      console.error('Error updating user role:', error)
      throw new Error(`Failed to update user role: ${error.message}`)
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
      const currentUser = await this.getCurrentUser()
      
      const { data: log, error } = await supabase
        .from('system_logs')
        .insert({
          user_id: currentUser?.user?.id || null,
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
   * Check if user is authenticated
   * @returns {Promise<boolean>} Is authenticated
   */
  async isAuthenticated() {
    try {
      const session = await this.getCurrentSession()
      return !!session
    } catch (error) {
      return false
    }
  }

  /**
   * Get user's display name
   * @returns {Promise<string>} Display name
   */
  async getUserDisplayName() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return 'Unknown User'

      return currentUser.user.email || 'Unknown User'
    } catch (error) {
      return 'Unknown User'
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const errors = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Create and export singleton instance
const supabaseAuthService = new SupabaseAuthService()
export default supabaseAuthService
