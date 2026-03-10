import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, Mail, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * VerifyEmailPage
 *
 * Two modes:
 *  1. Token in URL (?token=xxx) → automatically verifies and shows success/error.
 *  2. No token              → "check your inbox" banner with a resend button.
 */
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Verification state
  const [status, setStatus] = useState('idle'); // idle | verifying | success | error
  const [errorMessage, setErrorMessage] = useState('');

  // Resend state
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds

  // ---------------------------------------------------------------------------
  // Auto-verify when a token is present in the URL
  // ---------------------------------------------------------------------------
  const runVerification = useCallback(async (t) => {
    setStatus('verifying');
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/verify-email?token=${encodeURIComponent(t)}`,
        {},
        { withCredentials: true }
      );
      setStatus('success');
      toast.success('Email verified! Welcome to SoulSathiya 🎉');
      // Redirect to dashboard after a brief celebration moment
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.response?.data?.detail ||
          'Verification failed. The link may have expired or already been used.'
      );
    }
  }, [navigate]);

  useEffect(() => {
    if (token) {
      runVerification(token);
    }
  }, [token, runVerification]);

  // ---------------------------------------------------------------------------
  // Cooldown timer for resend button
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ---------------------------------------------------------------------------
  // Resend verification email (requires active session)
  // ---------------------------------------------------------------------------
  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/auth/send-verification-email`,
        {},
        { withCredentials: true }
      );
      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60); // 60-second cooldown
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (err.response?.status === 401) {
        toast.error('Please log in first to resend the verification email.');
      } else if (detail.includes('already verified')) {
        toast.info('Your email is already verified!');
        navigate('/dashboard');
      } else {
        toast.error(detail || 'Could not resend email. Please try again later.');
      }
    } finally {
      setResending(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const Logo = () => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center space-x-2">
        <Heart className="w-10 h-10 text-primary fill-primary" />
        <span className="text-3xl font-heading font-bold text-foreground">SoulSathiya</span>
      </Link>
    </div>
  );

  // --- Verifying ---
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="card-surface p-10 space-y-6">
            <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto" />
            <h2 className="font-heading text-2xl">Verifying your email…</h2>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="card-surface p-10 space-y-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="font-heading text-2xl text-green-700">Email Verified!</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your email has been confirmed. You now have full access to SoulSathiya.
              Redirecting you to your dashboard…
            </p>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Error (invalid / expired token) ---
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="card-surface p-10 space-y-6">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="font-heading text-2xl">Verification Failed</h2>
            <p className="text-muted-foreground leading-relaxed">{errorMessage}</p>

            <div className="space-y-3 pt-2">
              <Button
                className="w-full"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
              >
                {resending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> Resend Verification Email</>
                )}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Default: no token in URL — "check your inbox" state ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="card-surface p-10 space-y-6 text-center">
          {/* Animated envelope */}
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="font-heading text-2xl">Check your inbox</h2>
            <p className="text-muted-foreground leading-relaxed">
              We've sent you a verification link. Click it to confirm your email address
              and unlock all features of SoulSathiya.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-left space-y-1">
            <p>✅ Check your <strong>inbox</strong> and <strong>spam folder</strong></p>
            <p>⏱ The link expires in <strong>24 hours</strong></p>
            <p>🔄 Didn't receive it? Use the button below</p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              data-testid="resend-verification-btn"
            >
              {resending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Resend Verification Email</>
              )}
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard">Skip for now</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Wrong email?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in with a different account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
