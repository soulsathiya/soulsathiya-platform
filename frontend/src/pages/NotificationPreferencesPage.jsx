import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PREF_LABELS = {
  interest_received: {
    label: 'Interest Received',
    description: 'Email me when someone sends me an interest',
  },
  new_message: {
    label: 'New Message',
    description: 'Email me when I receive a new message',
  },
  weekly_digest: {
    label: 'Weekly Digest',
    description: 'Send me a weekly summary of my activity',
  },
  deep_exploration: {
    label: 'Deep Exploration',
    description: 'Email me about compatibility assessments and reports',
  },
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
      ${checked ? 'bg-primary' : 'bg-muted-foreground/30'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({});

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/notifications/email-preferences`, {
          withCredentials: true,
        });
        setPrefs(res.data);
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate('/login');
        } else {
          const detail = error?.response?.data?.detail;
          const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to load preferences';
          toast.error(message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [navigate]);

  const handleToggle = async (key, value) => {
    const prev = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaving(true);
    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/notifications/email-preferences`,
        { [key]: value },
        { withCredentials: true }
      );
      setPrefs(res.data);
      toast.success('Preferences saved');
    } catch (error) {
      // Revert on failure
      setPrefs((p) => ({ ...p, [key]: prev }));
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to save preferences';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card px-4 py-10">
      <div className="container mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="font-heading text-2xl">Notification Preferences</h1>
          </div>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          Choose which email notifications you'd like to receive. You can also unsubscribe
          from any notification type using the link in any email we send you.
        </p>

        <div className="card-surface rounded-2xl divide-y">
          {Object.entries(PREF_LABELS).map(([key, { label, description }]) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Toggle
                checked={!!prefs[key]}
                onChange={(val) => handleToggle(key, val)}
                disabled={saving}
              />
            </div>
          ))}
        </div>

        {saving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving…
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-6">
          Changes are saved automatically. You can update these preferences at any time.
        </p>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
