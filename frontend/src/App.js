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
import DemoDeepReport from './pages/DemoDeepReport';

// New pages — Step 1 (Immediate)
import MatchesPage from './pages/MatchesPage';
import InterestsPage from './pages/InterestsPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import ProfileViewPage from './pages/ProfileViewPage';

// Auth flows — Issue #2 (Email Verification) & Issue #3 (Password Reset)
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Step 2 (Trust & Conversion)
import { PrivacyPolicyPage, TermsOfServicePage, AboutUsPage } from './pages/LegalPages';

// New public pages
import HowItWorksPage from './pages/HowItWorksPage';
import AboutPage from './pages/AboutPage';

// Step 3 (Revenue)
import SubscriptionPage from './pages/SubscriptionPage';

// Notifications & Unsubscribe
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import UnsubscribePage from './pages/UnsubscribePage';

// KYC
import KYCVerificationPage from './pages/KYCVerificationPage';

// Admin Pages
import { AdminLogin, AdminLayout, AdminDashboard, AdminUsers, AdminProfiles, AdminSubscriptions, AdminDeep, AdminReports, AdminAnalytics, AdminKYC } from './pages/admin';

function AppRouter() {
  const location = useLocation();

  // Check URL fragment (not query params) for session_id
  // This check MUST happen during render, NOT in useEffect
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Email verification & password reset — Issue #2 & #3 */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Auth */}
      <Route path="/dashboard" element={<DashboardPage />} />

      {/* Onboarding */}
      <Route path="/onboarding/profile" element={<ProfileOnboarding />} />
      <Route path="/onboarding/psychometric" element={<PsychometricOnboarding />} />

      {/* Core app — Step 1 */}
      <Route path="/matches" element={<MatchesPage />} />
      <Route path="/interests" element={<InterestsPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:otherUserId" element={<ChatPage />} />
      <Route path="/profile" element={<ProfileViewPage />} />
      <Route path="/profile/:userId" element={<ProfileViewPage />} />

      {/* KYC Verification */}
      <Route path="/kyc-verification" element={<KYCVerificationPage />} />

      {/* Monetization */}
      <Route path="/boost" element={<BoostPage />} />
      <Route path="/subscription" element={<SubscriptionPage />} />

      {/* Deep Exploration */}
      <Route path="/deep/report/:pairId" element={<DeepReportView />} />
      <Route path="/deep/questionnaire" element={<DeepQuestionnaireFlow />} />
      <Route path="/deep/demo-report" element={<DemoDeepReport />} />

      {/* Notification settings & unsubscribe */}
      <Route path="/notification-preferences" element={<NotificationPreferencesPage />} />
      <Route path="/unsubscribe" element={<UnsubscribePage />} />

      {/* Public marketing pages */}
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/about" element={<AboutPage />} />

      {/* Legal — Step 2 */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/about-legal" element={<AboutUsPage />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="profiles" element={<AdminProfiles />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="deep" element={<AdminDeep />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="kyc" element={<AdminKYC />} />
      </Route>

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
