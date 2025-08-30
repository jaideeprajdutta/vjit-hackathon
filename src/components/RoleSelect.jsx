import React, { useState } from 'react';
import { User, GraduationCap, Shield, Settings, ArrowLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const RoleSelect = () => {
  const navigate = useNavigate();
  const { state, selectRole } = useAppContext();
  const { roles, user } = state;
  
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [error, setError] = useState('');

  const steps = ['Select Institution', 'Select Role', 'Dashboard'];

  const roleIcons = {
    'Student': GraduationCap,
    'Faculty': User,
    'Admin': Settings,
    'Grievance Officer': Shield,
  };

  const roleDescriptions = {
    'Student': 'Submit grievances, track status, and access student-specific features',
    'Faculty': 'Submit grievances, view department issues, and access faculty resources',
    'Admin': 'Manage all grievances, generate reports, and oversee system operations',
    'Grievance Officer': 'Process grievances, update statuses, and communicate with users',
  };

  const handleNext = () => {
    if (!selectedRoleId) {
      setError('Please select a role to continue');
      return;
    }

    const selectedRole = roles.find(role => role.id === selectedRoleId);
    selectRole(selectedRole);
    
    // Navigate to appropriate login page based on role
    const roleLoginMap = {
      'Student': '/login/student',
      'Faculty': '/login/faculty',
      'Admin': '/login/admin',
      'Grievance Officer': '/login/officer',
    };
    
    navigate(roleLoginMap[selectedRole.name]);
  };

  const handleBack = () => {
    navigate('/institution-select');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index === 1 ? 'bg-black text-white border-black' : 
                index < 1 ? 'bg-black text-white border-black' : 'border-[#A2D5C6] text-[#A2D5C6]'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                index <= 1 ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < 1 ? 'bg-black' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-4">
              Select Your Role
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your role to access the appropriate features and permissions.
            </p>
            {user.selectedInstitution && (
              <p className="text-sm text-muted-foreground mt-2">
                Institution: <span className="font-medium">{user.selectedInstitution.name}</span>
              </p>
            )}
          </div>

          {/* Role Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-black">Step 2: Select Your Role</CardTitle>
              <CardDescription>
                Choose your role to access the grievance system with appropriate permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const IconComponent = roleIcons[role.name] || User;
                  const isSelected = selectedRoleId === role.id;
                  
                  return (
                    <Card
                      key={role.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? 'border-black bg-black/5 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedRoleId(role.id);
                        setError('');
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-black mb-2">{role.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              {roleDescriptions[role.name] || role.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {error && (
                <div className="bg-destructive/15 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-black hover:bg-[#CFFFE2] hover:text-black"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedRoleId}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelect;
