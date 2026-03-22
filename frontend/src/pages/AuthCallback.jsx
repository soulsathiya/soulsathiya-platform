import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error('Invalid authentication callback');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/google-session`,
          null,
          {
            params: { session_id: sessionId },
            withCredentials: true
          }
        );

        // ── New user — account NOT created yet, show Terms first ──
        if (response.data.status === 'pending_terms') {
          navigate('/accept-terms', {
            state: {
              pending_token: response.data.pending_token,
              user_info: response.data.user_info,
            },
            replace: true,
          });
          return;
        }

        const user = response.data.user;

        // ── Existing user with outdated/missing terms ──
        if (!user.terms_accepted) {
          navigate('/accept-terms', {
            state: {
              returnTo: user.is_profile_complete ? '/dashboard' : '/onboarding/profile',
            },
            replace: true,
          });
          return;
        }

        // ── Normal flow ──
        if (!user.is_profile_complete) {
          navigate('/onboarding/profile', { state: { user }, replace: true });
        } else {
          navigate('/dashboard', { state: { user }, replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
