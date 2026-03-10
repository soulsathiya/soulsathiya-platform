import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * ForgotPasswordPage
 *
 * Lets the user enter their email to receive a password-reset link.
 * The backend always returns a generic success message so we never
 * reveal whether an email address is registered (anti-enumeration).
 */
const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    try {
      await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email });
      setSubmitted(true);
    } catch (err) {
      // Rate-limit or server error
      const detail = err.response?.data?.detail;
      if (err.response?.status === 429) {
        toast.error('Too many requests. Please wait a minute before trying again.');
      } else {
        toast.error(detail || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success state — always shown after submit (even if email not found)
  // ---------------------------------------------------------------------------
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <Heart className="w-10 h-10 text-primary fill-primary" />
              <span className="text-3xl font-heading font-bold text-foreground">SoulSathiya</span>
            </Link>
          </div>

          <div className="card-surface p-10 space-y-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl">Check your email</h2>
              <p className="text-muted-foreground leading-relaxed">
                If an account with <strong>{email}</strong> exists, we've sent a password
                reset link to that address. It expires in <strong>1 hour</strong>.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-left space-y-1">
              <p>📬 Check your <strong>inbox</strong> and <strong>spam folder</strong></p>
              <p>⏱ The reset link is valid for <strong>1 hour</strong></p>
              <p>🔒 Your password won't change unless you click the link</p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubmitted(false)}
              >
                Try a different email
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Default: email input form
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-3xl font-heading font-bold text-foreground">SoulSathiya</span>
          </Link>
          <h2 className="font-heading text-2xl mt-6 mb-2">Forgot your password?</h2>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {/* Form */}
        <div className="card-surface p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  data-testid="forgot-email-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="forgot-submit-btn"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
              ) : (
                'Send Reset Link'
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

export default ForgotPasswordPage;
