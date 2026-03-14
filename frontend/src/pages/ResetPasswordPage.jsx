import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Lock, Loader2, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * ResetPasswordPage
 *
 * Reads the `token` query param from the URL.
 * On mount it validates the token via GET /api/auth/verify-reset-token.
 * On submit it POSTs to /api/auth/reset-password.
 */
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  // Token validation
  const [tokenStatus, setTokenStatus] = useState('validating'); // validating | valid | invalid
  const [userEmail, setUserEmail] = useState('');

  // Form state
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' });

  // ---------------------------------------------------------------------------
  // Validate token on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    const validate = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`
        );
        setUserEmail(res.data.email || '');
        setTokenStatus('valid');
      } catch {
        setTokenStatus('invalid');
      }
    };

    validate();
  }, [token]);

  // ---------------------------------------------------------------------------
  // Password strength meter
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const map = [
      { label: '', color: '' },
      { label: 'Very weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-400' },
      { label: 'Fair', color: 'bg-yellow-400' },
      { label: 'Strong', color: 'bg-green-400' },
      { label: 'Very strong', color: 'bg-green-600' },
    ];
    setStrength({ score, ...map[score] });
  }, [formData.password]);

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        token,
        new_password: formData.password,
      });
      setSuccess(true);
      toast.success('Password reset! Please log in with your new password.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || 'Failed to reset password. The link may have expired.');
      if (detail?.toLowerCase().includes('expired') || detail?.toLowerCase().includes('invalid')) {
        setTokenStatus('invalid');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Shared logo component
  // ---------------------------------------------------------------------------
  const Logo = () => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center space-x-2">
        <img src="/logo.png" alt="SoulSathiya" className="w-10 h-10 object-contain" draggable={false} />
        <span className="text-3xl font-heading font-bold text-foreground">Soul<span className="text-primary">Sathiya</span></span>
      </Link>
    </div>
  );

  // ---------------------------------------------------------------------------
  // States
  // ---------------------------------------------------------------------------

  // Validating token…
  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <Logo />
          <div className="card-surface p-10 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-muted-foreground">Validating your reset link…</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid / expired token
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="card-surface p-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-900/30 border border-red-700/50 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="font-heading text-2xl">Link expired or invalid</h2>
            <p className="text-muted-foreground leading-relaxed">
              This password reset link is no longer valid. It may have expired (links are
              valid for 1 hour) or already been used.
            </p>
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <Link to="/forgot-password">Request a New Reset Link</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4">
        <div className="w-full max-w-md text-center">
          <Logo />
          <div className="card-surface p-10 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-heading text-2xl text-green-400">Password Reset!</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your password has been reset successfully. Redirecting you to login…
            </p>
            <Button className="w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main form
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card px-4 py-12">
      <div className="w-full max-w-md">
        <Logo />

        <div className="text-center mb-6">
          <h2 className="font-heading text-2xl mb-2">Set a new password</h2>
          {userEmail && (
            <p className="text-muted-foreground text-sm">
              Resetting password for <strong>{userEmail}</strong>
            </p>
          )}
        </div>

        <div className="card-surface p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  autoFocus
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {formData.password && (
                <div className="space-y-1 pt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i <= strength.score ? strength.color : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs text-muted-foreground">{strength.label}</p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={8}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                loading ||
                !formData.password ||
                formData.password !== formData.confirmPassword
              }
              data-testid="reset-submit-btn"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting…</>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
