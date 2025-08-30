import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import InstitutionSelect from './components/InstitutionSelect';
import RoleSelect from './components/RoleSelect';
import EnhancedGrievanceForm from './components/forms/EnhancedGrievanceForm';
import GrievanceSuccessPage from './components/pages/GrievanceSuccessPage';
import EnhancedStatusTracking from './components/pages/EnhancedStatusTracking';
import StudentLogin from './components/auth/StudentLogin';
import FacultyLogin from './components/auth/FacultyLogin';
import AdminLogin from './components/auth/AdminLogin';
import OfficerLogin from './components/auth/OfficerLogin';
import StudentDashboard from './components/dashboards/StudentDashboard';
import FacultyDashboard from './components/dashboards/FacultyDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import OfficerDashboard from './components/dashboards/OfficerDashboard';

function App() {
  return (
    <AppContextProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/institution-select" replace />} />
            <Route path="/institution-select" element={<InstitutionSelect />} />
            <Route path="/role-select" element={<RoleSelect />} />
            
            {/* Authentication Routes */}
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/login/faculty" element={<FacultyLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/officer" element={<OfficerLogin />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/dashboard/faculty" element={<FacultyDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/officer" element={<OfficerDashboard />} />
            
            {/* Grievance System Routes */}
            <Route path="/grievance/submit" element={<EnhancedGrievanceForm />} />
            <Route path="/grievance/success" element={<GrievanceSuccessPage />} />
            <Route path="/grievance/track" element={<EnhancedStatusTracking />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/institution-select" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AppContextProvider>
  );
}

export default App;
