import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Heart, ShieldCheck, MapPin, Briefcase, Zap, MessageCircle, UserPlus,
  Loader2, SlidersHorizontal, Star, Sparkles, X, Lock, RotateCcw, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import NotificationBell from '../components/NotificationBell';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Match Card ───────────────────────────────────────────────────────────────
const MatchCard = ({ match, onSendInterest, interestsSent }) => {
  const { user, profile_preview, archetype, compatibility_score, is_boosted } = match;
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
            <span className={getScoreColor(compatibility_score)}>{compatibility_score?.toFixed(0)}%</span>
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

// ── Tier helpers ─────────────────────────────────────────────────────────────
const TIER_LEVEL = { free: 0, basic: 1, premium: 2, elite: 3 };
const hasTier = (userTier, required) => (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[required] || 3);

// ── Refinement defaults ──────────────────────────────────────────────────────
const DEFAULT_REFINEMENTS = {
  age_min: '',
  age_max: '',
  city: '',
  state: '',
  religion: '',
  education: '',
  marital_status: '',
  personality_type: '',
  min_compatibility: '',
};

// ── Refinement Slide-over Panel ──────────────────────────────────────────────
const RefinementPanel = ({ open, onClose, refinements, onChange, onApply, onReset, userTier, activeCount }) => {
  if (!open) return null;

  const LockedOverlay = ({ tier }) => (
    <div className="absolute inset-0 rounded-xl bg-card/80 backdrop-blur-[2px] flex items-center justify-center z-10 cursor-pointer"
         onClick={() => toast.info(`Available in ${tier} plan`, { duration: 2000 })}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        <span>Available in {tier}</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );

  const SectionHeader = ({ title, tier, locked }) => (
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{title}</h4>
      {locked ? (
        <Badge className="text-[10px] bg-white/5 text-muted-foreground border border-white/10">
          <Lock className="w-2.5 h-2.5 mr-1" /> {tier}
        </Badge>
      ) : (
        <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20">Active</Badge>
      )}
    </div>
  );

  const SelectField = ({ label, value, onValueChange, options, placeholder }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onValueChange(e.target.value)}
        className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{placeholder}</option>
        {options.map(({ value: v, label: l }) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">Refine Your Matches</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              We prioritise compatibility. These refinements help you explore further.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── FREE TIER: Age + Location ── */}
          <div>
            <SectionHeader title="Basics" tier="Free" locked={false} />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Age Min</label>
                  <input
                    type="number" min={18} max={100} placeholder="18"
                    value={refinements.age_min}
                    onChange={e => onChange({ ...refinements, age_min: e.target.value })}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Age Max</label>
                  <input
                    type="number" min={18} max={100} placeholder="45"
                    value={refinements.age_max}
                    onChange={e => onChange({ ...refinements, age_max: e.target.value })}
                    className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">City</label>
                <input
                  type="text" placeholder="e.g. Mumbai"
                  value={refinements.city}
                  onChange={e => onChange({ ...refinements, city: e.target.value })}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">State</label>
                <input
                  type="text" placeholder="e.g. Maharashtra"
                  value={refinements.state}
                  onChange={e => onChange({ ...refinements, state: e.target.value })}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* ── PREMIUM TIER: Religion, Education, Marital Status ── */}
          <div className="relative">
            {!hasTier(userTier, 'premium') && <LockedOverlay tier="Premium" />}
            <SectionHeader title="Preferences" tier="Premium" locked={!hasTier(userTier, 'premium')} />
            <div className="space-y-4">
              <SelectField
                label="Religion" value={refinements.religion}
                onValueChange={v => onChange({ ...refinements, religion: v })}
                placeholder="Any religion"
                options={[
                  { value: 'hindu', label: 'Hindu' }, { value: 'muslim', label: 'Muslim' },
                  { value: 'christian', label: 'Christian' }, { value: 'sikh', label: 'Sikh' },
                  { value: 'buddhist', label: 'Buddhist' }, { value: 'jain', label: 'Jain' },
                  { value: 'parsi', label: 'Parsi' }, { value: 'no_religion', label: 'No Religion' },
                ]}
              />
              <SelectField
                label="Education" value={refinements.education}
                onValueChange={v => onChange({ ...refinements, education: v })}
                placeholder="Any education"
                options={[
                  { value: 'high_school', label: 'High School' }, { value: 'diploma', label: 'Diploma' },
                  { value: 'bachelors', label: "Bachelor's" }, { value: 'masters', label: "Master's" },
                  { value: 'doctorate', label: 'Doctorate' },
                ]}
              />
              <SelectField
                label="Marital Status" value={refinements.marital_status}
                onValueChange={v => onChange({ ...refinements, marital_status: v })}
                placeholder="Any status"
                options={[
                  { value: 'never_married', label: 'Never Married' }, { value: 'divorced', label: 'Divorced' },
                  { value: 'widowed', label: 'Widowed' }, { value: 'awaiting_divorce', label: 'Awaiting Divorce' },
                ]}
              />
            </div>
          </div>

          {/* ── ELITE TIER: Personality + Compatibility Threshold ── */}
          <div className="relative">
            {!hasTier(userTier, 'elite') && <LockedOverlay tier="Elite" />}
            <SectionHeader title="Deep Intelligence" tier="Elite" locked={!hasTier(userTier, 'elite')} />
            <div className="space-y-4">
              <SelectField
                label="Personality Archetype" value={refinements.personality_type}
                onValueChange={v => onChange({ ...refinements, personality_type: v })}
                placeholder="Any personality"
                options={[
                  { value: 'The Nurturer', label: 'The Nurturer' },
                  { value: 'The Visionary', label: 'The Visionary' },
                  { value: 'The Anchor', label: 'The Anchor' },
                  { value: 'The Explorer', label: 'The Explorer' },
                  { value: 'The Harmonizer', label: 'The Harmonizer' },
                  { value: 'The Builder', label: 'The Builder' },
                ]}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Min Compatibility {refinements.min_compatibility ? `(${refinements.min_compatibility}%)` : ''}
                </label>
                <input
                  type="range" min={0} max={95} step={5}
                  value={refinements.min_compatibility || 0}
                  onChange={e => onChange({ ...refinements, min_compatibility: e.target.value === '0' ? '' : e.target.value })}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/50">
                  <span>All matches</span>
                  <span>95%+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onReset} className="flex-1 gap-1.5 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button onClick={onApply} className="flex-1 btn-primary font-semibold">
            Apply Refinement
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
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

  // Refinement state
  const [panelOpen, setPanelOpen] = useState(false);
  const [refinements, setRefinements] = useState(DEFAULT_REFINEMENTS);
  const [activeRefinements, setActiveRefinements] = useState(DEFAULT_REFINEMENTS);
  const [refinementsApplied, setRefinementsApplied] = useState(false);

  const userTier = user?.subscription_tier || 'free';

  // Count how many refinements are active
  const activeCount = Object.values(activeRefinements).filter(v => v !== '').length;

  const fetchMatches = useCallback(async (params = {}) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/matches`, {
        withCredentials: true,
        params,
      });
      setMatches(res.data.matches || []);
      setRefinementsApplied(!!res.data.refinements_applied);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
      else toast.error('Failed to load matches');
    }
  }, [navigate]);

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { withCredentials: true });
        setUser(meRes.data);
        await fetchMatches();
      } catch (error) {
        if (error.response?.status === 401) navigate('/login');
        else toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate, fetchMatches]);

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

  const handleApplyRefinements = async () => {
    setPanelOpen(false);
    setLoading(true);
    setActiveRefinements({ ...refinements });

    // Build query params — only include non-empty values
    const params = {};
    if (refinements.age_min) params.age_min = refinements.age_min;
    if (refinements.age_max) params.age_max = refinements.age_max;
    if (refinements.city) params.city = refinements.city;
    if (refinements.state) params.state = refinements.state;
    if (refinements.religion) params.religion = refinements.religion;
    if (refinements.education) params.education = refinements.education;
    if (refinements.marital_status) params.marital_status = refinements.marital_status;
    if (refinements.personality_type) params.personality_type = refinements.personality_type;
    if (refinements.min_compatibility) params.min_compatibility = refinements.min_compatibility;

    await fetchMatches(params);
    setLoading(false);
  };

  const handleResetRefinements = async () => {
    setRefinements(DEFAULT_REFINEMENTS);
    setActiveRefinements(DEFAULT_REFINEMENTS);
    setPanelOpen(false);
    setLoading(true);
    await fetchMatches();
    setLoading(false);
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
      <header className="glass-card border-b sticky top-0 z-30">
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

        {/* ── Welcome banner ── */}
        {showWelcomeBanner && (
          <div
            className="relative mb-8 rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(99,102,241,0.10) 100%)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#D4AF37' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-snug">Your compatibility profile is live!</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  These matches are ranked by your psychometric compatibility score — the deeper your answers, the more accurate the match.
                </p>
              </div>
              <button onClick={() => setShowWelcomeBanner(false)} className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-white/10" aria-label="Dismiss">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        )}

        {/* Page Title + Controls */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl mb-1">Your Matches</h1>
            <p className="text-muted-foreground">
              {matches.length} compatible profiles{refinementsApplied ? ' (refined)' : ''} · ranked by psychometric compatibility
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Refine button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRefinements({ ...activeRefinements }); setPanelOpen(true); }}
              className={`gap-2 transition-all duration-200 ${
                activeCount > 0
                  ? 'border-primary/40 text-primary bg-primary/5'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Refine Matches
              {activeCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {activeCount}
                </span>
              )}
            </Button>
            {/* Sort */}
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

        {/* ── Active refinement chips ── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground/60 font-medium">Active:</span>
            {activeRefinements.age_min && <Badge variant="outline" className="text-xs text-primary border-primary/30">Age ≥ {activeRefinements.age_min}</Badge>}
            {activeRefinements.age_max && <Badge variant="outline" className="text-xs text-primary border-primary/30">Age ≤ {activeRefinements.age_max}</Badge>}
            {activeRefinements.city && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.city}</Badge>}
            {activeRefinements.state && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.state}</Badge>}
            {activeRefinements.religion && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.religion}</Badge>}
            {activeRefinements.education && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.education}</Badge>}
            {activeRefinements.marital_status && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.marital_status}</Badge>}
            {activeRefinements.personality_type && <Badge variant="outline" className="text-xs text-primary border-primary/30">{activeRefinements.personality_type}</Badge>}
            {activeRefinements.min_compatibility && <Badge variant="outline" className="text-xs text-primary border-primary/30">≥ {activeRefinements.min_compatibility}%</Badge>}
            <button onClick={handleResetRefinements} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <Heart className="w-16 h-16 text-primary/30 mx-auto" />
            {refinementsApplied ? (
              <>
                <h2 className="font-heading text-2xl text-muted-foreground">No matches found</h2>
                <p className="text-muted-foreground">Try broadening your preferences for more results</p>
                <Button onClick={handleResetRefinements} variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Reset Refinements
                </Button>
              </>
            ) : (
              <>
                <h2 className="font-heading text-2xl text-muted-foreground">No matches yet</h2>
                <p className="text-muted-foreground">Complete your psychometric assessment to start matching</p>
                <Link to="/onboarding/psychometric">
                  <Button>Take Assessment</Button>
                </Link>
              </>
            )}
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
        {userTier === 'free' && matches.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-primary-foreground text-center space-y-4">
            <h3 className="font-heading text-2xl">Want More Connections?</h3>
            <p className="text-primary-foreground/80">Free plan includes 3 connection requests per month. Upgrade for unlimited interests &amp; deeper refinement options.</p>
            <Link to="/subscription">
              <Button variant="secondary" size="lg">See Plans</Button>
            </Link>
          </div>
        )}
      </main>

      {/* ── Refinement Slide-over ── */}
      <RefinementPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        refinements={refinements}
        onChange={setRefinements}
        onApply={handleApplyRefinements}
        onReset={handleResetRefinements}
        userTier={userTier}
        activeCount={activeCount}
      />
    </div>
  );
};

export default MatchesPage;
