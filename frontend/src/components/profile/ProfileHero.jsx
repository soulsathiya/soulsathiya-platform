import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Briefcase, GraduationCap,
  Heart, Brain, Lock, Edit2, Zap, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ── Helpers ───────────────────────────────────────────────────────────────────
const EDU_MAP = {
  high_school: 'High School', diploma: 'Diploma',
  bachelors: "Bachelor's", masters: "Master's", phd: 'PhD',
  mbbs: 'MBBS', ca: 'CA', other: 'Other',
};
const formatEdu = v => EDU_MAP[v?.toLowerCase()] || v;

export const calcProfileStrength = (profileData, photos) => {
  let s = 38;
  if (profileData?.bio?.trim())           s += 16;
  if (photos?.length >= 1)                s += 10;
  if (photos?.length >= 3)                s += 10;
  if (profileData?.occupation)            s += 8;
  if (profileData?.education_level)       s += 6;
  if (profileData?.city)                  s += 4;
  if (profileData?.religion)              s += 4;
  if (profileData?.hobbies?.length > 0)   s += 4;
  if (profileData?.linkedin_url)         s += 4;
  return Math.min(100, s);
};

const strengthBadge = (s) => {
  if (s >= 70) return { icon: '🟢', text: 'text-emerald-400', label: 'Strong Profile',  hint: "You're ready to receive great matches" };
  if (s >= 50) return { icon: '🟡', text: 'text-yellow-400',  label: 'Growing Profile', hint: 'Add a bit more to attract better matches' };
  return             { icon: '🔵', text: 'text-sky-400',      label: 'New Profile',     hint: 'Complete your profile to start matching' };
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfileHero = ({
  user, profileData, photos, age,
  isOwnProfile, targetUserId, interestSent, onSendInterest,
}) => {
  const primaryPhoto  = photos?.find(p => p.is_primary)?.s3_url;
  const avatarSrc     = user?.picture || primaryPhoto;
  const strength      = calcProfileStrength(profileData, photos);
  const sb            = strengthBadge(strength);

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 border border-white/10"
      style={{ background: 'linear-gradient(160deg, #111827 0%, #0c1323 55%, #1a1208 100%)' }}
    >
      {/* ── Gold glow band ── */}
      <div
        className="h-32 w-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2340 0%, #0c1323 50%, #1c1608 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-25"
          style={{ background: 'radial-gradient(ellipse at 65% 60%, #D4A520 0%, transparent 65%)' }}
        />
        {/* AI badge — top right */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-primary font-medium tracking-wide">AI Intelligence Profile</span>
        </div>
      </div>

      <div className="px-6 pb-8 -mt-16 relative">
        <div className="flex flex-col sm:flex-row items-start gap-5">

          {/* ── Avatar ── */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-2xl">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary font-heading">
                {user?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            {user?.is_verified && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-background flex items-center justify-center shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>

          {/* ── Name + meta ── */}
          <div className="flex-1 pt-2 sm:pt-12 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {user?.full_name}
              </h1>
              {user?.is_verified && (
                <Badge className="bg-green-900/40 text-green-400 border border-green-700/40 text-xs">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>

            {/* Tagline */}
            <p className="text-xs text-primary/60 font-medium tracking-wide mb-3">
              AI-powered compatibility profile based on emotional &amp; relationship intelligence
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {age && <span className="font-semibold text-foreground/80">{age} yrs</span>}
              {profileData?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary/70" />
                  {profileData.city}{profileData.state ? `, ${profileData.state}` : ''}
                </span>
              )}
              {profileData?.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-primary/70" />
                  {profileData.occupation}
                </span>
              )}
              {profileData?.education_level && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-primary/70" />
                  {formatEdu(profileData.education_level)}
                </span>
              )}
              {profileData?.linkedin_url && (
                <a
                  href={profileData.linkedin_url.startsWith('http') ? profileData.linkedin_url : `https://${profileData.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary/70 hover:text-primary transition-colors"
                  title="Professional Profile Linked"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-xs">Professional Profile</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Strength Badge ── */}
        <div className="mt-5 p-4 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-lg">{sb.icon}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-bold ${sb.text}`}>{sb.label}</span>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{sb.hint}</p>
            </div>
          </div>
        </div>

        {/* ── CTA Buttons ── */}
        <div className="flex flex-wrap gap-3 mt-5">
          {isOwnProfile ? (
            <Link to="/edit-profile">
              <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Button>
            </Link>
          ) : (
            <>
              {/* Primary */}
              <Button
                size="sm"
                onClick={onSendInterest}
                disabled={interestSent}
                className="btn-primary gap-2 shadow-lg shadow-primary/25 font-semibold"
              >
                <Heart className="w-4 h-4" />
                {interestSent ? 'Interest Sent' : 'Show Interest'}
              </Button>

              {/* Secondary — scrolls to CompatibilityCard */}
              <a href="#compatibility-section">
                <Button size="sm" variant="outline" className="gap-2 border-sky-700/40 text-sky-400 hover:bg-sky-900/20 hover:border-sky-600/60">
                  <Brain className="w-4 h-4" /> View Compatibility
                </Button>
              </a>

              {/* Tertiary */}
              <Link to="/insights">
                <Button size="sm" variant="ghost" className="gap-2 text-primary/80 hover:text-primary hover:bg-primary/10 border border-primary/20">
                  <Lock className="w-4 h-4" /> Unlock Full Report ₹999
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
