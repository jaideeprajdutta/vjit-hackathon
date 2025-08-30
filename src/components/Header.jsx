import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Home } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Button } from './ui/button';

const Header = () => {
  const navigate = useNavigate();
  const { state, logoutUser } = useAppContext();
  const { user } = state;

  const handleLogout = () => {
    logoutUser();
    navigate('/institution-select');
  };

  const handleLogoClick = () => {
    if (user?.isAuthenticated && user?.selectedRole) {
      // Navigate to appropriate dashboard based on role
      const roleMap = {
        'Student': '/dashboard/student',
        'Faculty': '/dashboard/faculty', 
        'Admin': '/dashboard/admin',
        'Grievance Officer': '/dashboard/officer'
      };
      navigate(roleMap[user.selectedRole.name] || '/institution-select');
    } else {
      navigate('/institution-select');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-[#A2D5C6]/20 relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 bg-[#A2D5C6] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">GS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">Grievance System</h1>
              <p className="text-xs text-gray-600">Student Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button
              variant="ghost"
              onClick={handleLogoClick}
              className="text-black hover:bg-[#A2D5C6]/20"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            {user?.isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/grievance/submit')}
                  className="text-black hover:bg-[#A2D5C6]/20"
                >
                  Submit Grievance
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/grievance/track')}
                  className="text-black hover:bg-[#A2D5C6]/20"
                >
                  Track Status
                </Button>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user?.isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-black font-medium">
                    {user?.name || 'User'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-[#A2D5C6] text-black hover:bg-[#A2D5C6]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/institution-select')}
                className="bg-[#A2D5C6] text-black hover:bg-[#A2D5C6]/80"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;