import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Briefcase, GraduationCap, Heart, MessageCircle, Lock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const EDU_MAP = {
  high_school: 'High School',
  diploma: 'Diploma',
  bachelors: "Bachelor's Degree",
  masters: "Master's Degree",
  phd: 'PhD',
  mbbs: 'MBBS',
  ca: 'CA',
  other: 'Other',
};

const formatEdu = v => EDU_MAP[v?.toLowerCase()] || v;

const AI_TAGLINES = [
  'Thoughtful, grounded, and ready for something real.',
  'Looking for a partner who values depth over surface.',
  'Values-driven. Emotionally aware. Ready for forever.',
  'Building a life with intention and heart.',
  'Genuine connection over everything else.',
];

const getTagline = (name) => {
  if (!name) return AI_TAGLINES[0];
  const idx = name.charCodeAt(0) % AI_TAGLINES.length;
  return AI_TAGLINES[idx];
};

const ProfileHero = ({ user, profileData, photos, age, isOwnProfile, targetUserId, interestSent, onSendInterest }) => {
  const primaryPhoto = photos?.find(p => p.is_primary)?.s3_url;
  const avatarSrc = user?.picture || primaryPhoto;

  return (
    <div className="card-surface rounded-2xl overflow-hidden mb-6">
      {/* Gradient top band */}
      <div
        className="h-28 w-full"
        style={{ background: 'linear-gradient(135deg, #1a2340 0%, #0c1323 40%, #1c1608 100%)' }}
      >
        <div className="h-full w-full opacity-20"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, #D4A520 0%, transparent 70%)' }} />
      </div>

      <div className="px-6 pb-8 -mt-14">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={avatarSrc} />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary font-heading">
                {user?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            {user?.is_verified && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 sm:pt-10">
            <div className="flex items-center flex-wrap gap-2 mb-0.5">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {user?.full_name}
              </h1>
              {user?.is_verified && (
                <Badge className="bg-green-900/40 text-green-400 border border-green-700/40 text-xs">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
              {age && <span className="font-medium text-foreground/80">{age} yrs</span>}
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

            {/* AI tagline */}
            <p className="text-sm text-muted-foreground/70 italic mb-4 max-w-md">
              "{getTagline(user?.full_name)}"
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          {isOwnProfile ? (
            <Link to="/edit-profile">
              <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Button>
            </Link>
          ) : (
            <>
              <Button
                size="sm"
                onClick={onSendInterest}
                disabled={interestSent}
                className="btn-primary gap-2 shadow-lg shadow-primary/20 font-semibold"
              >
                <Heart className="w-4 h-4" />
                {interestSent ? 'Interest Sent' : 'Express Interest'}
              </Button>
              <Link to={`/messages/${targetUserId}`}>
                <Button size="sm" variant="outline" className="gap-2 border-border/60 hover:border-primary/40">
                  <MessageCircle className="w-4 h-4" /> Start Conversation
                </Button>
              </Link>
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
