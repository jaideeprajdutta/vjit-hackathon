import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowLeft, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const OfficerLogin = () => {
  const navigate = useNavigate();
  const { loginUser } = useAppContext();
  
  const [formData, setFormData] = useState({
    officerId: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.officerId.trim()) {
      newErrors.officerId = 'Officer ID is required';
    } else if (!/^(GO|GRO)[0-9]{3,6}$/i.test(formData.officerId.trim())) {
      newErrors.officerId = 'Please enter a valid officer ID (e.g., GO001, GRO123)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock authentication - in real app, this would be an API call
      const userData = {
        id: 'officer_' + formData.officerId.toLowerCase(),
        officerId: formData.officerId.toUpperCase(),
        role: 'officer',
        name: 'Grievance Officer', // This would come from API
        email: `${formData.officerId.toLowerCase()}@officer.edu`,
        department: 'Student Affairs', // This would come from API
        permissions: ['process_grievances', 'update_statuses', 'communicate', 'generate_reports'], // This would come from API
        isAuthenticated: true
      };
      
      loginUser(userData);
      navigate('/dashboard/officer');
    } catch (error) {
      setErrors({ submit: 'Invalid officer ID or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/role-select');
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 text-black hover:bg-[#CFFFE2] hover:text-black"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Role Selection
        </Button>

        {/* Login Card */}
        <Card className="card-elevated animate-fade-in">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#CFFFE2] to-[#A2D5C6] rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-black" />
            </div>
            <div>
              <CardTitle className="heading-md text-black">Grievance Officer Login</CardTitle>
              <CardDescription className="body-sm text-gray-600 mt-2">
                Access your officer dashboard to process and manage grievances
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Officer ID Field */}
              <div className="form-group">
                <Label htmlFor="officerId" className="form-label">
                  Officer ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="officerId"
                    name="officerId"
                    type="text"
                    placeholder="Enter your officer ID (e.g., GO001)"
                    value={formData.officerId}
                    onChange={handleInputChange}
                    className={`pl-10 form-input ${errors.officerId ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.officerId && (
                  <p className="text-red-500 text-sm mt-1">{errors.officerId}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <Label htmlFor="password" className="form-label">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 form-input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-black focus:ring-black border-[#A2D5C6] rounded"
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me for 30 days
                </Label>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Access Officer Dashboard'
                )}
              </Button>
            </form>

            {/* Help Links */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Need help?</p>
              <div className="flex justify-center space-x-4 text-sm">
                <a href="/forgot-password" className="text-black hover:text-[#A2D5C6] hover:underline">
                  Forgot Password?
                </a>
                <span className="text-gray-300">|</span>
                <a href="/officer-support" className="text-black hover:text-[#A2D5C6] hover:underline">
                  Officer Support
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Officer-specific Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Users className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-800 font-medium">Officer Responsibilities</p>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                As a grievance officer, you have access to process complaints, update statuses, 
                and communicate with users. Maintain confidentiality and handle all cases with care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerLogin;