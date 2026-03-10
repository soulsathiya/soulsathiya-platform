import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BellOff, CheckCircle, XCircle, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const UnsubscribePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link. No token was provided.');
      return;
    }

    const doUnsubscribe = async () => {
      try {
        const res = await axios.post(
          `${BACKEND_URL}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`
        );
        setMessage(res.data?.message || 'You have been unsubscribed.');
        setStatus('success');
      } catch (error) {
        const detail = error?.response?.data?.detail;
        const msg = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'This unsubscribe link is invalid or has already been used.';
        setMessage(msg);
        setStatus('error');
      }
    };

    doUnsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          <span className="text-2xl font-heading font-bold">SoulSathiya</span>
        </div>

        <div className="card-surface rounded-2xl p-8 shadow-sm">
          {status === 'loading' && (
            <>
              <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-heading text-xl mb-2">Processing…</h2>
              <p className="text-muted-foreground text-sm">
                Please wait while we update your preferences.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="font-heading text-xl mb-2">Unsubscribed</h2>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <p className="text-xs text-muted-foreground mb-6">
                You can re-enable this notification type any time from your{' '}
                <button
                  onClick={() => navigate('/notification-preferences')}
                  className="text-primary underline"
                >
                  notification settings
                </button>
                .
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Back to SoulSathiya
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
              <h2 className="font-heading text-xl mb-2">Link Invalid</h2>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/notification-preferences')} className="w-full">
                  Manage Preferences
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsubscribePage;
