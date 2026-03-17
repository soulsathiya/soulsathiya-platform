import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Briefcase, GraduationCap, ArrowLeft, X, Lock, Loader2, UserPlus, MessageCircle, Star, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import CompatibilityCard from '@/components/CompatibilityCard';

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
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestSent, setInterestSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const isOwnProfile = !userId || userId === currentUser?.user_id;
  const targetUserId = userId || currentUser?.user_id;

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setCurrentUser(meRes.data);
        const profileRes = await axios.get(`${BACKEND_URL}/api/profile/${userId || meRes.data.user_id}`, { withCredentials: true });
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

  const handleSendInterest = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/interests/send`, { to_user_id: targetUserId, message: '' }, { withCredentials: true });
      setInterestSent(true);
      toast.success('Interest sent!');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to send interest';
      toast.error(message);
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
      const res = await axios.post(`${BACKEND_URL}/api/photos/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo uploaded!');
      // Refresh photos
      const refreshed = await axios.get(`${BACKEND_URL}/api/photos/my-photos`, { withCredentials: true });
      setPhotos(refreshed.data.photos || []);
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Upload failed';
      toast.error(message);
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
        withCredentials: true
      });
      setPhotos(prev => prev.map(p => p.photo_id === photoId ? { ...p, is_hidden: !currentHidden } : p));
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const user = profile?.user;
  const profileData = profile?.profile;
  const age = calcAge(profileData?.date_of_birth);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-7 h-7 object-contain" draggable={false} />
            <span className="text-xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-4xl">
        {/* Profile Header */}
        <div className="card-surface p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-24 h-24 flex-shrink-0">
              <AvatarImage src={user?.picture || photos.find(p => p.is_primary)?.s3_url} />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary">{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1 flex-wrap gap-2">
                <h1 className="font-heading text-3xl">{user?.full_name}</h1>
                {user?.is_verified && (
                  <Badge className="bg-green-900/40 text-green-400 border border-green-700/50">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                {age && <span>{age} years</span>}
                {profileData?.city && (
                  <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{profileData.city}{profileData.state ? `, ${profileData.state}` : ''}</span>
                )}
                {profileData?.occupation && (
                  <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" />{profileData.occupation}</span>
                )}
                {profileData?.education_level && (
                  <span className="flex items-center"><GraduationCap className="w-3 h-3 mr-1" />{profileData.education_level}</span>
                )}
              </div>
              {profileData?.bio && <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">{profileData.bio}</p>}
            </div>
            {!isOwnProfile && (
              <div className="flex flex-col gap-3">
                <Button onClick={handleSendInterest} disabled={interestSent} data-testid="send-interest-btn">
                  {interestSent ? <><Star className="w-4 h-4 mr-2" /> Sent</> : <><UserPlus className="w-4 h-4 mr-2" /> Connect</>}
                </Button>
                <Link to={`/messages/${targetUserId}`}>
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Compatibility Card — shown only when viewing another user's profile */}
        {!isOwnProfile && (
          <CompatibilityCard
            targetUserId={targetUserId}
            targetName={user?.full_name?.split(' ')[0] || 'them'}
          />
        )}

        {/* Details */}
        {profileData && (
          <div className="card-surface p-8 mb-6">
            <h2 className="font-heading text-xl mb-4">About</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Religion', value: profileData.religion },
                { label: 'Marital Status', value: profileData.marital_status?.replace('_', ' ') },
                { label: 'Height', value: profileData.height_cm ? `${profileData.height_cm} cm` : null },
                { label: 'Annual Income', value: profileData.annual_income },
              ].map(({ label, value }) => value ? (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                  <p className="text-sm font-medium capitalize">{value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        )}

        {/* Delete Account — own profile only */}
        {isOwnProfile && (
          <div className="card-surface p-8 mt-6 border border-red-900/40">
            <h2 className="font-heading text-xl text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Deleting your account will hide your profile and disable login. This action cannot be undone.
            </p>
            <button
              onClick={() => { setShowDeleteDialog(true); setDeleteConfirmText(''); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-900/50 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </button>
          </div>
        )}

        {/* Delete Account Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="card-surface rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-900/40">
              <h3 className="font-heading text-xl text-red-400 mb-3">Delete Your Account?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to delete your account?
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                This will <span className="text-foreground font-medium">hide your profile</span> and <span className="text-foreground font-medium">disable login</span>. This action cannot be undone.
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
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="card-surface p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl">Photos</h2>
            {isOwnProfile && photos.length < 6 && (
              <label htmlFor="photo-upload" className="cursor-pointer">
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={handlePhotoUpload}
                  data-testid="upload-photo-input"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  asChild
                  data-testid="upload-photo-btn"
                >
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                    {uploading ? 'Uploading...' : 'Add Photo'}
                  </span>
                </Button>
              </label>
            )}
          </div>
          {photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{isOwnProfile ? 'Add photos to attract more matches' : 'No photos available'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.photo_id} className="relative group aspect-square rounded-xl overflow-hidden bg-card">
                  {photo.is_hidden && !isOwnProfile ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={photo.s3_url} alt="Profile" className="w-full h-full object-cover" />
                  )}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => handleTogglePrivacy(photo.photo_id, photo.is_hidden)} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors" title={photo.is_hidden ? 'Make public' : 'Make private'}>
                        <Lock className="w-4 h-4 text-gray-700" />
                      </button>
                      <button onClick={() => handleDeletePhoto(photo.photo_id)} className="p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors">
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                  {photo.is_primary && <div className="absolute bottom-2 left-2"><Badge className="text-xs bg-primary text-primary-foreground">Primary</Badge></div>}
                  {photo.is_hidden && isOwnProfile && <div className="absolute top-2 right-2"><Badge variant="secondary" className="text-xs"><Lock className="w-3 h-3" /></Badge></div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProfileViewPage;
