import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Trash2, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import CompatibilityCard     from '@/components/CompatibilityCard';
import ProfileHero           from '@/components/profile/ProfileHero';
import PersonalitySnapshot   from '@/components/profile/PersonalitySnapshot';
import PersonalitySummary    from '@/components/profile/PersonalitySummary';
import LoveStyleCard         from '@/components/profile/LoveStyleCard';
import CompatibilityPreview  from '@/components/profile/CompatibilityPreview';
import AboutSection          from '@/components/profile/AboutSection';
import PhotoGallery          from '@/components/profile/PhotoGallery';
import InsightsSection       from '@/components/profile/InsightsSection';
import TrustBadges           from '@/components/profile/TrustBadges';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const calcAge = (dob) => {
  if (!dob) return null;
  const b = new Date(dob), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};

const ProfileViewPage = () => {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [currentUser,       setCurrentUser]       = useState(null);
  const [profile,           setProfile]           = useState(null);
  const [photos,            setPhotos]            = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [interestSent,      setInterestSent]      = useState(false);
  const [uploading,         setUploading]         = useState(false);
  const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting,          setDeleting]          = useState(false);

  const isOwnProfile = !userId || userId === currentUser?.user_id;
  const targetUserId = userId || currentUser?.user_id;

  useEffect(() => {
    const init = async () => {
      try {
        const meRes      = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setCurrentUser(meRes.data);
        const profileRes = await axios.get(
          `${BACKEND_URL}/api/profile/${userId || meRes.data.user_id}`,
          { withCredentials: true }
        );
        setProfile(profileRes.data);
        setPhotos(profileRes.data.photos || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else if (error.response?.status === 404) toast.error('Profile not found');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId, navigate]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendInterest = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/interests/send`,
        { to_user_id: targetUserId, message: '' },
        { withCredentials: true }
      );
      setInterestSent(true);
      toast.success('Interest sent!');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error((Array.isArray(detail) ? detail[0]?.msg : detail) || 'Failed to send interest');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', photos.length === 0 ? 'true' : 'false');
    try {
      await axios.post(`${BACKEND_URL}/api/photos/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Photo uploaded!');
      const refreshed = await axios.get(`${BACKEND_URL}/api/photos/my-photos`, { withCredentials: true });
      setPhotos(refreshed.data.photos || []);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error((Array.isArray(detail) ? detail[0]?.msg : detail) || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/photos/${photoId}`, { withCredentials: true });
      setPhotos(prev => prev.filter(p => p.photo_id !== photoId));
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  const handleTogglePrivacy = async (photoId, currentHidden) => {
    try {
      await axios.put(`${BACKEND_URL}/api/photos/${photoId}/privacy`, null, {
        params: { is_hidden: !currentHidden },
        withCredentials: true,
      });
      setPhotos(prev => prev.map(p =>
        p.photo_id === photoId ? { ...p, is_hidden: !currentHidden } : p
      ));
      toast.success(currentHidden ? 'Photo is now visible' : 'Photo is now private');
    } catch {
      toast.error('Failed to update privacy');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/account`, { withCredentials: true });
      toast.success('Account deleted. Goodbye!');
      navigate('/login');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error(detail || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const user        = profile?.user;
  const profileData = profile?.profile;
  const age         = calcAge(profileData?.date_of_birth);
  const firstName   = user?.full_name?.split(' ')[0];
  const targetName  = firstName || 'them';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-7 h-7 object-contain" draggable={false} />
            <span className="text-xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">

        {/* 1. Hero — name, readiness score, 3 CTAs */}
        <ProfileHero
          user={user}
          profileData={profileData}
          photos={photos}
          age={age}
          isOwnProfile={isOwnProfile}
          targetUserId={targetUserId}
          interestSent={interestSent}
          onSendInterest={handleSendInterest}
        />

        {/* 2. AI Personality Summary */}
        <PersonalitySummary user={user} profileData={profileData} age={age} />

        {/* 3. Personality chips (clickable with explanations) */}
        {profileData && <PersonalitySnapshot profileData={profileData} />}

        {/* 4. How This Person Loves */}
        {profileData && <LoveStyleCard profileData={profileData} firstName={firstName} />}

        {/* 5. Compatibility Preview — who they match best with */}
        {profileData && <CompatibilityPreview profileData={profileData} firstName={firstName} />}

        {/* 6. Actual Compatibility score card (other users only) */}
        {!isOwnProfile && (
          <div id="compatibility-section" className="mb-6">
            <CompatibilityCard targetUserId={targetUserId} targetName={targetName} />
          </div>
        )}

        {/* 7. About (narrative + tabs) */}
        {profileData && <AboutSection profileData={profileData} firstName={firstName} />}

        {/* 8. SoulSathiya Insights (locked bars, other users only) */}
        {!isOwnProfile && (
          <InsightsSection profileData={profileData} isPremiumUnlocked={false} />
        )}

        {/* 9. Photos */}
        <PhotoGallery
          photos={photos}
          isOwnProfile={isOwnProfile}
          uploading={uploading}
          onUpload={handlePhotoUpload}
          onDelete={handleDeletePhoto}
          onTogglePrivacy={handleTogglePrivacy}
        />

        {/* 10. Trust & Verification */}
        <TrustBadges user={user} profileData={profileData} />

        {/* 11. Report CTA — clean, separate from profile (other users only) */}
        {!isOwnProfile && (
          <div
            className="rounded-2xl p-6 mb-6 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #0f1929 0%, #1a1208 100%)' }}
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  View Detailed Relationship Intelligence Report
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Psychological compatibility · Communication analysis · Long-term alignment
                </p>
              </div>
            </div>
            <Link to="/insights" className="flex-shrink-0">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 whitespace-nowrap">
                Unlock Report ₹999
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        )}

        {/* 12. Delete account — own profile only, at the very bottom */}
        {isOwnProfile && (
          <div className="rounded-2xl p-6 mt-2 border border-red-900/20 opacity-50 hover:opacity-100 transition-opacity duration-300 card-surface">
            <p className="text-xs text-muted-foreground mb-3">
              Deleting your account will hide your profile and disable login. This cannot be undone.
            </p>
            <button
              onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(''); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400/60 hover:bg-red-900/40 hover:text-red-400 transition-colors text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete My Account
            </button>
          </div>
        )}
      </main>

      {/* ── Delete Account Modal ───────────────────────────────────────────── */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="card-surface rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-900/40">
            <h3 className="font-heading text-xl text-red-400 mb-3">Delete Your Account?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Are you sure you want to delete your account?
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This will <span className="text-foreground font-medium">hide your profile</span> and{' '}
              <span className="text-foreground font-medium">disable login</span>. This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground mb-6 focus:outline-none focus:border-red-500 font-mono"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileViewPage;
