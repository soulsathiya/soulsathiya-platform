import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Heart, Brain, UserCheck, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Key commitments shown in plain language ──────────────────────────────────
const COMMITMENTS = [
  {
    icon: Heart,
    title: 'Built for Meaningful Relationships',
    description: 'This platform exists to help you find a genuine, lasting partnership — not casual connections.',
  },
  {
    icon: Brain,
    title: 'Psychology-Driven Matching',
    description: 'Your matches are based on deep psychological compatibility, not superficial filters or engagement tricks.',
  },
  {
    icon: UserCheck,
    title: 'Respectful Community',
    description: 'Respectful behaviour is expected from every member. Harassment or misuse leads to permanent removal.',
  },
  {
    icon: Shield,
    title: 'Your Data is Protected',
    description: 'Your personal information is handled with care, never sold, and stored securely.',
  },
  {
    icon: LogOut,
    title: 'You Are in Control',
    description: 'You can update, export, or delete your account and data at any time. No lock-in.',
  },
];

const TermsAcceptancePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Two modes:
  // 1. "pending" — New Google user, needs account creation (has pending_token)
  // 2. "update"  — Existing user with outdated terms (already authenticated)
  const pendingToken = location.state?.pending_token;
  const userInfo = location.state?.user_info;
  const returnTo = location.state?.returnTo || '/dashboard';
  const mode = pendingToken ? 'pending' : 'update';

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (mode === 'pending') {
        // New Google user — complete registration
        const res = await axios.post(
          `${BACKEND_URL}/api/auth/complete-registration`,
          { pending_token: pendingToken },
          { withCredentials: true }
        );
        const user = res.data.user;
        toast.success(`Welcome to SoulSathiya, ${user.full_name}!`);

        if (!user.is_profile_complete) {
          navigate('/onboarding/profile', { state: { user }, replace: true });
        } else {
          navigate('/dashboard', { state: { user }, replace: true });
        }
      } else {
        // Existing user — accept updated terms
        await axios.post(
          `${BACKEND_URL}/api/auth/accept-terms`,
          null,
          { withCredentials: true }
        );
        toast.success('Terms accepted. Welcome back!');
        navigate(returnTo, { replace: true });
      }
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || 'Something went wrong. Please try again.';
      toast.error(message);

      // If pending token expired, redirect to login
      if (mode === 'pending' && error?.response?.status === 400) {
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-xl font-heading font-bold text-foreground">
              Soul<span className="text-primary">Sathiya</span>
            </span>
          </Link>
        </div>

        <div className="card-surface p-8 rounded-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
              Before You Begin
            </h1>
            {userInfo && (
              <p className="text-sm text-muted-foreground">
                Welcome, <span className="text-foreground font-medium">{userInfo.full_name}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Here's what we promise — and what we ask of you.
            </p>
          </div>

          {/* Commitments */}
          <div className="space-y-4 mb-8">
            {COMMITMENTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/[0.08] border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="w-full btn-primary font-semibold text-base py-5 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              'I Agree & Continue'
            )}
          </Button>

          {/* Legal links */}
          <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
            By continuing, I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptancePage;
