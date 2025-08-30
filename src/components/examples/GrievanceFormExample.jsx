import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabaseGrievanceService from '../../services/supabaseGrievanceService'
import supabaseAuthService from '../../services/supabaseAuthService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

/**
 * Example Component: Grievance Form with File Upload
 * Demonstrates how to create a grievance with file attachments using Supabase
 */
const GrievanceFormExample = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    department_id: '',
    assigned_to: ''
  })
  
  // File upload
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Dropdown data
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    initializeForm()
  }, [])

  const initializeForm = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const user = await supabaseAuthService.getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUser(user)

      // Load form data
      const [categoriesData, departmentsData, usersData] = await Promise.all([
        supabaseAuthService.getGrievanceCategories(),
        supabaseAuthService.getDepartments(user.profile.institution_id),
        supabaseAuthService.getInstitutionUsers(user.profile.institution_id)
      ])

      setCategories(categoriesData)
      setDepartments(departmentsData)
      setUsers(usersData)
      
    } catch (error) {
      setError(`Failed to initialize form: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const validation = supabaseGrievanceService.validateFile(file)
      if (!validation.valid) {
        setError(validation.error)
        return false
      }
      return true
    })

    setFiles(validFiles)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // Validate form data
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required')
      }
      if (!formData.category_id) {
        throw new Error('Category is required')
      }

      // Prepare grievance data
      const grievanceData = {
        ...formData,
        institution_id: currentUser.profile.institution_id
      }

      // Create grievance with files
      const result = await supabaseGrievanceService.createGrievance(grievanceData, files)
      
      setSuccess(`Grievance created successfully! ID: ${result.id}`)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category_id: '',
        priority: 'medium',
        department_id: '',
        assigned_to: ''
      })
      setFiles([])
      
      // Navigate to grievance details
      setTimeout(() => {
        navigate(`/grievances/${result.id}`)
      }, 2000)
      
    } catch (error) {
      setError(`Failed to create grievance: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Grievance</CardTitle>
          <CardDescription>
            Create a new grievance with file attachments
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter grievance title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your grievance in detail"
                rows={4}
                required
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department and Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => handleInputChange('department_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => handleInputChange('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                className="mb-2"
              />
              <p className="text-sm text-gray-500">
                Supported formats: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX (Max 10MB each)
              </p>
              
              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Selected Files:</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {supabaseGrievanceService.formatFileSize(file.size)}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Submit Grievance'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default GrievanceFormExample
