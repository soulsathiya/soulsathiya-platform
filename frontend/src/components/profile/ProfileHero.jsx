import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, MapPin, Briefcase, GraduationCap,
  Heart, Brain, Lock, Edit2, Zap,
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

export const calcReadinessScore = (profileData, photos) => {
  let s = 38;
  if (profileData?.bio?.trim())           s += 16;
  if (photos?.length >= 1)                s += 10;
  if (photos?.length >= 3)                s += 10;
  if (profileData?.occupation)            s += 8;
  if (profileData?.education_level)       s += 6;
  if (profileData?.city)                  s += 4;
  if (profileData?.religion)              s += 4;
  if (profileData?.hobbies?.length > 0)   s += 4;
  return Math.min(100, s);
};

const scoreColor = (s) => {
  if (s >= 80) return { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', label: 'Highly Ready' };
  if (s >= 60) return { bar: 'from-primary to-yellow-400',   text: 'text-primary',     label: 'Ready'        };
  return             { bar: 'from-orange-500 to-amber-400',  text: 'text-orange-400',  label: 'Building'     };
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfileHero = ({
  user, profileData, photos, age,
  isOwnProfile, targetUserId, interestSent, onSendInterest,
}) => {
  const primaryPhoto  = photos?.find(p => p.is_primary)?.s3_url;
  const avatarSrc     = user?.picture || primaryPhoto;
  const readiness     = calcReadinessScore(profileData, photos);
  const sc            = scoreColor(readiness);

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
            </div>
          </div>
        </div>

        {/* ── Readiness Score ── */}
        <div className="mt-5 p-4 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${sc.text}`} />
              <span className="text-xs font-semibold text-foreground">Relationship Readiness</span>
            </div>
            <span className={`text-sm font-bold tabular-nums ${sc.text}`}>{readiness}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${sc.bar} transition-all duration-700`}
              style={{ width: `${readiness}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5">
            {sc.label} · Based on profile completeness &amp; psychographic signals
          </p>
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
