import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, ShieldCheck, MapPin, Briefcase, Zap, MessageCircle, UserPlus, Loader2, Filter, Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getScoreColor = (score) => {
  if (score >= 85) return 'text-green-400';
  if (score >= 70) return 'text-primary';
  if (score >= 55) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-muted-foreground';
};

const getScoreLabel = (score) => {
  if (score >= 85) return 'Exceptional Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Good Match';
  if (score >= 40) return 'Worth Exploring';
  return 'Some Alignment';
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const MatchCard = ({ match, onSendInterest, interestsSent }) => {
  const { user, profile_preview, archetype, compatibility_score, is_boosted, match_id } = match;
  const age = calculateAge(profile_preview?.date_of_birth);
  const alreadySent = interestsSent.has(user.user_id);

  return (
    <div className="card-surface rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200" data-testid={`match-card-${user.user_id}`}>
      {/* Photo */}
      <div className="relative h-56 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        {user.picture ? (
          <img src={user.picture} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          <Avatar className="w-24 h-24">
            <AvatarFallback className="text-3xl bg-primary/20 text-primary">{user.full_name?.[0]}</AvatarFallback>
          </Avatar>
        )}
        {is_boosted && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-500 text-white text-xs">
              <Zap className="w-3 h-3 mr-1" /> Boosted
            </Badge>
          </div>
        )}
        {user.is_verified && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-900/40 text-green-400 border border-green-700/50 text-xs">
              <ShieldCheck className="w-3 h-3 mr-1" /> Verified
            </Badge>
          </div>
        )}
        {/* Compatibility score overlay — hero number */}
        <div className="absolute bottom-3 right-3 bg-card/95 backdrop-blur-sm rounded-xl px-3.5 py-2 flex flex-col items-center shadow-lg border border-white/10">
          <span className={`text-xl font-extrabold tabular-nums leading-none ${getScoreColor(compatibility_score)}`}>
            {compatibility_score?.toFixed(0)}%
          </span>
          <span className="text-[9px] text-white/40 font-medium mt-0.5">Compatible</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground">{user.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              {age ? `${age} years` : ''}{archetype ? ` · ${archetype}` : ''}
            </p>
          </div>
          <Badge variant="outline" className={`text-xs ${getScoreColor(compatibility_score)}`}>
            {getScoreLabel(compatibility_score)}
          </Badge>
        </div>

        {(profile_preview?.city || profile_preview?.occupation) && (
          <div className="space-y-1">
            {profile_preview?.city && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{profile_preview.city}{profile_preview.state ? `, ${profile_preview.state}` : ''}</span>
              </div>
            )}
            {profile_preview?.occupation && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                <span>{profile_preview.occupation}</span>
              </div>
            )}
          </div>
        )}

        {/* Compatibility bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Compatibility</span>
            <span className={getScoreColor(compatibility_score)}>{compatibility_score?.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(compatibility_score || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link to={`/profile/${user.user_id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">View Profile</Button>
          </Link>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onSendInterest(user.user_id)}
            disabled={alreadySent}
            data-testid={`send-interest-${user.user_id}`}
          >
            {alreadySent ? (
              <><MessageCircle className="w-3 h-3 mr-1" /> Sent</>
            ) : (
              <><UserPlus className="w-3 h-3 mr-1" /> Connect</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MatchesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = new URLSearchParams(location.search).get('new') === 'true';
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interestsSent, setInterestsSent] = useState(new Set());
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState('compatibility');
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(isNewUser);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(meRes.data);
        const matchRes = await axios.get(`${BACKEND_URL}/api/matches`, { withCredentials: true });
        setMatches(matchRes.data.matches || []);
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleSendInterest = async (toUserId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/interests/send`, { to_user_id: toUserId, message: '' }, { withCredentials: true });
      setInterestsSent(prev => new Set([...prev, toUserId]));
      toast.success('Interest sent! They will be notified.');
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const msg = (Array.isArray(detail) ? detail[0]?.msg : detail) || error?.message || 'Failed to send interest';
      toast.error(msg);
      if (msg.toLowerCase().includes('upgrade')) {
        setTimeout(() => navigate('/subscription'), 1500);
      }
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortBy === 'compatibility') return (b.compatibility_score || 0) - (a.compatibility_score || 0);
    if (sortBy === 'boosted') return (b.is_boosted ? 1 : 0) - (a.is_boosted ? 1 : 0);
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Header */}
      <header className="glass-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.png" alt="SoulSathiya" className="w-8 h-8 object-contain" draggable={false} />
            <span className="text-2xl font-heading font-bold">Soul<span className="text-primary">Sathiya</span></span>
          </Link>
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-7xl">

        {/* ── First-time welcome banner ── */}
        {showWelcomeBanner && (
          <div
            className="relative mb-8 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(99,102,241,0.10) 100%)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#D4AF37' }} />
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-snug">Your compatibility profile is live! 🎉</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  These matches are ranked by your psychometric compatibility score — the deeper your answers, the more accurate the match.
                </p>
              </div>
              {/* Dismiss */}
              <button
                onClick={() => setShowWelcomeBanner(false)}
                className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        )}

        {/* Page Title */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl mb-1">Your Matches</h1>
            <p className="text-muted-foreground">
              {matches.length} compatible profiles found · ranked by psychometric compatibility
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="compatibility">Sort: Compatibility</option>
              <option value="boosted">Sort: Boosted First</option>
            </select>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <Heart className="w-16 h-16 text-primary/30 mx-auto" />
            <h2 className="font-heading text-2xl text-muted-foreground">No matches yet</h2>
            <p className="text-muted-foreground">Complete your psychometric assessment to start matching</p>
            <Link to="/onboarding/psychometric">
              <Button>Take Assessment</Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedMatches.map((match, idx) => (
              <MatchCard
                key={match.match_id || idx}
                match={match}
                onSendInterest={handleSendInterest}
                interestsSent={interestsSent}
              />
            ))}
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {user?.subscription_status === 'free' && matches.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-primary-foreground text-center space-y-4">
            <h3 className="font-heading text-2xl">Want More Connections?</h3>
            <p className="text-primary-foreground/80">Free plan includes 3 connection requests per month. Upgrade for unlimited interests &amp; advanced filters.</p>
            <Link to="/subscription">
              <Button variant="secondary" size="lg">See Plans</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchesPage;
