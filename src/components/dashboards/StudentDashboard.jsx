import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  UserX, 
  Plus, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const { user } = state;

  // Mock data - in real app, this would come from API
  const recentGrievances = [
    {
      id: 'GRV001',
      title: 'Library Access Issue',
      status: 'in-progress',
      submittedDate: '2024-01-15',
      category: 'Infrastructure'
    },
    {
      id: 'GRV002',
      title: 'Hostel Maintenance',
      status: 'resolved',
      submittedDate: '2024-01-10',
      category: 'Accommodation'
    }
  ];

  const quickActions = [
    {
      title: 'Academic Issues',
      description: 'Report problems with courses, exams, or faculty',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-blue-500',
      action: () => navigate('/grievance/submit?category=academic')
    },
    {
      title: 'Hostel/Accommodation',
      description: 'Issues with hostel facilities or services',
      icon: <AlertCircle className="h-6 w-6" />,
      color: 'bg-orange-500',
      action: () => navigate('/grievance/submit?category=hostel')
    },
    {
      title: 'Harassment/Discrimination',
      description: 'Report any form of harassment or discrimination',
      icon: <UserX className="h-6 w-6" />,
      color: 'bg-red-500',
      action: () => navigate('/grievance/submit?category=harassment')
    }
  ];

  const dashboardStats = [
    {
      title: 'Total Submissions',
      value: '3',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Review',
      value: '1',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-600'
    },
    {
      title: 'Resolved',
      value: '2',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-600'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="status-pending">Pending</Badge>;
      case 'in-progress':
        return <Badge className="status-in-progress">In Progress</Badge>;
      case 'resolved':
        return <Badge className="status-resolved">Resolved</Badge>;
      case 'closed':
        return <Badge className="status-closed">Closed</Badge>;
      default:
        return <Badge className="status-pending">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="heading-lg text-black">
          Welcome back, {user.name || 'Student'}
        </h1>
        <p className="body-md text-gray-600">
          Your student dashboard for managing grievances and feedback
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-black mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit New Grievance */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CFFFE2] rounded-lg">
                <Plus className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-xl text-black">Submit New Grievance</CardTitle>
                <CardDescription>Report issues or concerns</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Submit a detailed grievance with supporting documents for proper resolution.
            </p>
            <Button 
              onClick={() => navigate('/grievance/submit')}
              className="w-full btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Grievance
            </Button>
          </CardContent>
        </Card>

        {/* Track Status */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#A2D5C6] rounded-lg">
                <Search className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-xl text-black">Track My Submissions</CardTitle>
                <CardDescription>Monitor grievance progress</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Check the status and updates of your submitted grievances using reference ID.
            </p>
            <Button 
              onClick={() => navigate('/grievance/track')}
              className="w-full btn-secondary"
            >
              <Search className="h-4 w-4 mr-2" />
              Track Status
            </Button>
          </CardContent>
        </Card>

        {/* Anonymous Feedback */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#CFFFE2] rounded-lg">
                <UserX className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="text-xl text-black">Anonymous Feedback</CardTitle>
                <CardDescription>Submit feedback without revealing identity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Share concerns anonymously while maintaining complete confidentiality.
            </p>
            <Button 
              onClick={() => navigate('/grievance/submit?anonymous=true')}
              className="w-full btn-outline"
            >
              <UserX className="h-4 w-4 mr-2" />
              Submit Anonymously
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="text-xl text-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common grievance categories for faster submission
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="p-4 border border-[#A2D5C6]/20 rounded-lg hover:border-[#A2D5C6] hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-black group-hover:text-[#A2D5C6] transition-colors duration-200">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-black">Recent Submissions</CardTitle>
              <CardDescription>Your latest grievance submissions</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/grievance/track')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentGrievances.length > 0 ? (
            <div className="space-y-4">
              {recentGrievances.map((grievance) => (
                <div
                  key={grievance.id}
                  className="flex items-center justify-between p-4 border border-[#A2D5C6]/20 rounded-lg hover:border-[#A2D5C6] hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-black">{grievance.title}</h4>
                      {getStatusBadge(grievance.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>ID: {grievance.id}</span>
                      <span>Category: {grievance.category}</span>
                      <span>Submitted: {new Date(grievance.submittedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/grievance/track?id=${grievance.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No grievances submitted yet</p>
              <Button onClick={() => navigate('/grievance/submit')}>
                Submit Your First Grievance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="card-professional bg-[#CFFFE2]/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#CFFFE2] rounded-lg">
              <AlertCircle className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-black mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                If you're unsure about the grievance process or need assistance, our support team is here to help.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  View Guidelines
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;