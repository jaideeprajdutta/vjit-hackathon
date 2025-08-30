import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabaseGrievanceService from '../../services/supabaseGrievanceService'
import supabaseAuthService from '../../services/supabaseAuthService'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Download, Eye, Edit, Trash2, Filter, RefreshCw } from 'lucide-react'

/**
 * Example Component: Grievance List with Filtering and Pagination
 * Demonstrates how to fetch, filter, and display grievances using Supabase
 */
const GrievanceListExample = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Data
  const [grievances, setGrievances] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category_id: '',
    search: ''
  })
  
  // Dropdown data
  const [categories, setCategories] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    initializeComponent()
  }, [])

  useEffect(() => {
    fetchGrievances()
  }, [filters, pagination.page])

  const initializeComponent = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const user = await supabaseAuthService.getCurrentUser()
      if (!user) {
        navigate('/login')
        return
      }
      setCurrentUser(user)

      // Load categories for filter
      const categoriesData = await supabaseAuthService.getGrievanceCategories()
      setCategories(categoriesData)
      
    } catch (error) {
      setError(`Failed to initialize: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrievances = async () => {
    try {
      setLoading(true)
      setError('')

      // Prepare filters
      const activeFilters = {}
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          activeFilters[key] = filters[key]
        }
      })

      // Add user-specific filters based on role
      if (currentUser?.profile?.role === 'student') {
        activeFilters.created_by = currentUser.user.id
      } else if (currentUser?.profile?.role === 'faculty') {
        activeFilters.assigned_to = currentUser.user.id
      }

      const result = await supabaseGrievanceService.getGrievances(
        activeFilters,
        pagination.page,
        pagination.limit
      )

      setGrievances(result.grievances)
      setPagination(result.pagination)
      
    } catch (error) {
      setError(`Failed to fetch grievances: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleStatusUpdate = async (grievanceId, newStatus) => {
    try {
      setLoading(true)
      
      await supabaseGrievanceService.updateGrievanceStatus(grievanceId, {
        status: newStatus
      })
      
      // Refresh the list
      await fetchGrievances()
      
    } catch (error) {
      setError(`Failed to update status: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileDownload = async (filePath, fileName) => {
    try {
      const downloadUrl = await supabaseGrievanceService.getFileDownloadUrl(filePath)
      
      // Create temporary link and trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      setError(`Failed to download file: ${error.message}`)
    }
  }

  const getStatusColor = (status) => {
    return supabaseGrievanceService.getStatusColor(status)
  }

  const getPriorityColor = (priority) => {
    return supabaseGrievanceService.getPriorityColor(priority)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
    <div className="max-w-7xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Grievances</CardTitle>
              <CardDescription>
                Manage and track grievance submissions
              </CardDescription>
            </div>
            <Button onClick={() => navigate('/grievances/new')}>
              New Grievance
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  placeholder="Search by title..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="breached">Breached</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  value={filters.category_id}
                  onValueChange={(value) => handleFilterChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={fetchGrievances}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Grievances List */}
          <div className="space-y-4">
            {grievances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No grievances found</p>
              </div>
            ) : (
              grievances.map(grievance => (
                <Card key={grievance.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{grievance.title}</h3>
                          <Badge variant={getStatusColor(grievance.status)}>
                            {grievance.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getPriorityColor(grievance.priority)}>
                            {grievance.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {grievance.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Category:</span> {grievance.category?.name}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(grievance.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Created by:</span> {grievance.created_by_user?.email}
                          </div>
                          <div>
                            <span className="font-medium">Assigned to:</span> {grievance.assigned_to_user?.email || 'Unassigned'}
                          </div>
                        </div>

                        {/* File Attachments */}
                        {grievance.file_attachments && grievance.file_attachments.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                            <div className="flex flex-wrap gap-2">
                              {grievance.file_attachments.map(attachment => (
                                <Button
                                  key={attachment.id}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFileDownload(attachment.file_path, attachment.file_name)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {attachment.file_name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/grievances/${grievance.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        
                        {(currentUser?.profile?.role === 'admin' || 
                          currentUser?.profile?.role === 'faculty' ||
                          grievance.created_by === currentUser?.user?.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/grievances/${grievance.id}/edit`)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}

                        {/* Status Update Dropdown for Admins/Faculty */}
                        {(currentUser?.profile?.role === 'admin' || 
                          currentUser?.profile?.role === 'faculty') && (
                          <Select
                            value={grievance.status}
                            onValueChange={(value) => handleStatusUpdate(grievance.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                              <SelectItem value="breached">Breached</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} grievances
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GrievanceListExample
