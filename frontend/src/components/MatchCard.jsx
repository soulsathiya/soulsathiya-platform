import React, { useState } from 'react';
import { Heart, MapPin, Briefcase, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DeepExplorationCTA from './DeepExplorationCTA';
import { getOverallInsight } from '../utils/compatibilityInsights';

// Derive a short compatibility headline + strengths from the score
const getCompatibilityInsight = (score) => {
  if (score >= 88) return { headline: 'Exceptional Match', strengths: ['Life Goals', 'Emotional Style'] };
  if (score >= 78) return { headline: 'Strong Alignment', strengths: ['Communication', 'Values'] };
  if (score >= 65) return { headline: 'Good Compatibility', strengths: ['Family Values', 'Lifestyle'] };
  return { headline: 'Potential Match', strengths: ['Shared Interests'] };
};

const getScoreColors = (score) => {
  if (score >= 85) return { bar: 'from-primary to-secondary', text: 'text-primary', bg: 'bg-primary/15 border-primary/40' };
  if (score >= 70) return { bar: 'from-primary/80 to-secondary/80', text: 'text-primary', bg: 'bg-primary/10 border-primary/25' };
  if (score >= 55) return { bar: 'from-primary/60 to-secondary/50', text: 'text-primary/80', bg: 'bg-primary/8 border-primary/20' };
  return { bar: 'from-muted to-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted/20 border-muted/30' };
};

const getArchetypeLabel = (archetype) => {
  const map = {
    nurturing_anchor: 'Nurturing Anchor',
    passionate_catalyst: 'Passionate Catalyst',
    intellectual_companion: 'Intellectual Companion',
    adventurous_spirit: 'Adventurous Spirit',
    harmonizer: 'Harmonizer',
    independent_partner: 'Independent Partner',
    devoted_traditionalist: 'Devoted Traditionalist',
  };
  return map[archetype] || archetype?.replace(/_/g, ' ');
};

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// ─────────────────────────────────────────────────────────────────────────────

const MatchCard = ({
  match,
  userTier = 'free',
  onViewProfile,
  onSendInterest,
  showDeepCTA = true,
  compact = false,
}) => {
  const [showDeepSection, setShowDeepSection] = useState(false);

  const {
    user = {},
    profile_preview = {},
    compatibility_score,
    psychometric_score,
    archetype,
    is_boosted,
    distance_km,
  } = match;

  const age = calculateAge(profile_preview?.date_of_birth);
  const score = psychometric_score || compatibility_score || 0;
  const colors = getScoreColors(score);
  const insight = getCompatibilityInsight(score);

  /* ── Compact variant ─────────────────────────────────────────────── */
  if (compact) {
    return (
      <div className="card-surface rounded-xl p-4 hover:border-primary/30 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-primary/20 bg-muted">
              {user.picture ? (
                <img src={user.picture} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {user.full_name?.[0]}
                </div>
              )}
            </div>
            {is_boosted && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow">
                <Zap className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-semibold text-foreground truncate">{user.full_name}</h3>
              {user.is_verified && (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {age && `${age} • `}{profile_preview?.city || 'Location hidden'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold border ${colors.bg} ${colors.text}`}>
            {score}%
          </div>
        </div>
      </div>
    );
  }

  /* ── Full card ───────────────────────────────────────────────────── */
  return (
    <div
      className="card-surface rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-primary/25 transition-all duration-300 flex flex-col"
      data-testid={`match-card-${user.user_id}`}
    >
      {/* Boosted banner */}
      {is_boosted && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1 tracking-wide">
          <Zap className="w-3 h-3" /> BOOSTED PROFILE
        </div>
      )}

      {/* Photo section */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.full_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl font-bold text-muted-foreground/30 bg-gradient-to-br from-muted to-card">
            {user.full_name?.[0]}
          </div>
        )}

        {/* Gradient overlay at bottom of photo */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/70 to-transparent" />

        {/* Verified badge — top left */}
        {user.is_verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </div>
        )}

        {/* Compatibility score — top right */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border shadow-lg backdrop-blur-sm ${colors.bg} ${colors.text}`}>
          <Heart className="w-3.5 h-3.5" />
          {score}%
        </div>
      </div>

      {/* Info section */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* Name + location */}
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
            {user.full_name}{age && `, ${age}`}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{profile_preview?.city || 'Location hidden'}</span>
            {distance_km && <span className="text-muted-foreground/60">• {distance_km} km</span>}
          </div>
          {profile_preview?.occupation && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profile_preview.occupation}</span>
            </div>
          )}
        </div>

        {/* Archetype badge */}
        {archetype && (
          <Badge className="bg-primary/10 text-primary border border-primary/20 w-fit text-xs font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            {getArchetypeLabel(archetype)}
          </Badge>
        )}

        {/* Compatibility insight block */}
        <div className="bg-muted/50 border border-primary/10 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compatibility</span>
            <span className={`text-sm font-bold ${colors.text}`}>{score}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-700`}
              style={{ width: `${score}%` }}
            />
          </div>
          {/* Insight headline + strengths + human sentence */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">{insight.headline}</p>
            <p className="text-xs text-muted-foreground">
              {score >= 65 ? 'Strong alignment' : 'Some alignment'}: {insight.strengths.join(' • ')}
            </p>
            <p className="text-xs text-muted-foreground/80 italic leading-snug line-clamp-2">
              {getOverallInsight(score)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <Button
            variant="outline"
            className="flex-1 border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40 text-sm"
            onClick={() => onViewProfile && onViewProfile(user.user_id)}
            data-testid={`view-profile-${user.user_id}`}
          >
            View Profile
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 text-sm font-semibold"
            onClick={() => onSendInterest && onSendInterest(user.user_id)}
            data-testid={`send-interest-${user.user_id}`}
          >
            <Heart className="w-3.5 h-3.5 mr-1.5" /> Connect
          </Button>
        </div>

        {/* Deep Exploration CTA */}
        {showDeepCTA && (
          <div className="pt-3 border-t border-primary/10">
            <button
              onClick={() => setShowDeepSection(!showDeepSection)}
              className="w-full text-xs text-primary/80 hover:text-primary font-medium flex items-center justify-center gap-1.5 transition-colors"
              data-testid={`deep-cta-toggle-${user.user_id}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showDeepSection ? 'Hide Deep Compatibility' : 'Explore Deeper Compatibility'}
            </button>

            {showDeepSection && (
              <div className="mt-3 p-3 bg-muted/40 rounded-xl border border-primary/10">
                <DeepExplorationCTA
                  partnerId={user.user_id}
                  userTier={userTier}
                  compact={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
