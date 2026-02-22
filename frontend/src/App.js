import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import DashboardPage from './pages/DashboardPage';
import ProfileOnboarding from './pages/ProfileOnboarding';
import PsychometricOnboarding from './pages/PsychometricOnboarding';
import BoostPage from './pages/BoostPage';
import DeepReportView from './pages/DeepReportView';
import DeepQuestionnaireFlow from './pages/DeepQuestionnaireFlow';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment (not query params) for session_id
  // This check MUST happen during render, NOT in useEffect
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/onboarding/profile" element={<ProfileOnboarding />} />
      <Route path="/onboarding/psychometric" element={<PsychometricOnboarding />} />
      <Route path="/boost" element={<BoostPage />} />
      <Route path="/deep/report/:pairId" element={<DeepReportView />} />
      <Route path="/deep/questionnaire" element={<DeepQuestionnaireFlow />} />
      
      {/* Fallback */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
