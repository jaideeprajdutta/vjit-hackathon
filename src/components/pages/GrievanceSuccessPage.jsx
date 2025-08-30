import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GrievanceSubmissionSuccess from '../forms/GrievanceSubmissionSuccess';

const GrievanceSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { referenceId, grievanceData } = location.state || {};

  const handleTrackGrievance = () => {
    navigate('/grievance/track', { state: { referenceId } });
  };

  const handleSubmitAnother = () => {
    navigate('/grievance/submit');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/student');
  };

  // If no reference ID, redirect to form
  if (!referenceId) {
    navigate('/enhanced-grievance-form');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F6F6F6] py-8">
      <div className="container mx-auto px-4">
        <GrievanceSubmissionSuccess
          referenceId={referenceId}
          submissionData={grievanceData}
          onTrackGrievance={handleTrackGrievance}
          onSubmitAnother={handleSubmitAnother}
          onGoToDashboard={handleGoToDashboard}
        />
      </div>
    </div>
  );
};

export default GrievanceSuccessPage;